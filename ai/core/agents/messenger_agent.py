from typing import Dict, Any
from ..api_client import make_request
from ..context_resolver import resolve_conversation
from ..route_registry import get_frontend_route

def execute_messenger_send(params: dict, context: dict) -> dict:
    auth_token = context.get("auth_token", "")
    receiver_name = params.get("receiverName", "")
    conversation_type = params.get("conversationType", "").lower()
    message = params.get("message", "")
    
    if not receiver_name or not message:
        return {"success": False, "message": "Please provide both receiver name and message."}
        
    success, target_conv_id, target_name, msg = resolve_conversation(receiver_name, conversation_type, auth_token)
    if not success:
        return {"success": False, "message": msg}
        
    # Execute Send Message
    success, result = make_request("POST", "/chat/messages", auth_token, {
        "conversationId": target_conv_id,
        "text": message
    })
    
    if success:
        return {"success": True, "message": f"Message sent successfully to {target_name}.", "action": {"intent": "NAVIGATE", "path": get_frontend_route("messages")}}
    return {"success": False, "message": f"Failed to send message: {result}"}

def execute_messenger_open(params: dict, context: dict) -> dict:
    return {"success": True, "message": "Opening messenger.", "action": {"intent": "NAVIGATE", "path": get_frontend_route("messages")}}

def execute_clear_chat(params: dict, context: dict) -> dict:
    auth_token = context.get("auth_token", "")
    receiver_name = params.get("receiverName", "")
    conversation_type = params.get("conversationType", "").lower()
    
    if not receiver_name:
        return {"success": False, "message": "Please provide receiver name to clear chat."}
        
    success, target_conv_id, target_name, msg = resolve_conversation(receiver_name, conversation_type, auth_token)
    if not success:
        return {"success": False, "message": msg}
        
    success, result = make_request("DELETE", f"/chat/clear/{target_conv_id}", auth_token)
    
    if success:
        return {"success": True, "message": f"Chat with {target_name} cleared.", "action": {"intent": "REFRESH_UI"}}
    return {"success": False, "message": f"Failed to clear chat: {result}"}
