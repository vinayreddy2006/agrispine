import json
import time
import logging
import traceback
from typing import Dict, Any, List, Optional
from core.task_registry import TASK_REGISTRY
from schemas.chat import ChatMessage
from core.config import settings
from core.engines import HuggingFaceEngine, GeminiEngine, GroqEngine, AIEngine
from prompts.system_prompts import build_system_prompt
from core.action_validator import (
    DATA_MODIFYING_INTENTS,
    validate_action,
    normalize_parameters,
    generate_missing_info_question,
    build_confirmation_card_data
)

logger = logging.getLogger(__name__)

def get_engine() -> AIEngine:
    """
    Instantiates the configured AI Engine according to AI_PROVIDER.
    Supported providers: 'groq' (default), 'huggingface' (or 'hf'), 'gemini'.
    """
    provider = (settings.AI_PROVIDER or "groq").lower().strip()
    logger.info(f"[Engine] Resolving AI Engine for provider: '{provider}'")

    if provider == "groq":
        return GroqEngine()
    elif provider in ("huggingface", "hf"):
        return HuggingFaceEngine()
    elif provider == "gemini":
        return GeminiEngine()
    else:
        raise ValueError(
            f"Invalid AI_PROVIDER '{provider}'. Supported values are 'groq', 'huggingface', or 'gemini'."
        )

# Initialize active engine with lazy fallback if key is not yet populated
try:
    active_engine = get_engine()
    logger.info(f"[Engine] Active AI Engine initialized successfully: {active_engine.__class__.__name__}")
except Exception as e:
    logger.warning(f"[Engine] Could not initialize engine at module load ({e}). Will attempt on demand.")
    active_engine = None

def is_confirmation_message(text: str) -> bool:
    """Checks for explicit confirmation words across English, Telugu, and Hindi."""
    norm = text.lower().strip()
    confirm_keywords = [
        "confirm", "yes", "proceed", "add it", "sure", "okay", "ok", "do it", "go ahead",
        "సరే", "ధృవీకరించండి", "అవును", "చేయండి", "జోడించండి", "నిర్ధారించండి", "సరే చేయండి",
        "हाँ", "कन्फर्म", "जोड़ो", "करो", "पुष्टि करें", "आगे बढ़ो", "ठीक है", "हाँ जोड़ दो"
    ]
    return any(norm == k or norm.startswith(k + " ") or norm.endswith(" " + k) for k in confirm_keywords)

def is_cancellation_message(text: str) -> bool:
    """Checks for explicit cancellation words across English, Telugu, and Hindi."""
    norm = text.lower().strip()
    cancel_keywords = [
        "cancel", "no", "don't add", "stop", "abort", "discard", "nevermind",
        "వద్దు", "రద్దు చేయండి", "రద్దు", "ఆపండి", "వద్దు లెండి", "వద్దు వద్దు",
        "नहीं", "रद्द", "रद्द करें", "मत जोड़ो", "रोकें", "मत करो", "रहने दो"
    ]
    return any(norm == k or norm.startswith(k + " ") or norm.endswith(" " + k) for k in cancel_keywords)

def execute_task_directly(intent: str, params: dict, context: dict) -> dict:
    """Executes a registered task function safely."""
    if intent not in TASK_REGISTRY:
        return {"success": False, "message": f"Task '{intent}' is not registered."}

    task_func = TASK_REGISTRY[intent]
    try:
        result = task_func(params, context)
        return result
    except Exception as e:
        logger.error(f"[Engine] Error executing task {intent}: {e}")
        logger.error(traceback.format_exc())
        return {"success": False, "message": str(e)}

