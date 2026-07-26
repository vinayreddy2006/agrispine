import json
from typing import Dict, Any, List
from core.task_registry import TASK_REGISTRY
from schemas.chat import ChatMessage
from core.engines import HuggingFaceEngine, GeminiEngine
from prompts.system_prompts import build_system_prompt

# Force the usage of Hugging Face engine for now as per requirements
# Can be switched to GeminiEngine() if needed in the future
active_engine = HuggingFaceEngine()

def process_request(
    message: str, 
    history: List[ChatMessage], 
    user_context: dict, 
    page_context: dict, 
    auth_token: str,
    language: str = "en"
) -> dict:
    
    registry_keys = list(TASK_REGISTRY.keys()) + ["CHAT"]
    system_prompt = build_system_prompt(user_context, page_context, registry_keys, language)
    
    import logging
    import traceback
    logger = logging.getLogger(__name__)
    
    # 1. Identify Intent using the Active Engine
    try:
        classification = active_engine.identify_intent(
            message=message,
            history=history,
            user_context=user_context,
            page_context=page_context,
            system_prompt=system_prompt
        )
    except Exception as e:
        logger.error("="*50)
        logger.error("ERROR DURING INTENT CLASSIFICATION")
        logger.error(f"Engine: {active_engine.__class__.__name__}")
        logger.error(traceback.format_exc())
        logger.error("="*50)
        return {
            "reply": "Sorry, I failed to process your request due to an internal AI error.",
            "intent": "ERROR",
            "action": None,
            "success": False,
            "error": type(e).__name__,
            "module": "engine",
            "task": "identify_intent",
            "details": str(e)
        }
        
    intent = classification.intent
    params = classification.parameters
    
    # 2. General CHAT intent (no tool execution)
    if intent == "CHAT" or intent not in TASK_REGISTRY:
        return {
            "reply": classification.chat_reply or "I'm not sure how to help with that.",
            "intent": "CHAT",
            "action": None,
            "success": True
        }
        
    # 3. Execute Registered Task
    context = {"auth_token": auth_token, "user": user_context, "page": page_context}
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
        logger.error(f"Selected Agent: {active_engine.__class__.__name__}")
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
