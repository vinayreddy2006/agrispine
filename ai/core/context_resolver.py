import re
from typing import Tuple, Optional, Dict, Any, List
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
    success, data = make_request("GET", "/machines/fetchall", auth_token)
    if not success:
        return False, None, "Failed to fetch machinery to match."
        
    match_result = smart_match(machine_name, data, key="name")
    
    if match_result["multiple"]:
        options = "\\n".join([f"- {m.get('name', 'Unknown')}" for m in match_result["options"]])
        return False, None, f"I found multiple machines matching '{machine_name}':\\n{options}\\n\\nWhich one did you mean?"
        
    if not match_result["success"]:
        return False, None, f"Could not find a machine matching '{machine_name}'."
        
    return True, match_result["match"].get("_id"), "Match found"


def _extract_group_id_from_page_context(page_context: Optional[dict]) -> Optional[str]:
    if not isinstance(page_context, dict):
        return None
    direct_id = page_context.get("groupId") or page_context.get("group_id")
    if direct_id:
        return str(direct_id)
    path = str(page_context.get("path", "") or "")
    match = re.search(r"/groups/([^/?#]+)", path)
    if match:
        candidate = match.group(1)
        if candidate not in ("personal", "create"):
            return candidate
    return None


def _is_generic_group_reference(group_name: Optional[str]) -> bool:
    if not group_name or not str(group_name).strip():
        return True
    lowered = str(group_name).strip().lower()
    return lowered in {
        "this group", "current group", "my group", "the group",
        "ఈ గ్రూప్", "ఈ సమూహం", "यह ग्रुप", "इस ग्रुप", "मेरा ग्रुप"
    }


def resolve_group(group_name: Optional[str], auth_token: str, page_context: Optional[dict] = None) -> Tuple[bool, Optional[Dict[str, Any]], str]:
    """
    Resolves a work group from page_context or by querying GET /api/groups and fuzzy-matching.
    Returns: (Success, GroupObject, Message)
    """
    if _is_generic_group_reference(group_name):
        ctx_group_id = _extract_group_id_from_page_context(page_context)
        if ctx_group_id:
            ok, grp_res = make_request("GET", f"/api/groups/{ctx_group_id}", auth_token)
            if ok and isinstance(grp_res, dict) and grp_res.get("group"):
                return True, grp_res["group"], "Match found"

    success, data = make_request("GET", "/api/groups", auth_token)
    if not success:
        return False, None, "Failed to fetch work groups."

    groups = data.get("groups", []) if isinstance(data, dict) else (data if isinstance(data, list) else [])
    active_groups = [g for g in groups if g.get("status", "active") == "active"]

    if not active_groups:
        return False, None, "You do not belong to any active work groups."

    if len(active_groups) == 1 and _is_generic_group_reference(group_name):
        return True, active_groups[0], "Match found"

    if _is_generic_group_reference(group_name):
        options = "\n".join([f"- {g.get('name', 'Unknown')}" for g in active_groups])
        return False, None, f"You have multiple work groups. Please specify which one:\n{options}"

    query = str(group_name).strip()
    match_result = smart_match(query, active_groups, key="name", threshold=0.65)

    if match_result["multiple"]:
        options = "\n".join([f"- {m.get('name', 'Unknown')}" for m in match_result["options"]])
        return False, None, f"I found multiple work groups matching '{query}':\n{options}\n\nWhich one did you mean?"

    if match_result["success"]:
        return True, match_result["match"], "Match found"

    lowered_q = query.lower()
    substring_matches = [g for g in active_groups if lowered_q in str(g.get("name", "")).lower()]
    if len(substring_matches) == 1:
        return True, substring_matches[0], "Match found"
    if len(substring_matches) > 1:
        options = "\n".join([f"- {g.get('name', 'Unknown')}" for g in substring_matches])
        return False, None, f"I found multiple work groups matching '{query}':\n{options}\n\nWhich one did you mean?"

    return False, None, f"Could not find an active work group matching '{query}'."


def resolve_group_members(group_obj: Dict[str, Any], member_names: Optional[Any]) -> Tuple[List[str], List[str]]:
    """
    Matches member names against active members inside group_obj['members'].
    Returns: (matched_member_subdoc_ids, matched_display_names)
    """
    members = [
        m for m in (group_obj or {}).get("members", [])
        if m.get("status", "active") == "active" and m.get("_id")
    ]
    if not members:
        return [], []

    if isinstance(member_names, str):
        raw_names = [part.strip() for part in re.split(r"[,&]|\band\b", member_names) if part.strip()]
    elif isinstance(member_names, list):
        raw_names = [str(n).strip() for n in member_names if str(n).strip()]
    else:
        raw_names = []

    all_keywords = {"all", "everyone", "all members", "అందరూ", "అందరు", "सभी", "सब", "सभी सदस्य"}
    if not raw_names or any(n.lower() in all_keywords for n in raw_names):
        return (
            [str(m["_id"]) for m in members],
            [m.get("name", "Member") for m in members]
        )

    matched_ids: List[str] = []
    matched_names: List[str] = []
    seen_ids = set()

    for query in raw_names:
        match_result = smart_match(query, members, key="name", threshold=0.65)
        candidate = match_result["match"] if match_result.get("success") else None

        if not candidate:
            lowered = query.lower()
            sub_hits = [m for m in members if lowered in str(m.get("name", "")).lower()]
            if len(sub_hits) == 1:
                candidate = sub_hits[0]

        if candidate and str(candidate["_id"]) not in seen_ids:
            mid = str(candidate["_id"])
            seen_ids.add(mid)
            matched_ids.append(mid)
            matched_names.append(candidate.get("name", "Member"))

    return matched_ids, matched_names
