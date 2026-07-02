import requests

def execute_get_weather(params: dict, context: dict) -> dict:
    user_context = context.get("user", {})
    district = user_context.get("district", "Hyderabad")
    api_key = "35e669987b8f3f982e649b224ed22c0c"
    url = f"https://api.openweathermap.org/data/2.5/weather?q={district}&units=metric&appid={api_key}"
    
    try:
        res = requests.get(url)
        if res.status_code == 200:
            data = res.json()
            weather_data = {
                "temp": round(data.get("main", {}).get("temp", 0)),
                "condition": data.get("weather", [{}])[0].get("main", "Unknown"),
                "humidity": data.get("main", {}).get("humidity", 0),
                "wind": data.get("wind", {}).get("speed", 0)
            }
            return {"success": True, "message": f"Weather in {district}: {weather_data['temp']}°C, {weather_data['condition']}.", "data": weather_data}
        else:
            return {"success": False, "message": f"Failed to fetch weather for {district}."}
    except Exception as e:
        return {"success": False, "message": f"Error fetching weather: {str(e)}"}
