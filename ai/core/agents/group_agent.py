from typing import Dict, Any
from ..api_client import make_request
from ..route_registry import get_frontend_route

# We assume a helper function could resolve groupName to ID if needed, 
# but for simplicity, we will navigate to the group list if ID is missing.

def execute_group_create(params: dict, context: dict) -> dict:
    auth_token = context.get("auth_token", "")
    
    payload = {
        "name": params.get("groupName", "My Work Group"),
        "village": params.get("village", "")
    }
    
    success, data = make_request("POST", "/groups", auth_token, payload)
    if success:
        return {"success": True, "message": "Group created successfully.", "action": {"intent": "NAVIGATE", "path": f"/groups/{data.get('group', {}).get('_id', '')}"}}
    return {"success": False, "message": f"Failed to create group: {data}"}

def execute_group_add_member(params: dict, context: dict) -> dict:
    # Requires navigating to the specific group page if we can't reliably resolve the group ID in backend
    # To keep it robust, navigate the user to their groups page
    return {"success": True, "message": "Please select the group from your dashboard to add a member.", "action": {"intent": "NAVIGATE", "path": "/groups"}}

def execute_group_record_work(params: dict, context: dict) -> dict:
    return {"success": True, "message": "Select your group to record work.", "action": {"intent": "NAVIGATE", "path": "/groups"}}

def execute_group_mark_attendance(params: dict, context: dict) -> dict:
    return {"success": True, "message": "Please open your group to mark attendance.", "action": {"intent": "NAVIGATE", "path": "/groups"}}

def execute_group_show_earnings(params: dict, context: dict) -> dict:
    return {"success": True, "message": "Opening your personal earnings dashboard.", "action": {"intent": "NAVIGATE", "path": "/groups/personal"}}

def execute_group_settlement(params: dict, context: dict) -> dict:
    return {"success": True, "message": "Opening the group dashboard to process settlements.", "action": {"intent": "NAVIGATE", "path": "/groups"}}
