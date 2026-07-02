from typing import Dict, Any
import re
from ..api_client import make_request
from ..context_resolver import resolve_crop
from ..route_registry import get_frontend_route

def execute_add_crop(params: dict, context: dict) -> dict:
    auth_token = context.get("auth_token", "")
    
    if "area" not in params:
        for alias in ["landArea", "acres", "fieldSize", "size", "cropArea"]:
            if alias in params:
                params["area"] = params[alias]
                break
                
    if "area" in params and isinstance(params["area"], str):
        try:
            match = re.search(r"[-+]?\d*\.\d+|\d+", params["area"])
            if match:
                params["area"] = float(match.group(0))
        except:
            pass
            
    if "sowingDate" in params and isinstance(params["sowingDate"], str):
        match = re.match(r"^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$", params["sowingDate"])
        if match:
            day, month, year = match.groups()
            params["sowingDate"] = f"{year}-{int(month):02d}-{int(day):02d}"
            
    success, data = make_request("POST", "/crops/add", auth_token, params)
    if success:
        return {"success": True, "message": "Crop added successfully.", "action": {"intent": "NAVIGATE", "path": get_frontend_route('crop_details', id=data.get('_id', ''))}}
    return {"success": False, "message": f"Failed to add crop: {data}"}

def execute_update_crop(params: dict, context: dict) -> dict:
    # Minimal stub since backend doesn't seem to have PUT /crops/:id yet
    return {"success": False, "message": "Update crop API not yet implemented."}

def execute_delete_crop(params: dict, context: dict) -> dict:
    auth_token = context.get("auth_token", "")
    crop_name = params.get("cropName")
    crop_id = params.get("cropId")
    
    if not crop_id and crop_name:
        success, crop_id, msg = resolve_crop(crop_name, auth_token)
        if not success:
            return {"success": False, "message": msg, "action": None if "multiple" in msg else None}
            
    if not crop_id: return {"success": False, "message": "Missing crop ID or crop name."}
    
    success, data = make_request("DELETE", f"/crops/delete/{crop_id}", auth_token)
    if success:
        return {"success": True, "message": "Crop deleted successfully.", "action": {"intent": "NAVIGATE", "path": get_frontend_route('my_crops')}}
    return {"success": False, "message": f"Failed to delete crop: {data}"}

def execute_open_crop(params: dict, context: dict) -> dict:
    auth_token = context.get("auth_token", "")
    crop_name = params.get("cropName")
    crop_id = params.get("cropId")
    
    if not crop_id and crop_name:
        success, crop_id, msg = resolve_crop(crop_name, auth_token)
        if not success:
            return {"success": False, "message": msg}
            
    if crop_id:
        return {"success": True, "message": "Opening crop details.", "action": {"intent": "NAVIGATE", "path": get_frontend_route('crop_details', id=crop_id)}}
    return {"success": False, "message": "Missing crop details."}

def execute_sell_crop(params: dict, context: dict) -> dict:
    auth_token = context.get("auth_token", "")
    crop_name = params.get("cropName")
    crop_id = params.get("cropId")
    
    if not crop_id and crop_name:
        success, crop_id, msg = resolve_crop(crop_name, auth_token)
        if not success:
            return {"success": False, "message": msg}
            
    if not crop_id: return {"success": False, "message": "Missing crop details."}
    
    payload = {
        "yieldQty": params.get("yieldQty", 0),
        "revenue": params.get("revenue", 0)
    }
    
    success, data = make_request("PUT", f"/crops/sell/{crop_id}", auth_token, payload)
    if success:
        return {"success": True, "message": "Crop sold successfully.", "action": {"intent": "REFRESH_UI"}}
    return {"success": False, "message": f"Failed to sell crop: {data}"}
