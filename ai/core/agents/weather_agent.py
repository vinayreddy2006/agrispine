import requests

def execute_get_weather(params: dict, context: dict) -> dict:
    user_context = context.get("user", {})
    location = params.get("location") or user_context.get("village") or user_context.get("district") or "Hyderabad"
    api_key = "35e669987b8f3f982e649b224ed22c0c"
    
    candidates = [location]
    if " " in location:
        candidates.extend(location.split())
    if "bhuvanagiri" in location.lower() or "yadadri" in location.lower():
        candidates.extend(["Bhongir", "Bhuvanagiri"])
    candidates.append("Hyderabad")
    
    seen = set()
    for loc in candidates:
        if loc in seen:
            continue
        seen.add(loc)
        try:
            url = f"https://api.openweathermap.org/data/2.5/weather?q={loc}&units=metric&appid={api_key}"
            res = requests.get(url, timeout=5)
            if res.status_code == 200:
                data = res.json()
                weather_data = {
                    "temp": round(data.get("main", {}).get("temp", 0)),
                    "condition": data.get("weather", [{}])[0].get("main", "Unknown"),
                    "humidity": data.get("main", {}).get("humidity", 0),
                    "wind": data.get("wind", {}).get("speed", 0)
                }
                return {
                    "success": True,
                    "message": f"Weather in {location}: {weather_data['temp']}°C, {weather_data['condition']}.",
                    "data": weather_data,
                    "action": {"intent": "NAVIGATE", "path": "/services/weather", "params": {"location": location}}
                }
        except Exception:
            continue
            
    return {"success": False, "message": f"Failed to fetch weather for {location}."}
