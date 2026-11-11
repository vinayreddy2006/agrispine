"""
Action Validator and Entity Extractor for GramSathi AI
Defines mandatory schema requirements, parameter normalization, and localized confirmation prompts.
"""

import re
from datetime import datetime, timedelta
from typing import Dict, Any, List, Tuple, Optional

# System base date: November 8, 2026
BASE_DATE = datetime(2026, 11, 8)

DATA_MODIFYING_INTENTS = {
    "CROP_ADD": {
        "title": {
            "en": "Add Crop",
            "te": "పంటను జోడించు",
            "hi": "फसल जोड़ें"
        },
        "mandatory": ["cropName", "area", "sowingDate"],
        "fields": {
            "cropName": {"en": "Crop Name", "te": "పంట పేరు", "hi": "फसल का नाम"},
            "area": {"en": "Field Area (Acres)", "te": "పొలం విస్తీర్ణం (ఎకరాలు)", "hi": "खेत का क्षेत्रफल (एकड़)"},
            "sowingDate": {"en": "Sowing Date", "te": "విత్తిన తేదీ", "hi": "बुवाई की तारीख"}
        }
    },
    "CROP_UPDATE": {
        "title": {
            "en": "Update Crop",
            "te": "పంట వివరాలు నవీకరించు",
            "hi": "फसल विवरण अपडेट करें"
        },
        "mandatory": ["cropName"],
        "fields": {
            "cropName": {"en": "Crop Name", "te": "పంట పేరు", "hi": "फसल का नाम"}
        }
    },
    "CROP_DELETE": {
        "title": {
            "en": "Delete Crop",
            "te": "పంటను తొలగించు",
            "hi": "फसल हटाएं"
        },
        "mandatory": ["cropName"],
        "fields": {
            "cropName": {"en": "Crop Name", "te": "పంట పేరు", "hi": "फसल का नाम"}
        }
    },
    "CROP_SELL": {
        "title": {
            "en": "Record Harvest Sale",
            "te": "పంట విక్రయం నమోదు",
            "hi": "फसल बिक्री दर्ज करें"
        },
        "mandatory": ["cropName", "yieldQty", "revenue"],
        "fields": {
            "cropName": {"en": "Crop Name", "te": "పంట పేరు", "hi": "फसल का नाम"},
            "yieldQty": {"en": "Yield Quantity (Qtl)", "te": "దిగుబడి పరిమాణం (క్వింటాళ్లు)", "hi": "उपज मात्रा (क्विंटल)"},
            "revenue": {"en": "Total Revenue (₹)", "te": "మొత్తం ఆదాయం (₹)", "hi": "कुल आय (₹)"}
        }
    },
    "CROP_ADD_EXPENSE": {
        "title": {
            "en": "Add Crop Expense",
            "te": "పంట ఖర్చును నమోదు చేయండి",
            "hi": "फसल खर्च जोड़ें"
        },
        "mandatory": ["cropName", "category", "amount", "date"],
        "fields": {
            "cropName": {"en": "Crop Name", "te": "పంట పేరు", "hi": "फसल का नाम"},
            "category": {"en": "Expense Category", "te": "ఖర్చు రకం", "hi": "खर्च की श्रेणी"},
            "amount": {"en": "Amount (₹)", "te": "మొత్తం (₹)", "hi": "राशि (₹)"},
            "date": {"en": "Date", "te": "తేదీ", "hi": "तारीख"}
        }
    },
    "CROP_DELETE_EXPENSE": {
        "title": {
            "en": "Delete Crop Expense",
            "te": "ఖర్చును తొలగించు",
            "hi": "खर्च हटाएं"
        },
        "mandatory": ["cropName", "expenseId"],
        "fields": {
            "cropName": {"en": "Crop Name", "te": "పంట పేరు", "hi": "फसल का नाम"},
            "expenseId": {"en": "Expense ID", "te": "ఖర్చు ID", "hi": "खर्च ID"}
        }
    },
    "MACHINERY_BOOK": {
        "title": {
            "en": "Book Machinery",
            "te": "యంత్రాన్ని బుక్ చేయండి",
            "hi": "मशीनरी बुक करें"
        },
        "mandatory": ["machineName", "date"],
        "fields": {
            "machineName": {"en": "Machinery", "te": "యంత్రం", "hi": "मशीन"},
            "machineId": {"en": "Machine ID", "te": "యంత్రం ID", "hi": "मशीन ID"},
            "date": {"en": "Booking Date", "te": "బుకింగ్ తేదీ", "hi": "बुकिंग की तारीख"},
            "duration": {"en": "Duration (Hours)", "te": "వ్యవధి (గంటలు)", "hi": "अवधि (घंटे)"},
            "notes": {"en": "Notes", "te": "గమనికలు", "hi": "टिप्पणी"}
        }
    },
    "MACHINERY_CANCEL_BOOKING": {
        "title": {
            "en": "Cancel Machine Booking",
            "te": "బుకింగ్ రద్దు చేయండి",
            "hi": "बुकिंग रद्द करें"
        },
        "mandatory": ["bookingId"],
        "fields": {
            "bookingId": {"en": "Booking ID", "te": "బుకింగ్ ID", "hi": "बुकिंग ID"}
        }
    },
    "MESSENGER_SEND": {
        "title": {
            "en": "Send Chat Message",
            "te": "సందేశం పంపండి",
            "hi": "संदेश भेजें"
        },
        "mandatory": ["receiverName", "message"],
        "fields": {
            "receiverName": {"en": "Recipient", "te": "స్వీకర్త", "hi": "प्राप्तकर्ता"},
            "message": {"en": "Message", "te": "సందేశం", "hi": "संदेश"}
        }
    },
    "COMMUNITY_CREATE_POST": {
        "title": {
            "en": "Create Community Post",
            "te": "కమ్యూనిటీ పోస్ట్ రాయండి",
            "hi": "कम्युनिटी पोस्ट बनाएं"
        },
        "mandatory": ["content"],
        "fields": {
            "title": {"en": "Title", "te": "శీర్షిక", "hi": "शीर्षक"},
            "content": {"en": "Post Content", "te": "విషయం", "hi": "सामग्री"}
        }
    },
    "POLL_CREATE": {
        "title": {
            "en": "Create Village Poll",
            "te": "గ్రామ పోల్ సృష్టించండి",
            "hi": "ग्राम पोल बनाएं"
        },
        "mandatory": ["question", "options"],
        "fields": {
            "question": {"en": "Question", "te": "ప్రశ్న", "hi": "सवाल"},
            "options": {"en": "Options", "te": "ఎంపికలు", "hi": "विकल्प"}
        }
    },
    "MARKET_TOGGLE_LISTING": {
        "title": {
            "en": "List Crop in Market",
            "te": "మార్కెట్‌లో పంటను లిస్ట్ చేయండి",
            "hi": "मार्केट में फसल सूचीबद्ध करें"
        },
        "mandatory": ["cropName", "expectedPrice", "quantityAvailable"],
        "fields": {
            "cropName": {"en": "Crop", "te": "పంట", "hi": "फसल"},
            "expectedPrice": {"en": "Expected Price (₹/Qtl)", "te": "ఆశించే ధర (రూ/క్విం)", "hi": "अपेक्षित मूल्य (₹/क्विंटल)"},
            "quantityAvailable": {"en": "Available Quantity (Qtl)", "te": "అందుబాటులో ఉన్న పరిమాణం", "hi": "उपलब्ध मात्रा"}
        }
    },
    "GROUP_CREATE": {
        "title": {
            "en": "Create Work Group",
            "te": "వర్క్ గ్రూప్ సృష్టించండి",
            "hi": "वर्क ग्रुप बनाएं"
        },
        "mandatory": ["name"],
        "fields": {
            "name": {"en": "Group Name", "te": "గ్రూప్ పేరు", "hi": "ग्रुप का नाम"},
            "village": {"en": "Village", "te": "గ్రామం", "hi": "गांव"}
        }
    },
    "GROUP_ADD_MEMBER": {
        "title": {
            "en": "Add Group Member",
            "te": "గ్రూప్ సభ్యుడిని జోడించండి",
            "hi": "ग्रुप सदस्य जोड़ें"
        },
        "mandatory": ["memberName"],
        "fields": {
            "groupName": {"en": "Group", "te": "గ్రూప్", "hi": "ग्रुप"},
            "memberName": {"en": "Member Name", "te": "సభ్యుని పేరు", "hi": "सदस्य का नाम"},
            "phone": {"en": "Phone", "te": "ఫోన్", "hi": "फ़ोन"},
            "village": {"en": "Village", "te": "గ్రామం", "hi": "गांव"},
            "notes": {"en": "Notes", "te": "గమనికలు", "hi": "टिप्पणी"}
        }
    },
    "GROUP_RECORD_WORK": {
        "title": {
            "en": "Record Group Work / Task",
            "te": "గ్రూప్ పని నమోదు చేయండి",
            "hi": "ग्रुप कार्य दर्ज करें"
        },
        "mandatory": ["landOwnerName", "crop", "activityType", "acres", "ratePerAcre"],
        "fields": {
            "groupName": {"en": "Group", "te": "గ్రూప్", "hi": "ग्रुप"},
            "landOwnerName": {"en": "Land Owner", "te": "భూ యజమాని", "hi": "जमीन मालिक"},
            "crop": {"en": "Crop", "te": "పంట", "hi": "फसल"},
            "activityType": {"en": "Activity / Task", "te": "పని రకం", "hi": "कार्य"},
            "acres": {"en": "Area (Acres)", "te": "విస్తీర్ణం (ఎకరాలు)", "hi": "क्षेत्रफल (एकड़)"},
            "ratePerAcre": {"en": "Rate per Acre (₹)", "te": "ఎకరాకు రేటు (₹)", "hi": "प्रति एकड़ दर (₹)"},
            "additionalCharges": {"en": "Additional Charges (₹)", "te": "అదనపు ఖర్చులు (₹)", "hi": "अतिरिक्त शुल्क (₹)"},
            "date": {"en": "Work Date", "te": "పని తేదీ", "hi": "कार्य की तारीख"},
            "attendance": {"en": "Attendance", "te": "హాజరు", "hi": "उपस्थिति"}
        }
    },
    "GROUP_SETTLEMENT": {
        "title": {
            "en": "Process Group Settlement",
            "te": "గ్రూప్ సెటిల్‌మెంట్ నమోదు",
            "hi": "ग्रुप निपटान दर्ज करें"
        },
        "mandatory": ["totalAmount"],
        "fields": {
            "groupName": {"en": "Group", "te": "గ్రూప్", "hi": "ग्रुप"},
            "totalAmount": {"en": "Total Amount (₹)", "te": "మొత్తం (₹)", "hi": "कुल राशि (₹)"},
            "settlementType": {"en": "Settlement Type", "te": "సెటిల్‌మెంట్ రకం", "hi": "निपटान प्रकार"},
            "paymentMode": {"en": "Payment Mode", "te": "చెల్లింపు విధానం", "hi": "भुगतान माध्यम"},
            "memberNames": {"en": "Members", "te": "సభ్యులు", "hi": "सदस्य"},
            "notes": {"en": "Notes", "te": "గమనికలు", "hi": "टिप्पणी"}
        }
    }
}

