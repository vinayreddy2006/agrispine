from datetime import datetime
from typing import Dict, Any, List, Optional
from ..api_client import make_request
from ..context_resolver import resolve_group, resolve_group_members
from ..route_registry import get_frontend_route


def _lang(context: dict) -> str:
    return (context.get("language") or "en")[:2].lower()


def _fetch_full_group(group_obj: dict, auth_token: str) -> dict:
    group_id = group_obj.get("_id")
    if not group_id:
        return group_obj
    ok, res = make_request("GET", f"/api/groups/{group_id}", auth_token)
    if ok and isinstance(res, dict) and res.get("group"):
        return res["group"]
    return group_obj


def execute_group_create(params: dict, context: dict) -> dict:
    auth_token = context.get("auth_token", "")
    lang = _lang(context)
    name = (params.get("name") or params.get("groupName") or "").strip()
    if not name:
        return {"success": False, "message": "Group name is required to create a work group."}

    village = (params.get("village") or "").strip()
    payload = {"name": name, "village": village}

    success, data = make_request("POST", "/api/groups", auth_token, payload)
    if success:
        new_group = data.get("group", {}) if isinstance(data, dict) else {}
        new_id = str(new_group.get("_id", ""))
        path = get_frontend_route("group_details", id=new_id) if new_id else get_frontend_route("groups")
        msgs = {
            "en": f"Work group '{name}' created successfully.",
            "te": f"'{name}' వర్క్ గ్రూప్ విజయవంతంగా సృష్టించబడింది.",
            "hi": f"वर्क ग्रुप '{name}' सफलतापूर्वक बनाया गया।"
        }
        return {
            "success": True,
            "message": msgs.get(lang, msgs["en"]),
            "structured_data": new_group,
            "action": {"intent": "NAVIGATE", "path": path}
        }
    return {"success": False, "message": f"Failed to create group: {data}"}


def execute_group_add_member(params: dict, context: dict) -> dict:
    auth_token = context.get("auth_token", "")
    lang = _lang(context)
    member_name = (params.get("memberName") or params.get("name") or "").strip()
    if not member_name:
        return {"success": False, "message": "Member name is required."}

    ok, group_obj, err_msg = resolve_group(params.get("groupName"), auth_token, context.get("page"))
    if not ok or not group_obj:
        return {"success": False, "message": err_msg}

    group_id = str(group_obj.get("_id"))
    group_display = group_obj.get("name", "Work Group")
    payload = {
        "name": member_name,
        "phone": (params.get("phone") or "").strip(),
        "village": (params.get("village") or "").strip(),
        "notes": (params.get("notes") or "").strip(),
    }

    success, data = make_request("PUT", f"/api/groups/{group_id}/members", auth_token, payload)
    if success:
        msgs = {
            "en": f"Added {member_name} to '{group_display}'.",
            "te": f"'{group_display}' గ్రూప్‌లో {member_name} జోడించబడ్డారు.",
            "hi": f"'{group_display}' में {member_name} को जोड़ा गया।"
        }
        return {
            "success": True,
            "message": msgs.get(lang, msgs["en"]),
            "structured_data": data.get("group") if isinstance(data, dict) else data,
            "action": {"intent": "REFRESH_UI", "path": get_frontend_route("group_details", id=group_id)}
        }
    return {"success": False, "message": f"Failed to add member: {data}"}


