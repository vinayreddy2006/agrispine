from typing import Dict, Any
from ..api_client import make_request

def execute_create_post(params: dict, context: dict) -> dict:
    auth_token = context.get("auth_token", "")
    content = params.get("content")
    if not content: return {"success": False, "message": "Post content is required."}
    
    success, data = make_request("POST", "/community/add", auth_token, {"content": content})
    if success:
        return {"success": True, "message": "Post created successfully.", "action": {"intent": "REFRESH_UI"}}
    return {"success": False, "message": f"Failed to create post: {data}"}

def execute_reply_post(params: dict, context: dict) -> dict:
    auth_token = context.get("auth_token", "")
    post_id = params.get("postId")
    content = params.get("content")
    if not post_id or not content: return {"success": False, "message": "Post ID and reply content are required."}
    
    success, data = make_request("POST", f"/community/reply/{post_id}", auth_token, {"content": content})
    if success:
        return {"success": True, "message": "Replied to post.", "action": {"intent": "REFRESH_UI"}}
    return {"success": False, "message": f"Failed to reply: {data}"}

def execute_create_poll(params: dict, context: dict) -> dict:
    auth_token = context.get("auth_token", "")
    question = params.get("question")
    options = params.get("options", [])
    
    if not question or not options: return {"success": False, "message": "Question and options required for poll."}
    
    payload = {
        "question": question,
        "options": options,
        "multipleChoice": params.get("multipleChoice", False),
        "conversationId": params.get("conversationId")
    }
    
    success, data = make_request("POST", "/poll/create", auth_token, payload)
    if success:
        return {"success": True, "message": "Poll created.", "action": {"intent": "REFRESH_UI"}}
    return {"success": False, "message": f"Failed to create poll: {data}"}

def execute_vote_poll(params: dict, context: dict) -> dict:
    auth_token = context.get("auth_token", "")
    poll_id = params.get("pollId")
    option_index = params.get("optionIndex")
    
    if not poll_id or option_index is None: return {"success": False, "message": "Poll ID and option index required."}
    
    success, data = make_request("PUT", f"/poll/vote/{poll_id}", auth_token, {"optionIndex": option_index})
    if success:
        return {"success": True, "message": "Voted successfully.", "action": {"intent": "REFRESH_UI"}}
    return {"success": False, "message": f"Failed to vote: {data}"}
