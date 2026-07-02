from typing import Tuple, Optional, Dict, Any
from .api_client import make_request
from .smart_matcher import smart_match

def resolve_crop(crop_name: str, auth_token: str) -> Tuple[bool, Optional[str], str]:
    """
    Given a crop name, fetches all crops and uses fuzzy matching to find the best match.
    Returns: (Success, CropId, Message)
    """
    if not crop_name:
        return False, None, "Crop name was not provided."
        
    success, data = make_request("GET", "/crops/fetchall", auth_token)
    if not success:
        return False, None, "Failed to fetch crops to match."
        
    match_result = smart_match(crop_name, data, key="cropName")
    
    if match_result["multiple"]:
        options = "\\n".join([f"- {m.get('cropName', 'Unknown')}" for m in match_result["options"]])
        return False, None, f"I found multiple crops matching '{crop_name}':\\n{options}\\n\\nWhich one did you mean?"
        
    if not match_result["success"]:
        return False, None, f"Could not find a crop matching '{crop_name}'."
        
    return True, match_result["match"].get("_id"), "Match found"

def resolve_conversation(receiver_name: str, conversation_type: str, auth_token: str) -> Tuple[bool, Optional[str], Optional[str], str]:
    """
    Given a receiver name and type, finds the best matching conversation.
    Returns: (Success, ConversationId, TargetName, Message)
    """
    if not receiver_name:
        return False, None, None, "Receiver name was not provided."
        
    success, convs = make_request("GET", "/api/ai/messenger/conversations", auth_token)
    if not success:
        return False, None, None, "Failed to fetch conversations on backend."
        
    if not isinstance(convs, list):
        return False, None, None, "Invalid response from conversation search API."
        
    if conversation_type and conversation_type in ["individual", "group"]:
        filtered_convs = [c for c in convs if c.get("type") == conversation_type]
        if filtered_convs:
            convs = filtered_convs
            
    match_result = smart_match(receiver_name, convs, key="name")
    
    if match_result["multiple"]:
        options = "\\n".join([f"- {m.get('name', 'Unknown')} ({m.get('type', '').title()})" for m in match_result["options"]])
        return False, None, None, f"I found multiple matches for '{receiver_name}':\\n{options}\\n\\nWhich conversation should I use?"
        
    if not match_result["success"]:
        return False, None, None, f"Conversation not found for '{receiver_name}'."
        
    target_conv_id = match_result["match"]["id"]
    target_name = match_result["match"]["name"]
    return True, target_conv_id, target_name, "Match found"

def resolve_machinery(machine_name: str, auth_token: str) -> Tuple[bool, Optional[str], str]:
    success, data = make_request("GET", "/machinery/fetchall", auth_token)
    if not success:
        return False, None, "Failed to fetch machinery to match."
        
    match_result = smart_match(machine_name, data, key="name")
    
    if match_result["multiple"]:
        options = "\\n".join([f"- {m.get('name', 'Unknown')}" for m in match_result["options"]])
        return False, None, f"I found multiple machines matching '{machine_name}':\\n{options}\\n\\nWhich one did you mean?"
        
    if not match_result["success"]:
        return False, None, f"Could not find a machine matching '{machine_name}'."
        
    return True, match_result["match"].get("_id"), "Match found"