def execute_group_record_work(params: dict, context: dict) -> dict:
    auth_token = context.get("auth_token", "")
    lang = _lang(context)

    ok, group_obj, err_msg = resolve_group(params.get("groupName"), auth_token, context.get("page"))
    if not ok or not group_obj:
        return {"success": False, "message": err_msg}

    group_id = str(group_obj.get("_id"))
    full_group = _fetch_full_group(group_obj, auth_token)

    land_owner_name = (params.get("landOwnerName") or "").strip()
    crop_name = (params.get("crop") or params.get("cropName") or "").strip()
    activity_type = (params.get("activityType") or params.get("activity") or "").strip()
    acres = params.get("acres")
    rate_per_acre = params.get("ratePerAcre")

    if not all([land_owner_name, crop_name, activity_type, acres is not None, rate_per_acre is not None]):
        return {"success": False, "message": "Missing required work fields (landOwnerName, crop, activityType, acres, ratePerAcre)."}

    raw_attendance = params.get("attendance") or params.get("memberNames")
    member_ids, member_names = resolve_group_members(full_group, raw_attendance)
    if not member_ids:
        return {"success": False, "message": "No matching active members found in this group for attendance."}

    payload = {
        "date": params.get("date") or datetime.now().strftime("%Y-%m-%d"),
        "landOwnerName": land_owner_name,
        "isInternalFarm": bool(params.get("isInternalFarm", False)),
        "crop": crop_name,
        "activityType": activity_type,
        "acres": float(acres),
        "ratePerAcre": float(rate_per_acre),
        "additionalCharges": float(params.get("additionalCharges") or 0),
        "attendance": member_ids,
    }

    success, data = make_request("POST", f"/api/groups/{group_id}/work", auth_token, payload)
    if success:
        record = data.get("record", {}) if isinstance(data, dict) else {}
        total_amt = record.get("totalAmount", payload["acres"] * payload["ratePerAcre"] + payload["additionalCharges"])
        wage = record.get("wagePerPerson", round(total_amt / max(len(member_ids), 1), 2))
        attendee_count = len(member_ids)
        msgs = {
            "en": f"Work recorded for {full_group.get('name', 'group')}: {acres} acres ({crop_name} - {activity_type}). Total: ₹{total_amt:g}, Wage per person ({attendee_count} members): ₹{wage:g}.",
            "te": f"{full_group.get('name', 'గ్రూప్')} కోసం పని నమోదు చేయబడింది: {acres} ఎకరాలు ({crop_name} - {activity_type}). మొత్తం: ₹{total_amt:g}, ఒక్కొక్కరికి కూలీ ({attendee_count} మంది): ₹{wage:g}.",
            "hi": f"{full_group.get('name', 'ग्रुप')} के लिए कार्य दर्ज किया गया: {acres} एकड़ ({crop_name} - {activity_type})। कुल: ₹{total_amt:g}, प्रति व्यक्ति मजदूरी ({attendee_count} सदस्य): ₹{wage:g}।"
        }
        return {
            "success": True,
            "message": msgs.get(lang, msgs["en"]),
            "structured_data": {
                "record": record,
                "totalAmount": total_amt,
                "wagePerPerson": wage,
                "attendance": member_names
            },
            "action": {"intent": "REFRESH_UI", "path": get_frontend_route("group_details", id=group_id)}
        }
    return {"success": False, "message": f"Failed to record work: {data}"}


def execute_group_mark_attendance(params: dict, context: dict) -> dict:
    auth_token = context.get("auth_token", "")
    lang = _lang(context)

    if all([
        params.get("landOwnerName"),
        params.get("crop") or params.get("cropName"),
        params.get("activityType") or params.get("activity"),
        params.get("acres") is not None,
        params.get("ratePerAcre") is not None
    ]):
        return execute_group_record_work(params, context)

    ok, group_obj, err_msg = resolve_group(params.get("groupName"), auth_token, context.get("page"))
    if not ok or not group_obj:
        return {"success": False, "message": err_msg}

    group_id = str(group_obj.get("_id"))
    full_group = _fetch_full_group(group_obj, auth_token)
    raw_members = params.get("attendance") or params.get("memberNames")
    member_ids, member_names = resolve_group_members(full_group, raw_members)

    names_str = ", ".join(member_names) if member_names else "no matching members"
    msgs = {
        "en": f"Matched {len(member_ids)} members ({names_str}) in '{full_group.get('name', 'group')}'. To save a work & attendance entry, please also specify the landowner, crop, activity, acres, and rate per acre.",
        "te": f"'{full_group.get('name', 'గ్రూప్')}' లో {len(member_ids)} మంది సభ్యులు ({names_str}) గుర్తించబడ్డారు. హాజరు నమోదు చేయడానికి దయచేసి రైతు పేరు, పంట, పని, ఎకరాలు మరియు రేటు చెప్పండి.",
        "hi": f"'{full_group.get('name', 'ग्रुप')}' में {len(member_ids)} सदस्य ({names_str}) मिले। उपस्थिति सहेजने के लिए कृपया जमीन मालिक, फसल, कार्य, एकड़ और दर भी बताएं।"
    }
    return {
        "success": True,
        "message": msgs.get(lang, msgs["en"]),
        "structured_data": {"groupId": group_id, "matchedMembers": member_names, "memberIds": member_ids},
        "action": {"intent": "NAVIGATE", "path": get_frontend_route("group_details", id=group_id)} if (params.get("navigate") or params.get("open")) else None
    }


