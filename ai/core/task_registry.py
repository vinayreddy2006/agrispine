from typing import Dict, Callable

# Import Modular Agents
from .agents.crop_agent import execute_add_crop, execute_update_crop, execute_delete_crop, execute_open_crop, execute_sell_crop
from .agents.expense_agent import execute_add_expense, execute_delete_expense
from .agents.machinery_agent import execute_search_machinery, execute_open_machinery, execute_book_machinery, execute_cancel_booking
from .agents.messenger_agent import execute_messenger_send, execute_messenger_open, execute_clear_chat
from .agents.community_agent import execute_create_post, execute_reply_post, execute_create_poll, execute_vote_poll
from .agents.market_agent import execute_market_toggle_listing, execute_market_view_listings
from .agents.weather_agent import execute_get_weather
from .agents.group_agent import (
    execute_group_create,
    execute_group_add_member,
    execute_group_record_work,
    execute_group_mark_attendance,
    execute_group_show_earnings,
    execute_group_settlement
)

# General Task
def execute_navigate(params: dict, context: dict) -> dict:
    path = params.get("path", "/")
    return {"success": True, "message": f"Navigating to {path}", "action": {"intent": "NAVIGATE", "path": path}}

# ==========================================
# REGISTRY MAP
# ==========================================
TASK_REGISTRY: Dict[str, Callable] = {
    # Crop Operations
    "CROP_ADD": execute_add_crop,
    "CROP_UPDATE": execute_update_crop,
    "CROP_DELETE": execute_delete_crop,
    "CROP_OPEN": execute_open_crop,
    "CROP_SELL": execute_sell_crop,
    
    # Expense Operations
    "CROP_ADD_EXPENSE": execute_add_expense,
    "CROP_DELETE_EXPENSE": execute_delete_expense,
    
    # Machinery Operations
    "MACHINERY_SEARCH": execute_search_machinery,
    "MACHINERY_OPEN": execute_open_machinery,
    "MACHINERY_BOOK": execute_book_machinery,
    "MACHINERY_CANCEL_BOOKING": execute_cancel_booking,
    
    # Messenger Operations
    "MESSENGER_SEND": execute_messenger_send,
    "MESSENGER_OPEN": execute_messenger_open,
    "MESSENGER_CLEAR_CHAT": execute_clear_chat,
    
    # Community & Polls
    "COMMUNITY_CREATE_POST": execute_create_post,
    "COMMUNITY_REPLY_POST": execute_reply_post,
    "POLL_CREATE": execute_create_poll,
    "POLL_VOTE": execute_vote_poll,
    
    # Market Operations
    "MARKET_TOGGLE_LISTING": execute_market_toggle_listing,
    "MARKET_VIEW_LISTINGS": execute_market_view_listings,
    
    # Weather
    "WEATHER_GET": execute_get_weather,
    
    # General Navigation
    "NAVIGATE": execute_navigate,
    
    # Work Group Operations
    "GROUP_CREATE": execute_group_create,
    "GROUP_ADD_MEMBER": execute_group_add_member,
    "GROUP_RECORD_WORK": execute_group_record_work,
    "GROUP_MARK_ATTENDANCE": execute_group_mark_attendance,
    "GROUP_SHOW_EARNINGS": execute_group_show_earnings,
    "GROUP_SETTLEMENT": execute_group_settlement
}
