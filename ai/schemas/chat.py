from pydantic import BaseModel
from typing import Optional, List, Dict, Any, Union

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    session_id: Optional[str] = "default"
    message: str
    history: Optional[List[ChatMessage]] = []
    context: Optional[Dict[str, Any]] = None
    user_context: Optional[Dict[str, Any]] = None
    current_page_context: Optional[Union[str, Dict[str, Any]]] = None
    auth_token: Optional[str] = None
    language: Optional[str] = "en"
    pending_action: Optional[Dict[str, Any]] = None
    conversation_summary: Optional[str] = ""
    context_facts: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    session_id: Optional[str] = None
    reply: Optional[str] = None
    intent: Optional[str] = None
    structured_data: Optional[Dict[str, Any]] = None
    action: Optional[Dict[str, Any]] = None
    requires_confirmation: Optional[bool] = False
    pending_action: Optional[Dict[str, Any]] = None
    conversation_summary: Optional[str] = None
    context_facts: Optional[Dict[str, Any]] = None
    
    # Global Error Handling Fields
    success: Optional[bool] = True
    error: Optional[str] = None
    module: Optional[str] = None
    task: Optional[str] = None
    details: Optional[str] = None
