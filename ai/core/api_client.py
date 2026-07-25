import requests
from typing import Tuple, Any

import os

BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:5000")

def make_request(method: str, endpoint: str, auth_token: str, json_data: dict = None) -> Tuple[bool, Any]:
    headers = {}
    if auth_token:
        headers["auth-token"] = auth_token
    try:
        if method.upper() == "GET":
            res = requests.get(f"{BACKEND_URL}{endpoint}", headers=headers)
        elif method.upper() == "POST":
            res = requests.post(f"{BACKEND_URL}{endpoint}", headers=headers, json=json_data)
        elif method.upper() == "PUT":
            res = requests.put(f"{BACKEND_URL}{endpoint}", headers=headers, json=json_data)
        elif method.upper() == "DELETE":
            res = requests.delete(f"{BACKEND_URL}{endpoint}", headers=headers)
        else:
            return False, f"Unsupported method: {method}"
            
        try:
            json_response = res.json()
        except:
            text_response = res.text
            if "<html" in text_response.lower() or "<!doctype" in text_response.lower():
                json_response = "The backend service encountered an internal error and is currently unavailable."
            else:
                json_response = text_response

        if res.status_code >= 400:
            return False, json_response
        return True, json_response
    except Exception as e:
        return False, str(e)
