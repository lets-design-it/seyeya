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
        "price_per_km": 50.00,
        "minimum_delivery_fee": 150.00,
        "maximum_delivery_distance_km": 15.00,
        "is_active": True
    }
    response = client.post("/api/v1/restaurant/admin/delivery-pricing", json=payload)
    print("Create Response:", response.status_code, response.json())
    assert response.status_code == 201

    print("\n2. Getting active delivery pricing...")
    response = client.get("/api/v1/restaurant/delivery-pricing/active")
    print("Active Config:", response.status_code, response.json())
    assert response.status_code == 200

    print("\n3. Testing Delivery Order Calculation...")
    order_payload = {
        "customer_id": None,
        "delivery_option": "Delivery",
        "delivery_lat": -1.3000, # slightly south
        "delivery_lng": 36.8200,
        "items": [{"menu_item_id": 23, "quantity": 1}] # assuming we can create empty order or we add one item
    }
    response = client.post("/api/v1/restaurant/orders", json=order_payload)
    print("Order Response:", response.status_code, response.json())
    if response.status_code == 200:
        print("Delivery Distance:", response.json().get("delivery_distance_km"))
        print("Delivery Charge:", response.json().get("delivery_charge"))
        print("Total Amount:", response.json().get("total_amount"))

if __name__ == "__main__":
    test_delivery_endpoints()