def parse_relative_date(date_str: str) -> Optional[str]:
    """Converts natural language dates (English, Telugu, Hindi) to YYYY-MM-DD."""
    if not date_str:
        return None
        
    cleaned = str(date_str).strip().lower()
    
    # Direct ISO match
    if re.match(r"^\d{4}-\d{2}-\d{2}$", cleaned):
        return cleaned
        
    # DD-MM-YYYY or DD/MM/YYYY
    dmy = re.match(r"^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$", cleaned)
    if dmy:
        day, month, year = dmy.groups()
        return f"{year}-{int(month):02d}-{int(day):02d}"

    # Relative days
    if any(k in cleaned for k in ["today", "ఈరోజు", "आज"]):
        return BASE_DATE.strftime("%Y-%m-%d")
    if any(k in cleaned for k in ["tomorrow", "రేపు", "कल"]):
        return (BASE_DATE + timedelta(days=1)).strftime("%Y-%m-%d")
    if any(k in cleaned for k in ["day after tomorrow", "ఎల్లుండి", "परसों"]):
        return (BASE_DATE + timedelta(days=2)).strftime("%Y-%m-%d")
    if any(k in cleaned for k in ["yesterday", "నిన్న", "बीता हुआ कल"]):
        return (BASE_DATE - timedelta(days=1)).strftime("%Y-%m-%d")
    if any(k in cleaned for k in ["next week", "వచ్చే వారం", "अगले सप्ताह"]):
        return (BASE_DATE + timedelta(days=7)).strftime("%Y-%m-%d")

    # Match patterns like "12 nov", "12 november", "12 నవంబర్", "12 नवम्बर"
    month_match = re.search(r"(\d{1,2})\s*([a-zA-Z\u0C00-\u0C7F\u0900-\u097F]+)", cleaned)
    if month_match:
        day = int(month_match.group(1))
        m_name = month_match.group(2).lower()
        month_map = {
            "jan": 1, "january": 1, "జనవరి": 1, "जनवरी": 1,
            "feb": 2, "february": 2, "ఫిబ్రవరి": 2, "फरवरी": 2,
            "mar": 3, "march": 3, "మార్చి": 3, "मार्च": 3,
            "apr": 4, "april": 4, "ఏప్రిల్": 4, "अप्रैल": 4,
            "may": 5, "మే": 5, "मई": 5,
            "jun": 6, "june": 6, "జూన్": 6, "जून": 6,
            "jul": 7, "july": 7, "జూలై": 7, "जुलाई": 7,
            "aug": 8, "august": 8, "ఆగస్టు": 8, "अगस्त": 8,
            "sep": 9, "september": 9, "సెప్టెంబర్": 9, "सितंबर": 9,
            "oct": 10, "october": 10, "అక్టోబర్": 10, "अक्टूबर": 10,
            "nov": 11, "november": 11, "నవంబర్": 11, "नवम्बर": 11, "नवंबर": 11,
            "dec": 12, "december": 12, "డిసెంబర్": 12, "दिसंबर": 12
        }
        for name, m_num in month_map.items():
            if name in m_name:
                return f"2026-{m_num:02d}-{day:02d}"

    return None

