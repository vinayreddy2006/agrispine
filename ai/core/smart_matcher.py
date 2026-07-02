import re
import difflib
from typing import List, Dict, Any, Optional

def normalize_text(text: str) -> str:
    if not text:
        return ""
    # Convert to lowercase
    text = text.lower()
    # Remove punctuation (commas, underscores, hyphens, etc)
    text = re.sub(r'[^\w\s]', '', text)
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def smart_match(query: str, items: List[Dict[str, Any]], key: str = "name", threshold: float = 0.90) -> Dict[str, Any]:
    """
    Matches a query string against a list of dictionaries.
    """
    norm_query = normalize_text(query)
    if not norm_query or not items:
        return {"success": False, "match": None, "multiple": False, "options": [], "message": "Invalid query or empty list."}
        
    scored_items = []
    
    for item in items:
        val = item.get(key, "")
        norm_val = normalize_text(val)
        
        if not norm_val:
            continue
            
        # Calculate similarity
        similarity = difflib.SequenceMatcher(None, norm_query, norm_val).ratio()
        
        if similarity >= threshold:
            scored_items.append({"item": item, "score": similarity})
            
    if not scored_items:
        return {"success": False, "match": None, "multiple": False, "options": [], "message": "No close match found."}
        
    # Sort by score descending
    scored_items.sort(key=lambda x: x["score"], reverse=True)
    
    highest_score = scored_items[0]["score"]
    
    # Find all matches that have exactly the highest score (or are very close to it)
    top_matches = [m["item"] for m in scored_items if m["score"] >= highest_score - 0.05]
    
    # Deduplicate matches if they point to the exact same ID
    unique_matches = []
    seen_ids = set()
    for m in top_matches:
        item_id = m.get("id") or m.get("_id")
        if item_id:
            if item_id not in seen_ids:
                seen_ids.add(item_id)
                unique_matches.append(m)
        else:
            unique_matches.append(m)
            
    if len(unique_matches) > 1:
        return {
            "success": False,
            "match": None,
            "multiple": True,
            "options": unique_matches,
            "message": "I found multiple matches."
        }
        
    return {
        "success": True,
        "match": unique_matches[0],
        "multiple": False,
        "options": [],
        "message": "Match found."
    }
