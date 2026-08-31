import math
import httpx
import logging
from decimal import Decimal

from app.core.config import settings

logger = logging.getLogger(__name__)

def calculate_haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance in kilometers between two points 
    on the earth (specified in decimal degrees)
    """
    # Convert decimal degrees to radians 
    lon1, lat1, lon2, lat2 = map(math.radians, [lon1, lat1, lon2, lat2])

    # Haversine formula 
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a)) 
    r = 6371 # Radius of earth in kilometers
    return c * r

async def get_driving_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Get actual driving distance using Google Maps API.
    Raises an Exception if the API key is missing or the request fails.
    """
    if not settings.GOOGLE_MAPS_API_KEY:
        raise ValueError("GOOGLE_MAPS_API_KEY environment variable is not set")
        
    try:
        url = f"https://maps.googleapis.com/maps/api/distancematrix/json?origins={lat1},{lon1}&destinations={lat2},{lon2}&key={settings.GOOGLE_MAPS_API_KEY}"
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=10.0)
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "OK" and data.get("rows"):
                    elements = data["rows"][0]["elements"]
                    if elements and elements[0].get("status") == "OK":
                        distance_meters = elements[0]["distance"]["value"]
                        return distance_meters / 1000.0
                    else:
                        raise ValueError(f"Google Maps routing error: {elements[0].get('status')}")
                else:
                    raise ValueError(f"Google Maps API error: {data.get('status')}")
            else:
                raise ValueError(f"Google Maps API HTTP error: {response.status_code}")
    except Exception as e:
        logger.error(f"Google Maps distance calculation failed: {e}")
        raise
