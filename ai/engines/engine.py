import json
import logging
import traceback
from typing import Dict, Any, List
from core.task_registry import TASK_REGISTRY
from schemas.chat import ChatMessage
from core.config import settings
from core.engines import HuggingFaceEngine, GeminiEngine, GroqEngine, AIEngine
from prompts.system_prompts import build_system_prompt

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

def process_request(
    message: str, 
    history: List[ChatMessage], 
    user_context: dict, 
    page_context: dict, 
    auth_token: str,
    language: str = "en"
) -> dict:
    
    global active_engine
    registry_keys = ["GREETING", "GENERAL_CONVERSATION", "CHAT"] + list(TASK_REGISTRY.keys())
    system_prompt = build_system_prompt(user_context, page_context, registry_keys, language)

    # 1. Resolve or reload engine on demand
    engine = active_engine
    if engine is None:
        try:
            engine = get_engine()
            active_engine = engine
        except Exception as e:
            provider = settings.AI_PROVIDER or "groq"
            logger.error(f"[Engine] Failed to initialize AI provider '{provider}': {e}")
            
            # Farmer-friendly localized reply guidance
            reply_msg = (
                f"GramSathi AI is currently configuring the '{provider}' provider. "
                f"Please ensure your API credentials (e.g. GROQ_API_KEY) are set in the ai/.env file."
            )
            if language == "te":
                reply_msg = f"గ్రామసాథి AI '{provider}' కాన్ఫిగర్ అవుతోంది. దయచేసి API కీని ai/.env లో తనిఖీ చేయండి."
            elif language == "hi":
                reply_msg = f"ग्रामसाथी AI '{provider}' सेवा कॉन्फ़िगर हो रही है। कृपया ai/.env में API कुंजी की पुष्टि करें।"

            return {
                "reply": reply_msg,
                "intent": "CONFIG_ERROR",
                "action": None,
                "success": False,
                "error": "ProviderConfigurationError",
                "module": "engine",
                "task": "get_engine",
                "details": str(e)
            }

    # 2. Identify Intent using the Active Engine
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
        if language == "te":
            user_reply = "క్షమించండి, మీ ప్రశ్నను ప్రాసెస్ చేయడంలో లోపం ఎదురైంది. దయచేసి మళ్ళీ అడగండి."
        elif language == "hi":
            user_reply = "क्षमा करें, आपके अनुरोध को संसाधित करते समय एक त्रुटి आई। कृपया पुनः प्रयास करें।"

        return {
            "reply": user_reply,
            "intent": "ERROR",
            "action": None,
            "success": False,
            "error": type(e).__name__,
            "module": "engine",
            "task": "identify_intent",
            "details": err_details
        }

    intent = (classification.intent or "CHAT").strip().upper()
    params = classification.parameters or {}

    # 3. Conversational intents (GREETING, GENERAL_CONVERSATION, CHAT) or unregistered task intents
    if intent in ("GREETING", "GENERAL_CONVERSATION", "CHAT") or intent not in TASK_REGISTRY:
        return {
            "reply": classification.chat_reply or "Hello! I am GramSathi, your AgriSpine farming assistant.",
            "intent": intent,
            "action": None,
            "success": True
        }

    # 4. Execute Registered Task
    context = {"auth_token": auth_token, "user": user_context, "page": page_context, "language": language}
    task_func = TASK_REGISTRY[intent]

    try:
        result = task_func(params, context)

        # If the task itself returned success: False (handled gracefully by the task)
        if not result.get("success"):
            logger.warning(f"Task {intent} failed gracefully: {result.get('message')}")
            return {
                "reply": f"Failed to complete task: {result.get('message')}",
                "intent": intent,
                "action": None,
                "success": False,
                "error": "TaskExecutionFailed",
                "module": "task_registry",
                "task": intent,
                "details": result.get("message")
            }

        return {
            "reply": result.get("message", "Task completed successfully."),
            "intent": intent,
            "action": result.get("action"),
            "success": True
        }

    except Exception as e:
        logger.error("="*50)
        logger.error("ERROR EXECUTING TASK")
        logger.error(f"Selected Agent: {engine.__class__.__name__}")
        logger.error(f"Detected Intent / Task: {intent}")
        logger.error(f"Tool Input (Parameters): {json.dumps(params, indent=2)}")
        logger.error("TRACEBACK:")
        logger.error(traceback.format_exc())
        logger.error("="*50)

        return {
            "reply": f"I understood your request for {intent}, but an error occurred while executing it: {str(e)}",
            "intent": intent,
            "action": None,
            "success": False,
            "error": type(e).__name__,
            "module": "task_registry",
            "task": intent,
            "details": str(e)
        }
