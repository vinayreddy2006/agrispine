import traceback
from fastapi import APIRouter, HTTPException
from schemas.chat import ChatRequest, ChatResponse
from engines.engine import process_request
import json

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
            except:
                page_ctx = {}
                
        # Run deterministic intent classification engine
        result = process_request(
            message=request.message,
            history=request.history or [],
            user_context=request.user_context or {},
            page_context=page_ctx or {},
            auth_token=request.auth_token or ""
        )
        
        return ChatResponse(
            session_id=request.session_id,
            reply=result.get("reply", "No response generated."),
            intent=result.get("intent", "UNKNOWN"),
            action=result.get("action"),
            success=result.get("success", True),
            error=result.get("error"),
            module=result.get("module"),
            task=result.get("task"),
            details=result.get("details")
        )
    except Exception as e:
        import traceback
        import logging
        
        logger = logging.getLogger(__name__)
        logger.error("="*50)
        logger.error("FATAL ERROR IN AI SERVER ROUTER")
        logger.error("="*50)
        logger.error(f"Chat ID: {request.session_id}")
        logger.error(f"Request Body: {request.model_dump_json(indent=2)}")
        logger.error("TRACEBACK:")
        logger.error(traceback.format_exc())
        logger.error("="*50)
        
        return ChatResponse(
            session_id=request.session_id,
            reply="An internal error occurred while processing your request. Our system logged the issue and we are looking into it.",
            success=False,
            error=type(e).__name__,
            module="ai_router",
            task="process_chat",
            details=str(e)
        )