def execute_group_show_earnings(params: dict, context: dict) -> dict:
    auth_token = context.get("auth_token", "")
    lang = _lang(context)

    p_ok, p_res = make_request("GET", "/api/groups/personal/dashboard", auth_token)
    p_data = p_res.get("data", {}) if (p_ok and isinstance(p_res, dict)) else {}
    p_stats = p_data.get("stats", {}) if isinstance(p_data, dict) else {}

    total_earned = p_stats.get("totalEarned", 0)
    pending_dues = p_stats.get("pendingEarned", 0)
    days_worked = p_stats.get("daysWorked", 0)

    group_analytics = None
    resolved_group_name = None
    group_id = None

    has_group_target = bool(params.get("groupName")) or (isinstance(context.get("page"), dict) and "/groups/" in str(context["page"].get("path", "")))
    if has_group_target:
        g_ok, group_obj, _ = resolve_group(params.get("groupName"), auth_token, context.get("page"))
        if g_ok and group_obj:
            group_id = str(group_obj.get("_id"))
            resolved_group_name = group_obj.get("name", "Work Group")
            a_ok, a_res = make_request("GET", f"/api/groups/{group_id}/analytics", auth_token)
            if a_ok and isinstance(a_res, dict):
                group_analytics = a_res.get("analytics", {})

    if not p_ok and not group_analytics:
        return {"success": False, "message": "Failed to fetch work group earnings."}

    parts = {
        "en": f"Personal Work Group Summary: Total Earned ₹{total_earned:g}, Pending Dues ₹{pending_dues:g}, Days Worked: {days_worked}.",
        "te": f"వ్యక్తిగత వర్క్ గ్రూప్ వివరాలు: మొత్తం సంపాదన ₹{total_earned:g}, రావాల్సిన బకాయి ₹{pending_dues:g}, పనిచేసిన రోజులు: {days_worked}.",
        "hi": f"व्यक्तिगत वर्क ग्रुप सारांश: कुल कमाई ₹{total_earned:g}, बकाया राशि ₹{pending_dues:g}, कार्य दिवस: {days_worked}।"
    }
    msg = parts.get(lang, parts["en"])

    if group_analytics is not None:
        g_earn = group_analytics.get("totalEarnings", 0)
        g_pend = group_analytics.get("pendingPayments", 0)
        g_acres = group_analytics.get("totalAcres", 0)
        g_days = group_analytics.get("totalWorkDays", 0)
        g_parts = {
            "en": f"\nGroup '{resolved_group_name}': Total Earnings ₹{g_earn:g}, Pending Payments ₹{g_pend:g}, Total Acres: {g_acres:g}, Work Days: {g_days}.",
            "te": f"\n'{resolved_group_name}' గ్రూప్: మొత్తం ఆదాయం ₹{g_earn:g}, పెండింగ్ చెల్లింపులు ₹{g_pend:g}, మొత్తం ఎకరాలు: {g_acres:g}, పని రోజులు: {g_days}.",
            "hi": f"\nग्रुप '{resolved_group_name}': कुल कमाई ₹{g_earn:g}, बकाया भुगतान ₹{g_pend:g}, कुल एकड़: {g_acres:g}, कार्य दिवस: {g_days}।"
        }
        msg += g_parts.get(lang, g_parts["en"])

    action = None
    if params.get("navigate") or params.get("open"):
        target_path = get_frontend_route("group_details", id=group_id) if group_id else get_frontend_route("groups_personal")
        action = {"intent": "NAVIGATE", "path": target_path}

    return {
        "success": True,
        "message": msg,
        "structured_data": {
            "personal": p_stats,
            "groupName": resolved_group_name,
            "groupAnalytics": group_analytics
        },
        "action": action
    }


