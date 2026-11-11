import json
import logging
import traceback
from fastapi import APIRouter, HTTPException, Body
from fastapi.responses import JSONResponse
from schemas.chat import ChatRequest, ChatResponse
from engines.engine import process_request, execute_task_directly
from pydantic import BaseModel
from typing import Dict, Any, Optional

class ActionExecuteRequest(BaseModel):
    intent: str
    parameters: Dict[str, Any] = {}
    auth_token: Optional[str] = ""
    language: Optional[str] = "en"
    user_context: Optional[Dict[str, Any]] = None
    current_page_context: Optional[Dict[str, Any]] = None

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def process_chat(request: ChatRequest):
    """
    Standard text-based endpoint mapping to the deterministic Task Engine.
    """
    try:
        page_ctx = request.current_page_context
        if isinstance(page_ctx, str):
            try:
                page_ctx = json.loads(page_ctx)
            except Exception:
                page_ctx = {}

        # Run deterministic intent classification engine
        result = process_request(
            message=request.message,
            history=request.history or [],
            user_context=request.user_context or {},
            page_context=page_ctx or {},
            auth_token=request.auth_token or "",
            language=request.language or "en",
            pending_action=request.pending_action,
            conversation_summary=request.conversation_summary or "",
            context_facts=request.context_facts or {}
        )

        # If the underlying processing failed, return an explicit error HTTP status code (500)
        if not result.get("success", True):
            error_details = {
                "session_id": request.session_id,
                "reply": result.get("reply", "An error occurred while processing your request."),
                "intent": result.get("intent", "ERROR"),
                "action": None,
                "requires_confirmation": False,
                "pending_action": None,
                "success": False,
                "error": result.get("error", "AIProcessingError"),
                "module": result.get("module", "engine"),
                "task": result.get("task", "identify_intent"),
                "details": result.get("details", "")
            }
            logger.error(f"[AI Router] Request returned failure: {error_details}")
            return JSONResponse(status_code=500, content=error_details)

        return ChatResponse(
            session_id=request.session_id,
            reply=result.get("reply", "No response generated."),
            intent=result.get("intent", "UNKNOWN"),
            structured_data=result.get("structured_data"),
            action=result.get("action"),
            requires_confirmation=result.get("requires_confirmation", False),
            pending_action=result.get("pending_action"),
            conversation_summary=result.get("conversation_summary"),
            context_facts=result.get("context_facts"),
            success=True,
            error=None,
            module=result.get("module"),
            task=result.get("task"),
            details=result.get("details")
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("=" * 50)
        logger.error("FATAL ERROR IN AI SERVER ROUTER")
        logger.error("=" * 50)
        logger.error(f"Chat ID: {request.session_id}")
        logger.error(f"Request Body: {request.model_dump_json(indent=2)}")
        logger.error("TRACEBACK:")
        logger.error(traceback.format_exc())
        logger.error("=" * 50)

        error_details = {
            "session_id": request.session_id,
            "reply": "An internal error occurred while processing your request.",
            "intent": "ERROR",
            "action": None,
            "success": False,
            "error": type(e).__name__,
            "module": "ai_router",
            "task": "process_chat",
            "details": str(e)
        }
        return JSONResponse(status_code=500, content=error_details)

@router.post("/action/execute")
async def execute_action(request: ActionExecuteRequest):
    """
    Executes a confirmed task after explicit farmer confirmation.
    """
    try:
        context = {
            "auth_token": request.auth_token or "",
            "user": request.user_context or {},
            "page": request.current_page_context or {},
            "language": request.language or "en"
        }
        result = execute_task_directly(request.intent, request.parameters, context)
        return {
            "success": result.get("success", False),
            "reply": result.get("message", "Task completed."),
            "action": result.get("action"),
            "data": result.get("data") or result.get("structured_data")
        }
    except Exception as e:
        logger.error(f"[AI Router] Action execution error: {e}")
        return JSONResponse(status_code=500, content={
            "success": False,
            "reply": f"Execution failed: {str(e)}",
            "error": str(e)
        })
