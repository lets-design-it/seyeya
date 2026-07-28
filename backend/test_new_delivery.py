import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import get_current_user

# Mock auth
def override_get_current_user():
    return {"user_id": 1, "role": "admin", "permissions": []}

app.dependency_overrides[get_current_user] = override_get_current_user
client = TestClient(app)

def test_delivery_endpoints():
    print("1. Creating Delivery Pricing Config...")
    payload = {
        "restaurant_lat": -1.2921,
        "restaurant_lng": 36.8219,
        "price_per_km": 1000.00,
        "minimum_delivery_fee": 150.00,
        "maximum_delivery_distance_km": 15.00,
        "is_active": True
    }
    response = client.post("/api/v1/restaurant/admin/delivery-pricing", json=payload)
    print("Create Config Response:", response.status_code)
    
    print("\n2. Testing /calculate endpoint...")
    calc_payload = {
        "delivery_lat": -1.3000,
        "delivery_lng": 36.8200
    }
    response = client.post("/api/v1/restaurant/delivery-pricing/calculate", json=calc_payload)
    print("Calculate Response:", response.status_code, response.json())
    assert response.status_code == 200
    charge = response.json().get("delivery_charge")
    print("Calculated Charge:", charge)
    
    print("\n3. Testing /orders endpoint with the charge...")
    order_payload = {
        "customer_id": None,
        "delivery_option": "Delivery",
        "delivery_lat": -1.3000,
        "delivery_lng": 36.8200,
        "delivery_charge": charge,
        "items": [{"menu_item_id": 23, "quantity": 1}]
    }
    response = client.post("/api/v1/restaurant/orders", json=order_payload)
    print("Order Response:", response.status_code)
    if response.status_code == 200:
        data = response.json()
        print("Order Total:", data.get("total_amount"))
        print("Order Delivery Charge:", data.get("delivery_charge"))

if __name__ == "__main__":
    test_delivery_endpoints()
