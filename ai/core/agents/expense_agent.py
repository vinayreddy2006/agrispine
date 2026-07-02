from typing import Dict, Any
from ..api_client import make_request
from ..context_resolver import resolve_crop
from ..route_registry import get_frontend_route

def execute_add_expense(params: dict, context: dict) -> dict:
    auth_token = context.get("auth_token", "")
    crop_name = params.get("cropName")
    crop_id = params.get("cropId")
    
    if not crop_id and crop_name:
        success, crop_id, msg = resolve_crop(crop_name, auth_token)
        if not success:
            return {"success": False, "message": msg}
            
    if not crop_id: 
        return {"success": False, "message": "Missing crop ID or crop name to add expense to."}
    
    if "date" in params and isinstance(params["date"], str):
        import re
        match = re.match(r"^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$", params["date"])
        if match:
            day, month, year = match.groups()
            params["date"] = f"{year}-{int(month):02d}-{int(day):02d}"

    payload = {
        "type": params.get("category") or params.get("type"), # Backend uses 'type' for expense category
        "amount": params.get("amount"),
        "date": params.get("date"),
        "description": params.get("description", "")
    }
    
    success, data = make_request("PUT", f"/crops/expense/{crop_id}", auth_token, payload)
    if success:
        return {"success": True, "message": "Expense added successfully.", "action": {"intent": "NAVIGATE", "path": get_frontend_route("crop_details", id=crop_id)}}
    return {"success": False, "message": f"Failed to add expense: {data}"}

def execute_delete_expense(params: dict, context: dict) -> dict:
    auth_token = context.get("auth_token", "")
    crop_name = params.get("cropName")
    crop_id = params.get("cropId")
    expense_id = params.get("expenseId")
    
    if not crop_id and crop_name:
        success, crop_id, msg = resolve_crop(crop_name, auth_token)
        if not success:
            return {"success": False, "message": msg}
            
    if not crop_id or not expense_id:
        return {"success": False, "message": "Missing crop ID or expense ID."}
        
    success, data = make_request("DELETE", f"/crops/expense/{crop_id}/{expense_id}", auth_token)
    if success:
        return {"success": True, "message": "Expense deleted successfully.", "action": {"intent": "REFRESH_UI"}}
    return {"success": False, "message": f"Failed to delete expense: {data}"}
