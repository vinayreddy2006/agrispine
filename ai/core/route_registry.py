import logging

logger = logging.getLogger(__name__)

# Map of action keys to actual frontend routes found in App.jsx
FRONTEND_ROUTES = {
    "dashboard": "/dashboard",
    "add_crop": "/add-crop",
    "crop_details": "/crop/{id}",
    "my_crops": "/my-crops",
    "rent_categories": "/rent-machinery",
    "rent_list": "/rent/list/{type}",
    "rent_details": "/rent/details/{id}",
    "my_machines": "/my-machines",
    "add_machine": "/add-machine",
    "manage_machine": "/manage-machine/{id}",
    "community": "/community",
    "profile": "/profile",
    "schemes": "/schemes",
    "market": "/market",
    "reports": "/reports",
    "doctor": "/doctor",
    "buyer_market": "/buyer-market",
    "my_bookings": "/my-bookings",
    "messages": "/messages",
    "weather": "/weather",
    "ai_chat": "/ai-chat"
}

def get_frontend_route(key: str, **kwargs) -> str:
    """
    Retrieves the verified frontend route string and populates any path parameters.
    Returns '/dashboard' as a safe fallback if the route is not found or formatting fails.
    """
    if key not in FRONTEND_ROUTES:
        logger.error(f"Route key '{key}' not found in RouteRegistry. Falling back to /dashboard.")
        return "/dashboard"
        
    route_template = FRONTEND_ROUTES[key]
    
    try:
        # Format the route using provided kwargs (e.g. id=123, type='Tractor')
        # If kwargs is missing something, it throws KeyError
        route = route_template.format(**kwargs)
        return route
    except KeyError as e:
        logger.error(f"Missing parameter {e} for route '{key}'. Falling back to /dashboard.")
        return "/dashboard"
    except Exception as e:
        logger.error(f"Error formatting route '{key}': {str(e)}. Falling back to /dashboard.")
        return "/dashboard"
