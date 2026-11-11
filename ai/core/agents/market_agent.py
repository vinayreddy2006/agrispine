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


def execute_get_mandi_rates(params: dict, context: dict) -> dict:
    auth_token = context.get("auth_token", "")
    lang = (context.get("language") or "en")[:2].lower()

    success, data = make_request("GET", "/admin/mandi-rates", auth_token)
    if not success:
        return {"success": False, "message": f"Failed to fetch mandi rates: {data}"}

    rates = data if isinstance(data, list) else []
    crop_filter = (params.get("crop") or params.get("cropName") or "").strip().lower()
    market_filter = (params.get("market") or params.get("district") or "").strip().lower()

    if crop_filter:
        rates = [r for r in rates if crop_filter in str(r.get("crop", "")).lower()]
    if market_filter:
        rates = [r for r in rates if market_filter in str(r.get("market", "")).lower()]

    if not rates:
        not_found = {
            "en": "No matching mandi rates found right now.",
            "te": "ప్రస్తుతం సరిపోయే మార్కెట్ ధరలు కనుగొనబడలేదు.",
            "hi": "वर्तमान में कोई मेल खाता मंडी भाव नहीं मिला।"
        }
        action = {"intent": "NAVIGATE", "path": get_frontend_route("mandi_rates")} if (params.get("navigate") or params.get("open")) else None
        return {"success": True, "message": not_found.get(lang, not_found["en"]), "structured_data": {"rates": []}, "action": action}

    lines = []
    for r in rates[:6]:
        crop = r.get("crop", "Crop")
        market = r.get("market", "Mandi")
        variety = r.get("type", "")
        modal = r.get("modal", 0)
        min_p = r.get("min", 0)
        max_p = r.get("max", 0)
        trend = r.get("trend", "stable")
        variety_part = f" ({variety})" if variety else ""
        lines.append(f"• {crop}{variety_part} @ {market}: Modal ₹{modal}/Qtl (Min ₹{min_p} – Max ₹{max_p}, Trend: {trend})")

    joined = "\n".join(lines)
    msg = {
        "en": f"Latest Mandi Rates ({len(rates)} matches):\n{joined}",
        "te": f"తాజా మండి ధరలు ({len(rates)} ఫలితాలు):\n{joined}",
        "hi": f"नवीनतम मंडी भाव ({len(rates)} परिणाम):\n{joined}"
    }
    action = {"intent": "NAVIGATE", "path": get_frontend_route("mandi_rates")} if (params.get("navigate") or params.get("open")) else None
    return {
        "success": True,
        "message": msg.get(lang, msg["en"]),
        "structured_data": {"count": len(rates), "rates": rates[:6]},
        "action": action
    }


def execute_get_schemes(params: dict, context: dict) -> dict:
    auth_token = context.get("auth_token", "")
    lang = (context.get("language") or "en")[:2].lower()

    success, data = make_request("GET", "/admin/schemes", auth_token)
    if not success:
        return {"success": False, "message": f"Failed to fetch government schemes: {data}"}

    schemes = data if isinstance(data, list) else []
    keyword = (params.get("schemeName") or params.get("keyword") or params.get("query") or params.get("provider") or "").strip().lower()
    if keyword:
        schemes = [
            s for s in schemes
            if keyword in str(s.get("name", "")).lower()
            or keyword in str(s.get("provider", "")).lower()
            or keyword in str(s.get("description", "")).lower()
        ]

    if not schemes:
        empty_msg = {
            "en": "No matching government schemes found.",
            "te": "సరిపోయే ప్రభుత్వ పథకాలు కనుగొనబడలేదు.",
            "hi": "कोई मेल खाती सरकारी योजना नहीं मिली।"
        }
        action = {"intent": "NAVIGATE", "path": get_frontend_route("schemes")} if (params.get("navigate") or params.get("open")) else None
        return {"success": True, "message": empty_msg.get(lang, empty_msg["en"]), "structured_data": {"schemes": []}, "action": action}

    lines = []
    for s in schemes[:5]:
        name = s.get("name", "Scheme")
        amount = s.get("amount", "")
        elig = s.get("eligibility", "")
        apply_dt = s.get("applyDate", "")
        lines.append(f"• {name} — Benefit: {amount} | Eligibility: {elig} | Apply: {apply_dt}")

    joined = "\n".join(lines)
    msg = {
        "en": f"Available Government Schemes ({len(schemes)}):\n{joined}",
        "te": f"అందుబాటులో ఉన్న ప్రభుత్వ పథకాలు ({len(schemes)}):\n{joined}",
        "hi": f"उपलब्ध सरकारी योजनाएं ({len(schemes)}):\n{joined}"
    }
    action = {"intent": "NAVIGATE", "path": get_frontend_route("schemes")} if (params.get("navigate") or params.get("open")) else None
    return {
        "success": True,
        "message": msg.get(lang, msg["en"]),
        "structured_data": {"count": len(schemes), "schemes": schemes[:5]},
        "action": action
    }
