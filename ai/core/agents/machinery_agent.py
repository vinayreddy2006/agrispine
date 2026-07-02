from typing import Dict, Any
from ..api_client import make_request
from ..context_resolver import resolve_machinery
from ..route_registry import get_frontend_route

def execute_search_machinery(params: dict, context: dict) -> dict:
    auth_token = context.get("auth_token", "")
    machine_type = params.get("type")
    
    if machine_type:
        success, data = make_request("GET", f"/machines/type/{machine_type}", auth_token)
    else:
        success, data = make_request("GET", "/machines/fetchall", auth_token)
        
    if success:
        path = get_frontend_route("rent_list", type=machine_type) if machine_type else get_frontend_route("rent_categories")
        return {"success": True, "message": f"Found {len(data)} machines.", "data": data, "action": {"intent": "NAVIGATE", "path": path}}
    return {"success": False, "message": f"Failed to search machinery: {data}"}

def execute_open_machinery(params: dict, context: dict) -> dict:
    auth_token = context.get("auth_token", "")
    machine_name = params.get("machineName")
    machine_id = params.get("machineId")
    
    if not machine_id and machine_name:
        success, machine_id, msg = resolve_machinery(machine_name, auth_token)
        if not success:
            return {"success": False, "message": msg}
            
    if machine_id:
        return {"success": True, "message": "Opening machinery details.", "action": {"intent": "NAVIGATE", "path": get_frontend_route("rent_details", id=machine_id)}}
    return {"success": False, "message": "Missing machine details."}

def execute_book_machinery(params: dict, context: dict) -> dict:
    auth_token = context.get("auth_token", "")
    machine_name = params.get("machineName")
    machine_id = params.get("machineId")
    
    if not machine_id and machine_name:
        success, machine_id, msg = resolve_machinery(machine_name, auth_token)
        if not success:
            return {"success": False, "message": msg}
            
    if not machine_id: return {"success": False, "message": "Missing machinery details for booking."}
    
    payload = {
        "machineryId": machine_id,
        "startDate": params.get("startDate"),
        "endDate": params.get("endDate"),
        "totalPrice": params.get("totalPrice", 0)
    }
    success, data = make_request("POST", "/bookings/book", auth_token, payload) # Endpoint is actually /bookings/book from backend review
    if success:
        return {"success": True, "message": "Machinery booked successfully.", "action": {"intent": "NAVIGATE", "path": get_frontend_route("my_bookings")}}
    return {"success": False, "message": f"Failed to book machinery: {data}"}

def execute_cancel_booking(params: dict, context: dict) -> dict:
    auth_token = context.get("auth_token", "")
    booking_id = params.get("bookingId")
    
    if not booking_id: return {"success": False, "message": "Missing booking ID to cancel."}
    
    success, data = make_request("DELETE", f"/bookings/delete/{booking_id}", auth_token)
    if success:
        return {"success": True, "message": "Booking cancelled successfully.", "action": {"intent": "REFRESH_UI"}}
    return {"success": False, "message": f"Failed to cancel booking: {data}"}
