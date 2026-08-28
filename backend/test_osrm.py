import asyncio
from app.utils.haversine import get_driving_distance_km, calculate_haversine_distance

async def main():
    lat1, lng1 = 0.941661, 30.808889
    lat2, lng2 = 0.944773, 30.815058

    driving_dist = await get_driving_distance_km(lat1, lng1, lat2, lng2)

    print(f"Distance from ({lat1}, {lng1}) to ({lat2}, {lng2}):")
    print(f"Google Maps driving distance: {driving_dist:.2f} km")

if __name__ == "__main__":
    asyncio.run(main())