def normalize_number(val: Any) -> Optional[float]:
    """Extracts float/int number from strings like '2.5 acres', '₹500', '40 quintals'."""
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return float(val)
    match = re.search(r"[-+]?\d*\.?\d+", str(val).replace(",", ""))
    if match:
        try:
            return float(match.group(0))
        except ValueError:
            pass
    return None

def normalize_parameters(intent: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """Cleans, coerces, and normalizes intent parameters based on domain rules."""
    norm = dict(params or {})

    # Aliases mapping
    if intent == "GROUP_CREATE":
        if "groupName" in norm and "name" not in norm:
            norm["name"] = norm.pop("groupName")
    elif intent == "GROUP_RECORD_WORK":
        if "cropName" in norm and "crop" not in norm:
            norm["crop"] = norm.pop("cropName")
        if "activity" in norm and "activityType" not in norm:
            norm["activityType"] = norm.pop("activity")
        if "area" in norm and "acres" not in norm:
            norm["acres"] = norm.pop("area")
        if "memberNames" in norm and "attendance" not in norm:
            norm["attendance"] = norm.pop("memberNames")
    elif intent == "GROUP_SETTLEMENT":
        if "amount" in norm and "totalAmount" not in norm:
            norm["totalAmount"] = norm.pop("amount")
    else:
        if "crop" in norm and "cropName" not in norm:
            norm["cropName"] = norm["crop"]
        if "acres" in norm and "area" not in norm:
            norm["area"] = norm["acres"]
        if "fieldSize" in norm and "area" not in norm:
            norm["area"] = norm["fieldSize"]
        if "type" in norm and "category" not in norm:
            norm["category"] = norm["type"]
        if "cost" in norm and "amount" not in norm:
            norm["amount"] = norm["cost"]
        if "price" in norm and "amount" not in norm:
            norm["amount"] = norm["price"]
        if intent == "MACHINERY_BOOK":
            if "machineryId" in norm and "machineId" not in norm:
                norm["machineId"] = norm.pop("machineryId")
            if "startDate" in norm and "date" not in norm:
                norm["date"] = norm.pop("startDate")

    # Number normalizations
    for num_key in ["area", "acres", "amount", "totalAmount", "additionalCharges", "yieldQty", "revenue", "expectedPrice", "quantityAvailable", "ratePerAcre", "duration"]:
        if num_key in norm:
            val = normalize_number(norm[num_key])
            if val is not None:
                norm[num_key] = val

    # Date normalizations
    for date_key in ["sowingDate", "date", "startDate", "endDate"]:
        if date_key in norm:
            parsed = parse_relative_date(norm[date_key])
            if parsed:
                norm[date_key] = parsed

    # Default dates to today when omitted
    if intent in ("CROP_ADD_EXPENSE", "GROUP_RECORD_WORK") and not norm.get("date"):
        norm["date"] = BASE_DATE.strftime("%Y-%m-%d")

    return norm

def _has_group_page_context(page_context: Optional[dict]) -> bool:
    if not isinstance(page_context, dict):
        return False
    if page_context.get("groupId") or page_context.get("group_id"):
        return True
    path = str(page_context.get("path", "") or "")
    m = re.search(r"/groups/([^/?#]+)", path)
    return bool(m and m.group(1) not in ("personal", "create"))

def validate_action(
    intent: str,
    params: Dict[str, Any],
    language: str = "en",
    user_context: Optional[dict] = None,
    page_context: Optional[dict] = None
) -> Tuple[bool, List[str], Dict[str, Any]]:
    """
    Validates if all mandatory parameters for an action are present.
    Returns: (is_complete, missing_fields, normalized_params)
    """
    if intent not in DATA_MODIFYING_INTENTS:
        return True, [], params

    norm_params = normalize_parameters(intent, params)
    spec = DATA_MODIFYING_INTENTS[intent]
    mandatory = list(spec["mandatory"])

    if intent == "GROUP_ADD_MEMBER":
        work_groups = (user_context or {}).get("workGroups") or []
        if len(work_groups) > 1 and not _has_group_page_context(page_context) and "groupName" not in mandatory:
            mandatory.insert(0, "groupName")

    missing = []
    for field in mandatory:
        if intent == "MACHINERY_BOOK" and field == "machineName" and norm_params.get("machineId"):
            continue
        val = norm_params.get(field)
        if val is None or (isinstance(val, str) and not val.strip()) or (isinstance(val, list) and len(val) == 0):
            missing.append(field)

    return (len(missing) == 0), missing, norm_params

def generate_missing_info_question(intent: str, missing_fields: List[str], extracted: Dict[str, Any], language: str = "en") -> str:
    """Produces farmer-friendly questions targeting missing fields in the requested language."""
    field_to_ask = missing_fields[0] if missing_fields else "details"
    
    questions = {
        "cropName": {
            "en": "For which crop would you like to do this? (e.g. Paddy / Rice, Cotton, Chilli, Maize)",
            "te": "మీరు ఏ పంట కోసం ఈ చర్య చేయాలనుకుంటున్నారు? (ఉదాహరణకు: వరి, పత్తి, మిరప, మొక్కజొన్న)",
            "hi": "आप किस फसल के लिए यह कार्य करना चाहते हैं? (जैसे: धान, कपास, मिर्च, मक्का)"
        },
        "area": {
            "en": f"How many acres is the field area for {extracted.get('cropName', 'the crop')}?",
            "te": f"{extracted.get('cropName', 'పంట')} కోసం పొలం విస్తీర్ణం ఎన్ని ఎకరాలు?",
            "hi": f"{extracted.get('cropName', 'फसल')} के लिए खेत का क्षेत्रफल कितने एकड़ है?"
        },
        "sowingDate": {
            "en": f"What is the sowing date for {extracted.get('cropName', 'the crop')}? (e.g. Today, Tomorrow, or 10 November)",
            "te": f"{extracted.get('cropName', 'పంట')} విత్తిన లేదా విత్తబోయే తేదీ ఏమిటి? (ఉదా: ఈరోజు, రేపు, లేదా 10 నవంబర్)",
            "hi": f"{extracted.get('cropName', 'फसल')} की बुवाई की तारीख क्या है? (जैसे: आज, कल, या 10 नवंबर)"
        },
        "category": {
            "en": "What type of expense is this? (e.g. Seeds, Fertilizer, Pesticide, Labor, Machinery)",
            "te": "ఇది ఏ రకమైన ఖర్చు? (ఉదాహరణకు: విత్తనాలు, ఎరువులు, పురుగుమందులు, కూలీలు, యంత్రాలు)",
            "hi": "यह किस प्रकार का खर्च है? (जैसे: बीज, उर्वरक/खाद, कीटनाशक, मजदूरी, मशीनरी)"
        },
        "amount": {
            "en": f"What was the total amount spent on {extracted.get('category', 'this')} in Rupees?",
            "te": f"{extracted.get('category', 'దీని')} కోసం ఖర్చు చేసిన మొత్తం రూపాయలు ఎంత?",
            "hi": f"{extracted.get('category', 'इसके')} लिए खर्च की गई कुल राशि कितने रुपये है?"
        },
        "yieldQty": {
            "en": "What was the total harvest yield in quintals?",
            "te": "మొత్తం దిగుబడి ఎన్ని క్వింటాళ్లు వచ్చింది?",
            "hi": "कुल उपज कितने क्विंटल प्राप्त हुई?"
        },
        "revenue": {
            "en": "What is the total sale revenue received in Rupees?",
            "te": "అమ్మకం ద్వారా వచ్చిన మొత్తం రాబడి (రూపాయలు) ఎంత?",
            "hi": "बिक्री से प्राप्त कुल आय कितने रुपये है?"
        },
        "machineName": {
            "en": "Which machinery equipment would you like to book? (e.g. Tractor, Harvester, Rotavator)",
            "te": "మీరు ఏ యంత్రాన్ని బుక్ చేయాలనుకుంటున్నారు? (ఉదాహరణకు: ట్రాక్టర్, హార్వెస్టర్, రోటవేటర్)",
            "hi": "आप कौन सी मशीनरी बुक करना चाहते हैं? (जैसे: ट्रैक्टर, हार्वेस्टर, रोटावेटर)"
        },
        "date": {
            "en": "For which date do you need the machinery booked?",
            "te": "మీకు ఏ తేదీన యంత్రం అవసరం?",
            "hi": "आपको किस तारीख के लिए मशीनरी चाहिए?"
        },
        "startDate": {
            "en": "For which date do you need the machinery booked?",
            "te": "మీకు ఏ తేదీన యంత్రం అవసరం?",
            "hi": "आपको किस तारीख के लिए मशीनरी चाहिए?"
        },
        "receiverName": {
            "en": "Who would you like to send this message to?",
            "te": "మీరు ఎవరికి ఈ సందేశం పంపాలనుకుంటున్నారు?",
            "hi": "आप यह संदेश किसे भेजना चाहते हैं?"
        },
        "message": {
            "en": "What message would you like to send?",
            "te": "మీరు ఏ సందేశం పంపాలనుకుంటున్నారు?",
            "hi": "आप क्या संदेश भेजना चाहते हैं?"
        },
        "content": {
            "en": "What would you like to write in your community post?",
            "te": "మీ కమ్యూనిటీ పోస్ట్‌లో ఏమి రాయాలనుకుంటున్నారు?",
            "hi": "आप अपनी कम्युनिटी पोस्ट में क्या लिखना चाहते हैं?"
        },
        "name": {
            "en": "What would you like to name the work group?",
            "te": "వర్క్ గ్రూప్‌కు ఏ పేరు పెట్టాలనుకుంటున్నారు?",
            "hi": "आप वर्क ग्रुप का क्या नाम रखना चाहते हैं?"
        },
        "groupName": {
            "en": "Which work group is this for?",
            "te": "ఇది ఏ వర్క్ గ్రూప్ కోసం?",
            "hi": "यह किस वर्क ग्रुप के लिए है?"
        },
        "memberName": {
            "en": "What is the name of the member you want to add?",
            "te": "మీరు జోడించాలనుకుంటున్న సభ్యుని పేరు ఏమిటి?",
            "hi": "आप जिस सदस्य को जोड़ना चाहते हैं उसका नाम क्या है?"
        },
        "landOwnerName": {
            "en": "Whose farm/land was this work done on? (Land owner name)",
            "te": "ఈ పని ఏ భూ యజమాని పొలంలో జరిగింది?",
            "hi": "यह काम किस जमीन मालिक के खेत में किया गया?"
        },
        "crop": {
            "en": "Which crop was this group work performed for?",
            "te": "ఈ గ్రూప్ పని ఏ పంట కోసం జరిగింది?",
            "hi": "यह ग्रुप कार्य किस फसल के लिए किया गया?"
        },
        "activityType": {
            "en": "What type of farm work was performed? (e.g. Transplanting, Sowing, Weeding, Harvesting)",
            "te": "ఏ రకమైన పని జరిగింది? (ఉదా: నాట్లు, విత్తనం, కలుపు, కోత)",
            "hi": "किस प्रकार का कार्य किया गया? (जैसे: रोपाई, बुवाई, निराई, कटाई)"
        },
        "acres": {
            "en": "How many acres were worked?",
            "te": "ఎన్ని ఎకరాల్లో పని జరిగింది?",
            "hi": "कितने एकड़ में काम किया गया?"
        },
        "ratePerAcre": {
            "en": "What is the wage rate per acre in Rupees?",
            "te": "ఎకరాకు కూలీ రేటు ఎన్ని రూపాయలు?",
            "hi": "प्रति एकड़ मजदूरी दर कितने रुपये है?"
        },
        "totalAmount": {
            "en": "What is the total settlement amount in Rupees?",
            "te": "మొత్తం సెటిల్‌మెంట్ మొత్తం రూపాయలు ఎంత?",
            "hi": "कुल निपटान राशि कितने रुपये है?"
        }
    }

    field_dict = questions.get(field_to_ask, {})
    lang_code = language[:2].lower() if language else "en"
    return field_dict.get(lang_code, field_dict.get("en", "Please provide the required details to continue."))

def build_confirmation_card_data(action_id: str, intent: str, params: Dict[str, Any], language: str = "en") -> Dict[str, Any]:
    """Builds a structured confirmation payload matching Web and Android Card components."""
    spec = DATA_MODIFYING_INTENTS.get(intent, {
        "title": {"en": "Confirm Action", "te": "చర్యను నిర్ధారించండి", "hi": "कार्य की पुष्टि करें"},
        "fields": {}
    })

    lang_code = language[:2].lower() if language else "en"
    title = spec["title"].get(lang_code, spec["title"]["en"])
    field_defs = spec.get("fields", {})

    display_fields = []
    for k, v in params.items():
        if v is None or v == "":
            continue
        label_dict = field_defs.get(k, {})
        label = label_dict.get(lang_code, label_dict.get("en", k.title()))
        
        # Format values nicely
        if isinstance(v, list):
            display_val = ", ".join(str(x) for x in v)
        else:
            display_val = str(v)
        if k in ["amount", "revenue", "expectedPrice", "ratePerAcre", "additionalCharges", "totalAmount"]:
            display_val = f"₹{v:g}" if isinstance(v, (int, float)) else f"₹{v}"
        elif k in ["area", "acres"]:
            display_val = f"{v:g} Acres" if isinstance(v, (int, float)) else f"{v} Acres"
        elif k == "yieldQty":
            display_val = f"{v:g} Quintals" if isinstance(v, (int, float)) else f"{v} Qtl"

        display_fields.append({
            "key": k,
            "label": label,
            "value": display_val
        })

    # Summary text
    crop = params.get("cropName", "")
    summary_map = {
        "CROP_ADD": {
            "en": f"Ready to add {crop} ({params.get('area', '')} Acres) sown on {params.get('sowingDate', '')} to your active crops.",
            "te": f"మీ పంటల జాబితాకు {crop} ({params.get('area', '')} ఎకరాలు, విత్తిన తేదీ: {params.get('sowingDate', '')}) జోడించడానికి సిద్ధంగా ఉంది.",
            "hi": f"आपकी सक्रिय फसलों में {crop} ({params.get('area', '')} एकड़, बुवाई: {params.get('sowingDate', '')}) जोड़ने के लिए तैयार हैं।"
        },
        "CROP_ADD_EXPENSE": {
            "en": f"Ready to record {params.get('category', 'Expense')} of ₹{params.get('amount', '')} for {crop}.",
            "te": f"{crop} పంట కోసం ₹{params.get('amount', '')} {params.get('category', 'ఖర్చు')} నమోదు చేయడానికి సిద్ధంగా ఉంది.",
            "hi": f"{crop} फसल के लिए ₹{params.get('amount', '')} का {params.get('category', 'खर्च')} दर्ज करने के लिए तैयार हैं।"
        },
        "CROP_SELL": {
            "en": f"Ready to record harvest sale of {crop}: {params.get('yieldQty', '')} Quintals for ₹{params.get('revenue', '')}.",
            "te": f"{crop} విక్రయం నమోదు: {params.get('yieldQty', '')} క్వింటాళ్లు, మొత్తం రాబడి ₹{params.get('revenue', '')}.",
            "hi": f"{crop} की फसल बिक्री दर्ज: {params.get('yieldQty', '')} क्विंटल, कुल आय ₹{params.get('revenue', '')}।"
        },
        "MACHINERY_BOOK": {
            "en": f"Ready to book {params.get('machineName', 'machinery')} for {params.get('date') or params.get('startDate', '')}.",
            "te": f"{params.get('machineName', 'యంత్రం')} ను {params.get('date') or params.get('startDate', '')} తేదీన బుక్ చేయడానికి సిద్ధంగా ఉంది.",
            "hi": f"{params.get('machineName', 'मशीनरी')} को {params.get('date') or params.get('startDate', '')} के लिए बुक करने के लिए तैयार हैं।"
        },
        "GROUP_CREATE": {
            "en": f"Ready to create work group '{params.get('name', '')}'.",
            "te": f"'{params.get('name', '')}' వర్క్ గ్రూప్ సృష్టించడానికి సిద్ధంగా ఉంది.",
            "hi": f"वर्क ग्रुप '{params.get('name', '')}' बनाने के लिए तैयार हैं।"
        },
        "GROUP_ADD_MEMBER": {
            "en": f"Ready to add {params.get('memberName', 'member')} to {params.get('groupName', 'your work group')}.",
            "te": f"{params.get('groupName', 'మీ గ్రూప్')} లో {params.get('memberName', 'సభ్యుడిని')} జోడించడానికి సిద్ధంగా ఉంది.",
            "hi": f"{params.get('groupName', 'वर्क ग्रुप')} में {params.get('memberName', 'सदस्य')} को जोड़ने के लिए तैयार हैं।"
        },
        "GROUP_RECORD_WORK": {
            "en": f"Ready to record {params.get('acres', '')} acres of {params.get('activityType', '')} ({params.get('crop', '')}) at {params.get('landOwnerName', '')}'s farm.",
            "te": f"{params.get('landOwnerName', '')} పొలంలో {params.get('acres', '')} ఎకరాల {params.get('crop', '')} {params.get('activityType', '')} పని నమోదు చేయడానికి సిద్ధంగా ఉంది.",
            "hi": f"{params.get('landOwnerName', '')} के खेत में {params.get('acres', '')} एकड़ {params.get('crop', '')} ({params.get('activityType', '')}) कार्य दर्ज करने के लिए तैयार हैं।"
        },
        "GROUP_SETTLEMENT": {
            "en": f"Ready to record ₹{params.get('totalAmount', '')} settlement via {params.get('paymentMode', 'CASH')}.",
            "te": f"{params.get('paymentMode', 'CASH')} ద్వారా ₹{params.get('totalAmount', '')} సెటిల్‌మెంట్ నమోదు చేయడానికి సిద్ధంగా ఉంది.",
            "hi": f"{params.get('paymentMode', 'CASH')} के माध्यम से ₹{params.get('totalAmount', '')} का निपटान दर्ज करने के लिए तैयार हैं।"
        }
    }

    summary = summary_map.get(intent, {}).get(lang_code, f"Please review and confirm to execute {title}.")

    confirm_label = {
        "en": "Confirm & Execute",
        "te": "సరే, ధృవీకరించండి",
        "hi": "पुष्टि करें और जोड़ें"
    }.get(lang_code, "Confirm")

    edit_label = {
        "en": "Edit Details",
        "te": "వివరాలు సవరించండి",
        "hi": "विवरण बदलें"
    }.get(lang_code, "Edit")

    cancel_label = {
        "en": "Cancel",
        "te": "వద్దు, రద్దు చేయండి",
        "hi": "रद्द करें"
    }.get(lang_code, "Cancel")

    return {
        "action_id": action_id,
        "intent": intent,
        "status": "pending_confirmation",
        "title": title,
        "summary": summary,
        "display_fields": display_fields,
        "extracted_params": params,
        "buttons": {
            "confirm": confirm_label,
            "edit": edit_label,
            "cancel": cancel_label
        }
    }

