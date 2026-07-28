import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import get_current_user
import asyncio

# Mock auth
def override_get_current_user():
    return {"user_id": 1, "role": "admin", "permissions": []}

app.dependency_overrides[get_current_user] = override_get_current_user
client = TestClient(app)

def test_order_breakdown():
    print("1. Creating order with choice, accompaniment, and extra...")
    order_payload = {
        "customer_id": None,
        "delivery_option": "Premises",
        "items": [{
            "menu_item_id": 23, 
            "quantity": 1,
            "choice_id": 3,
            "accompaniment_id": 2,
            "extras": [{"extra_id": 1, "quantity": 1}]
        }]
    }
    response = client.post("/api/v1/restaurant/orders", json=order_payload)
    print("Order Create Response:", response.status_code)
    
    if response.status_code == 200:
        data = response.json()
        print("\nOrder Item Breakdown in API Response:")
        item = data.get("items", [])[0]
        print(f"Base Item: {item.get('menu_item')}")
        print(f"Choice: {item.get('choice')}")
        print(f"Accompaniment: {item.get('accompaniment')}")
        print(f"Extras: {item.get('extras')}")
        print(f"Total Unit Price: {item.get('unit_price')}")
    else:
        print("Failed:", response.text)

if __name__ == "__main__":
    test_order_breakdown()