def execute_group_settlement(params: dict, context: dict) -> dict:
    auth_token = context.get("auth_token", "")
    lang = _lang(context)

    total_amount_raw = params.get("totalAmount") if params.get("totalAmount") is not None else params.get("amount")
    if total_amount_raw is None or float(total_amount_raw) <= 0:
        return {"success": False, "message": "A positive totalAmount is required for settlement."}
    total_amount = float(total_amount_raw)

    ok, group_obj, err_msg = resolve_group(params.get("groupName"), auth_token, context.get("page"))
    if not ok or not group_obj:
        return {"success": False, "message": err_msg}

    group_id = str(group_obj.get("_id"))
    full_group = _fetch_full_group(group_obj, auth_token)

    w_ok, w_data = make_request("GET", f"/api/groups/{group_id}/work", auth_token)
    if not w_ok:
        return {"success": False, "message": f"Failed to fetch group work records: {w_data}"}

    records = w_data.get("records", []) if isinstance(w_data, dict) else []
    unsettled_records = [r for r in records if r.get("paymentStatus") != "SETTLED" and r.get("_id")]
    if not unsettled_records:
        none_msg = {
            "en": f"All work records in '{full_group.get('name', 'group')}' are already settled.",
            "te": f"'{full_group.get('name', 'గ్రూప్')}' లో అన్ని పని రికార్డులు ఇప్పటికే సెటిల్ చేయబడ్డాయి.",
            "hi": f"'{full_group.get('name', 'ग्रुप')}' के सभी कार्य रिकॉर्ड पहले ही निपटाए जा चुके हैं।"
        }
        return {"success": False, "message": none_msg.get(lang, none_msg["en"])}

    unsettled_ids = [str(r["_id"]) for r in unsettled_records]

    member_names_param = params.get("memberNames") or params.get("attendance")
    member_ids, matched_names = resolve_group_members(full_group, member_names_param)
    if not member_ids:
        return {"success": False, "message": "No matching active members found to distribute settlement."}

    explicit_dist = params.get("distributions")
    if isinstance(explicit_dist, list) and explicit_dist:
        distributions = explicit_dist
    else:
        per_member = round(total_amount / len(member_ids), 2)
        remainder = round(total_amount - (per_member * len(member_ids)), 2)
        distributions = [
            {
                "memberId": mid,
                "amountPaid": round(per_member + (remainder if idx == 0 else 0), 2)
            }
            for idx, mid in enumerate(member_ids)
        ]

    settlement_type = params.get("settlementType")
    if settlement_type not in ("GROUP_WIDE", "SELECTED_MEMBERS", "NET_SETTLEMENT"):
        settlement_type = "SELECTED_MEMBERS" if member_names_param else "GROUP_WIDE"

    payment_mode = str(params.get("paymentMode") or "CASH").upper()
    if payment_mode not in ("CASH", "UPI", "BANK_TRANSFER", "OTHER"):
        payment_mode = "CASH"

    payload = {
        "settlementType": settlement_type,
        "totalAmount": total_amount,
        "workRecordsIncluded": unsettled_ids,
        "distributions": distributions,
        "paymentMode": payment_mode,
        "notes": params.get("notes") or "Settled via GramSathi AI",
    }

    s_ok, s_data = make_request("POST", f"/api/groups/{group_id}/settlements", auth_token, payload)
    if s_ok:
        settlement = s_data.get("settlement", {}) if isinstance(s_data, dict) else {}
        msgs = {
            "en": f"Settlement of ₹{total_amount:g} ({payment_mode}) recorded for '{full_group.get('name', 'group')}' across {len(distributions)} members and {len(unsettled_ids)} work records.",
            "te": f"'{full_group.get('name', 'గ్రూప్')}' కోసం {len(distributions)} మంది సభ్యులకు ₹{total_amount:g} ({payment_mode}) సెటిల్‌మెంట్ నమోదు చేయబడింది.",
            "hi": f"'{full_group.get('name', 'ग्रुप')}' के {len(distributions)} सदस्यों के लिए ₹{total_amount:g} ({payment_mode}) का निपटान दर्ज किया गया।"
        }
        return {
            "success": True,
            "message": msgs.get(lang, msgs["en"]),
            "structured_data": {
                "settlement": settlement,
                "members": matched_names,
                "workRecordsIncluded": len(unsettled_ids)
            },
            "action": {"intent": "REFRESH_UI", "path": get_frontend_route("group_details", id=group_id)}
        }
    return {"success": False, "message": f"Failed to process settlement: {s_data}"}