def process_request(
    message: str, 
    history: List[ChatMessage], 
    user_context: dict, 
    page_context: dict, 
    auth_token: str,
    language: str = "en",
    pending_action: Optional[dict] = None,
    conversation_summary: str = "",
    context_facts: Optional[dict] = None
) -> dict:
    
    global active_engine
    context = {"auth_token": auth_token, "user": user_context, "page": page_context, "language": language}
    lang_code = language[:2].lower() if language else "en"

    # =========================================================================
    # 1. PENDING ACTION HANDLING (Human-in-the-Loop Fast-Path)
    # =========================================================================
    if pending_action and pending_action.get("status") in ["pending_confirmation", "needs_info"]:
        action_intent = pending_action.get("intent")
        extracted_params = pending_action.get("extracted_params", {})

        # Fast-Path: Unambiguous Cancellation
        if is_cancellation_message(message):
            reply_map = {
                "en": "The pending action has been cancelled.",
                "te": "చర్య రద్దు చేయబడింది.",
                "hi": "कार्य रद्द कर दिया गया है।"
            }
            return {
                "reply": reply_map.get(lang_code, reply_map["en"]),
                "intent": "CANCEL_ACTION",
                "action": None,
                "requires_confirmation": False,
                "pending_action": None,
                "success": True
            }

        # Fast-Path: Unambiguous Confirmation (only valid if all mandatory fields present)
        if pending_action.get("status") == "pending_confirmation" and is_confirmation_message(message):
            logger.info(f"[Engine] Farmer confirmed pending action {action_intent} with params: {extracted_params}")
            exec_result = execute_task_directly(action_intent, extracted_params, context)
            if exec_result.get("success"):
                success_msg = exec_result.get("message", "Task completed successfully.")
                return {
                    "reply": success_msg,
                    "intent": action_intent,
                    "structured_data": exec_result.get("structured_data"),
                    "action": exec_result.get("action"),
                    "requires_confirmation": False,
                    "pending_action": None,
                    "success": True
                }
            else:
                fail_msg = exec_result.get("message", "Execution failed on backend.")
                return {
                    "reply": f"Execution failed: {fail_msg}. Would you like to try again or edit details?",
                    "intent": action_intent,
                    "action": None,
                    "requires_confirmation": True,
                    "pending_action": pending_action,
                    "success": False,
                    "error": "TaskExecutionFailed",
                    "details": fail_msg
                }

    # =========================================================================
    # 2. RESOLVE OR RELOAD AI ENGINE
    # =========================================================================
    engine = active_engine
    if engine is None:
        try:
            engine = get_engine()
            active_engine = engine
        except Exception as e:
            provider = settings.AI_PROVIDER or "groq"
            logger.error(f"[Engine] Failed to initialize AI provider '{provider}': {e}")
            
            reply_msg = (
                f"GramSathi AI is currently configuring the '{provider}' provider. "
                f"Please ensure your API credentials (e.g. GROQ_API_KEY) are set in the ai/.env file."
            )
            if lang_code == "te":
                reply_msg = f"గ్రామసాథి AI '{provider}' కాన్ఫిగర్ అవుతోంది. దయచేసి API కీని ai/.env లో తనిఖీ చేయండి."
            elif lang_code == "hi":
                reply_msg = f"ग्रामसाथी AI '{provider}' सेवा कॉन्फ़िगर हो रही है। कृपया ai/.env में API कुंजी की पुष्टि करें।"

            return {
                "reply": reply_msg,
                "intent": "CONFIG_ERROR",
                "action": None,
                "requires_confirmation": False,
                "pending_action": None,
                "success": False,
                "error": "ProviderConfigurationError",
                "module": "engine",
                "task": "get_engine",
                "details": str(e)
            }

    # =========================================================================
    # 3. BUILD CONVERSATION SYSTEM PROMPT & CLASSIFY INTENT
    # =========================================================================
    registry_keys = ["GREETING", "GENERAL_CONVERSATION", "CHAT"] + list(TASK_REGISTRY.keys())
    system_prompt = build_system_prompt(
        user_context=user_context,
        page_context=page_context,
        registry_keys=registry_keys,
        language=language,
        pending_action=pending_action,
        conversation_summary=conversation_summary,
        context_facts=context_facts
    )

    try:
        classification = engine.identify_intent(
            message=message,
            history=history,
            user_context=user_context,
            page_context=page_context,
            system_prompt=system_prompt
        )
    except Exception as e:
        logger.error("="*50)
        logger.error("ERROR DURING INTENT CLASSIFICATION")
        logger.error(f"Engine: {engine.__class__.__name__}")
        logger.error(traceback.format_exc())
        logger.error("="*50)

        err_details = str(e)
        user_reply = "I apologize, but I encountered an error while processing your query. Please try asking again."
        if lang_code == "te":
            user_reply = "క్షమించండి, మీ ప్రశ్నను ప్రాసెస్ చేయడంలో లోపం ఎదురైంది. దయచేసి మళ్ళీ అడగండి."
        elif lang_code == "hi":
            user_reply = "क्षमा करें, आपके अनुरोध को संसाधित करते समय एक त्रुटि आई। कृपया पुनः प्रयास करें।"

        return {
            "reply": user_reply,
            "intent": "ERROR",
            "action": None,
            "requires_confirmation": False,
            "pending_action": pending_action,
            "success": False,
            "error": type(e).__name__,
            "module": "engine",
            "task": "identify_intent",
            "details": err_details
        }

    raw_intent = (classification.intent or "CHAT").strip().upper()
    extracted_params = classification.parameters or {}

    # =========================================================================
    # 4. HANDLE CONFIRM / CANCEL FROM LLM CLASSIFICATION
    # =========================================================================
    if raw_intent == "CONFIRM_ACTION" and pending_action:
        action_intent = pending_action.get("intent")
        params = pending_action.get("extracted_params", {})
        exec_result = execute_task_directly(action_intent, params, context)
        if exec_result.get("success"):
            return {
                "reply": exec_result.get("message", "Task completed successfully."),
                "intent": action_intent,
                "structured_data": exec_result.get("structured_data"),
                "action": exec_result.get("action"),
                "requires_confirmation": False,
                "pending_action": None,
                "success": True
            }
        else:
            return {
                "reply": f"Execution failed: {exec_result.get('message')}. Please try again.",
                "intent": action_intent,
                "action": None,
                "requires_confirmation": True,
                "pending_action": pending_action,
                "success": False
            }

    if raw_intent == "CANCEL_ACTION" and pending_action:
        reply_map = {
            "en": "The pending action has been cancelled.",
            "te": "చర్య రద్దు చేయబడింది.",
            "hi": "कार्य रद्द कर दिया गया है।"
        }
        return {
            "reply": reply_map.get(lang_code, reply_map["en"]),
            "intent": "CANCEL_ACTION",
            "action": None,
            "requires_confirmation": False,
            "pending_action": None,
            "success": True
        }

    # =========================================================================
    # 5. HANDLE EDIT / UPDATE PARAMETERS FOR ACTIVE PENDING ACTION
    # =========================================================================
    if pending_action and (raw_intent in ["UPDATE_ACTION_PARAMS", "EDIT_ACTION", pending_action.get("intent")] or len(extracted_params) > 0):
        action_intent = pending_action.get("intent")
        merged_params = dict(pending_action.get("extracted_params", {}))
        
        # Merge new normalized parameters
        norm_incoming = normalize_parameters(action_intent, extracted_params)
        for k, v in norm_incoming.items():
            if v is not None and v != "":
                merged_params[k] = v

        is_complete, missing_fields, final_params = validate_action(
            action_intent, merged_params, language, user_context=user_context, page_context=page_context
        )
        
        if is_complete:
            action_id = pending_action.get("action_id", f"act_{int(time.time()*1000)}")
            card = build_confirmation_card_data(action_id, action_intent, final_params, language)
            
            confirm_prompts = {
                "en": f"I have updated the details for {card.get('title')}. Please review the details above and confirm.",
                "te": f"నేను {card.get('title')} వివరాలను నవీకరించాను. దయచేసి వివరాలను పరిశీలించి ధృవీకరించండి.",
                "hi": f"मैंने {card.get('title')} के विवरण अपडेट कर दिए हैं। कृपया विवरण की समीक्षा करें और पुष्टि करें।"
            }
            return {
                "reply": confirm_prompts.get(lang_code, confirm_prompts["en"]),
                "intent": action_intent,
                "action": {
                    "type": "CONFIRMATION_REQUIRED",
                    "pending_action": card
                },
                "requires_confirmation": True,
                "pending_action": card,
                "success": True
            }
        else:
            q = generate_missing_info_question(action_intent, missing_fields, final_params, language)
            updated_pending = {
                "action_id": pending_action.get("action_id", f"act_{int(time.time()*1000)}"),
                "intent": action_intent,
                "status": "needs_info",
                "extracted_params": final_params,
                "missing_fields": missing_fields
            }
            return {
                "reply": q,
                "intent": action_intent,
                "action": None,
                "requires_confirmation": False,
                "pending_action": updated_pending,
                "success": True
            }

    # =========================================================================
    # 6. CONVERSATIONAL INTENTS (GREETING, GENERAL_CONVERSATION, CHAT)
    # =========================================================================
    if raw_intent in ("GREETING", "GENERAL_CONVERSATION", "CHAT") or raw_intent not in TASK_REGISTRY:
        return {
            "reply": classification.chat_reply or "Hello! I am GramSathi, your AgriSpine farming assistant.",
            "intent": raw_intent,
            "action": None,
            "requires_confirmation": False,
            "pending_action": None,
            "success": True
        }

    # =========================================================================
    # 7. READ-ONLY ACTIONS (Execute directly without confirmation)
    # =========================================================================
    READ_ONLY_INTENTS = [
        "NAVIGATE", "WEATHER_GET", "MACHINERY_SEARCH", "MACHINERY_OPEN",
        "MACHINERY_MY_BOOKINGS", "CROP_OPEN", "MESSENGER_OPEN",
        "MARKET_VIEW_LISTINGS", "MARKET_MANDI_RATES", "SCHEMES_LIST",
        "GROUP_SHOW_EARNINGS"
    ]
    if raw_intent in READ_ONLY_INTENTS:
        result = execute_task_directly(raw_intent, extracted_params, context)
        return {
            "reply": result.get("message", "Task completed."),
            "intent": raw_intent,
            "structured_data": result.get("structured_data") or result.get("data"),
            "action": result.get("action"),
            "requires_confirmation": False,
            "pending_action": None,
            "success": result.get("success", True)
        }

    # =========================================================================
    # 8. DATA-MODIFYING ACTIONS (Strict Human-in-the-Loop Confirmation)
    # =========================================================================
    if raw_intent in DATA_MODIFYING_INTENTS:
        is_complete, missing_fields, norm_params = validate_action(
            raw_intent, extracted_params, language, user_context=user_context, page_context=page_context
        )

        if not is_complete:
            # Need more details from the farmer
            q = generate_missing_info_question(raw_intent, missing_fields, norm_params, language)
            action_id = f"act_{int(time.time()*1000)}"
            new_pending = {
                "action_id": action_id,
                "intent": raw_intent,
                "status": "needs_info",
                "extracted_params": norm_params,
                "missing_fields": missing_fields
            }
            logger.info(f"[Engine] Data-modifying action {raw_intent} is missing fields {missing_fields}. Asking: {q}")
            return {
                "reply": q,
                "intent": raw_intent,
                "action": None,
                "requires_confirmation": False,
                "pending_action": new_pending,
                "success": True
            }
        else:
            # All mandatory details present! Build confirmation card and wait for farmer confirmation.
            action_id = f"act_{int(time.time()*1000)}"
            card = build_confirmation_card_data(action_id, raw_intent, norm_params, language)
            
            confirm_prompts = {
                "en": f"I have prepared the details for {card.get('title')}. Please review the card above and confirm.",
                "te": f"నేను {card.get('title')} వివరాలను సిద్ధం చేశాను. దయచేసి వివరాలను పరిశీలించి ధృవీకరించండి.",
                "hi": f"मैंने {card.get('title')} के विवरण तैयार कर लिए हैं। कृपया ऊपर दिए गए विवरण की पुष्टि करें।"
            }
            logger.info(f"[Engine] Action {raw_intent} fully validated. Requesting confirmation with action_id: {action_id}")
            return {
                "reply": confirm_prompts.get(lang_code, confirm_prompts["en"]),
                "intent": raw_intent,
                "action": {
                    "type": "CONFIRMATION_REQUIRED",
                    "pending_action": card
                },
                "requires_confirmation": True,
                "pending_action": card,
                "success": True
            }

    # Fallback for any other registered task: prompt confirmation
    result = execute_task_directly(raw_intent, extracted_params, context)
    return {
        "reply": result.get("message", "Task completed."),
        "intent": raw_intent,
        "action": result.get("action"),
        "requires_confirmation": False,
        "pending_action": None,
        "success": result.get("success", True)
    }
