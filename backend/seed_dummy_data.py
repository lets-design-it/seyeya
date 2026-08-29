import asyncio
import httpx
import uuid
import sys
from decimal import Decimal

API_URL = "http://localhost:8000/api/v1"

async def seed_data():
    async with httpx.AsyncClient(timeout=60.0) as client:
        # 1. Login to get token (assuming standard admin exists or we can create a token)
        # We will use the same token creation logic as tests since we have access to the codebase
        sys.path.append("/home/heinrich/Documents/seyeya/seyeya/backend")
        from app.core.security import create_access_token
        
        token = create_access_token(data={"sub": "1", "role": "Admin"})
        headers = {"Authorization": f"Bearer {token}"}
        
        print("Creating dummy room categories with amenities and rates...")
        
        # Create Deluxe Suite
        cat_payload_1 = {
            "category_name": f"Deluxe Ocean Suite {uuid.uuid4().hex[:4]}",
            "description": "A beautiful suite with panoramic ocean views and premium amenities.",
            "base_rate_usd": 350.00,
            "room_size": 85.5,
            "room_size_unit": "m²",
            "max_occupancy": 3,
            "is_active": True,
            "beds": [
                {"type": "King Bed", "quantity": 1}
            ],
            "views": ["Ocean View", "Pool View"],
            "bathroom_features": ["Rain Shower", "Jacuzzi", "Double Vanity"],
            "room_facilities": ["Free High-Speed Wi-Fi", "Smart TV with Netflix", "Minibar", "Espresso Machine", "Air Conditioning"],
            "images": [
                {"url": "https://images.unsplash.com/photo-1582719508461-905c673771fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", "is_primary": True, "caption": "Master Bedroom"},
                {"url": "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", "is_primary": False, "caption": "Ocean View Balcony"}
            ]
        }
        
        res1 = await client.post(f"{API_URL}/accommodation/categories", json=cat_payload_1, headers=headers)
        if res1.status_code in (200, 201):
            print(f"✅ Created Category 1: {res1.json()['category_name']}")
            cat1_id = res1.json()["room_category_id"]
            
            # Add a Rate Plan to the category
            rate_payload = {
                "rate_name": "Bed & Breakfast",
                "price": 380.00,
                "currency": "USD",
                "pricing_basis": "PER_NIGHT",
                "includes_breakfast": True,
                "includes_wifi": True,
                "refundable": True,
                "cancellation_policy": "Free cancellation up to 48 hours before check-in"
            }
            rate_res = await client.post(f"{API_URL}/accommodation/categories/{cat1_id}/rates", json=rate_payload, headers=headers)
            print(f"   ↳ Added Rate Plan: {rate_res.status_code}")
            
            # Create a Room inside this category
            room_payload = {
                "room_category_id": cat1_id,
                "room_number": f"101-{uuid.uuid4().hex[:2]}",
                "building": "Main Wing",
                "floor": "1st Floor",
                "room_status": "Available",
                "is_active": True
            }
            room_res = await client.post(f"{API_URL}/accommodation/rooms", json=room_payload, headers=headers)
            print(f"   ↳ Added Room Unit: {room_res.status_code}")
        else:
            print(f"❌ Failed Category 1: {res1.text}")

        # Create Standard Room
        cat_payload_2 = {
            "category_name": f"Standard City Room {uuid.uuid4().hex[:4]}",
            "description": "Comfortable room for business and leisure travelers.",
            "base_rate_usd": 120.00,
            "room_size": 35.0,
            "room_size_unit": "m²",
            "max_occupancy": 2,
            "is_active": True,
            "beds": [
                {"type": "Queen Bed", "quantity": 1}
            ],
            "views": ["City View"],
            "bathroom_features": ["Walk-in Shower"],
            "room_facilities": ["Free Wi-Fi", "TV", "Air Conditioning"],
            "images": [
                {"url": "https://images.unsplash.com/photo-1611892440504-42a792e24d32?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", "is_primary": True, "caption": "Standard Room"}
            ]
        }
        
        res2 = await client.post(f"{API_URL}/accommodation/categories", json=cat_payload_2, headers=headers)
        if res2.status_code in (200, 201):
            print(f"✅ Created Category 2: {res2.json()['category_name']}")
        else:
            print(f"❌ Failed Category 2: {res2.text}")

        # Fetch all categories to verify
        print("\nFetching all categories...")
        fetch_res = await client.get(f"{API_URL}/accommodation/categories", headers=headers)
        if fetch_res.status_code == 200:
            categories = fetch_res.json()
            print(f"✅ Successfully fetched {len(categories)} categories!")
            for c in categories[:2]:  # show top 2
                print(f"\n--- {c['category_name']} ---")
                print(f"Price: ${c['base_rate_usd']}")
                print(f"Max Occupancy: {c['max_occupancy']}")
                print(f"Beds: {[b['quantity'] for b in c['beds']]}x {[b['type'] for b in c['beds']]}")
                print(f"Facilities: {c['room_facilities']}")
                if c.get('available_rates'):
                    print(f"Rates: {[r['rate_name'] + ' ($' + str(r['price']) + ')' for r in c['available_rates']]}")
        else:
            print(f"❌ Failed to fetch categories: {fetch_res.text}")

if __name__ == "__main__":
    asyncio.run(seed_data())
