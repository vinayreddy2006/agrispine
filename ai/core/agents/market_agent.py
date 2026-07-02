from typing import Dict, Any
from ..api_client import make_request
from ..context_resolver import resolve_crop
from ..route_registry import get_frontend_route

def execute_market_toggle_listing(params: dict, context: dict) -> dict:
    auth_token = context.get("auth_token", "")
    crop_name = params.get("cropName")
    crop_id = params.get("cropId")
    
    if not crop_id and crop_name:
        success, crop_id, msg = resolve_crop(crop_name, auth_token)
        if not success:
            return {"success": False, "message": msg}
            
    if not crop_id: return {"success": False, "message": "Missing crop details."}
    
    payload = {
        "isListed": params.get("isListed", True),
        "expectedPrice": params.get("expectedPrice", 0),
        "quantityAvailable": params.get("quantityAvailable", 0),
        "description": params.get("description", "")
    }
    
    success, data = make_request("PUT", f"/crops/market/toggle/{crop_id}", auth_token, payload)
    if success:
        return {"success": True, "message": "Market listing updated.", "action": {"intent": "REFRESH_UI"}}
    return {"success": False, "message": f"Failed to update market listing: {data}"}

def execute_market_view_listings(params: dict, context: dict) -> dict:
    auth_token = context.get("auth_token", "")
    success, data = make_request("GET", "/crops/market/listings", auth_token)
    if success:
        return {"success": True, "message": f"Found {len(data)} market listings.", "data": data, "action": {"intent": "NAVIGATE", "path": get_frontend_route("market")}}
    return {"success": False, "message": f"Failed to fetch market listings: {data}"}
