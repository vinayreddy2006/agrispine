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
    machine_id = params.get("machineId") or params.get("machineryId")

    if not machine_id and machine_name:
        success, machine_id, msg = resolve_machinery(machine_name, auth_token)
        if not success:
            return {"success": False, "message": msg}

    if not machine_id:
        return {"success": False, "message": "Missing machinery details for booking."}

    booking_date = params.get("date") or params.get("startDate")
    if not booking_date:
        return {"success": False, "message": "Missing booking date for machinery."}

    raw_duration = params.get("duration")
    try:
        duration = float(raw_duration) if raw_duration is not None else 1
        if duration <= 0:
            duration = 1
        elif duration.is_integer():
            duration = int(duration)
    except (TypeError, ValueError):
        duration = 1

    raw_task = params.get("task")
    task_payload = None
    if isinstance(raw_task, dict) and raw_task.get("name"):
        task_payload = {
            "name": raw_task.get("name"),
            "price": raw_task.get("price"),
            "priceUnit": raw_task.get("priceUnit"),
        }
    elif isinstance(raw_task, str) and raw_task.strip():
        task_payload = {"name": raw_task.strip()}

    payload = {
        "machineId": machine_id,
        "date": booking_date,
        "task": task_payload,
        "duration": duration,
        "notes": params.get("notes") or "",
    }
    success, data = make_request("POST", "/bookings/book", auth_token, payload)
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


def execute_my_bookings(params: dict, context: dict) -> dict:
    auth_token = context.get("auth_token", "")
    lang = (context.get("language") or "en")[:2].lower()

    success, data = make_request("GET", "/bookings/fetchall", auth_token)
    if not success:
        return {"success": False, "message": f"Failed to fetch bookings: {data}"}

    bookings = data if isinstance(data, list) else []
    status_filter = (params.get("status") or "").strip().lower()
    if status_filter:
        bookings = [b for b in bookings if str(b.get("status", "")).lower() == status_filter]

    if not bookings:
        empty_msg = {
            "en": "You currently have no machinery bookings.",
            "te": "మీకు ప్రస్తుతం యంత్రం బుకింగ్‌లు ఏవీ లేవు.",
            "hi": "आपके पास वर्तमान में कोई मशीनरी बुकिंग नहीं है।"
        }
        action = {"intent": "NAVIGATE", "path": get_frontend_route("my_bookings")} if (params.get("navigate") or params.get("open")) else None
        return {"success": True, "message": empty_msg.get(lang, empty_msg["en"]), "structured_data": {"bookings": []}, "action": action}

    lines = []
    summary_items = []
    for b in bookings[:5]:
        machine_name = (b.get("machine") or {}).get("name", "Machinery")
        task_name = (b.get("task") or {}).get("name", "")
        raw_date = str(b.get("date", ""))[:10]
        status = b.get("status", "pending")
        amount = b.get("totalAmount", 0)
        summary_items.append({
            "id": b.get("_id"),
            "machine": machine_name,
            "task": task_name,
            "date": raw_date,
            "status": status,
            "totalAmount": amount
        })
        task_part = f" ({task_name})" if task_name else ""
        lines.append(f"• {machine_name}{task_part} — {raw_date} | Status: {status} | ₹{amount}")

    joined = "\n".join(lines)
    header = {
        "en": f"Your machinery bookings ({len(bookings)} total):\n{joined}",
        "te": f"మీ యంత్రం బుకింగ్‌లు (మొత్తం {len(bookings)}):\n{joined}",
        "hi": f"आपकी मशीनरी बुकिंग (कुल {len(bookings)}):\n{joined}"
    }
    action = {"intent": "NAVIGATE", "path": get_frontend_route("my_bookings")} if (params.get("navigate") or params.get("open")) else None
    return {
        "success": True,
        "message": header.get(lang, header["en"]),
        "structured_data": {"total": len(bookings), "bookings": summary_items},
        "action": action
    }
