import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import get_current_user

def override_get_current_user():
    return {"user_id": 1, "role": "admin", "permissions": []}
app.dependency_overrides[get_current_user] = override_get_current_user
client = TestClient(app)

def test_order_breakdown():
    # First create a menu item with a choice, accompaniment, and extra
    cat = client.post("/api/v1/restaurant/admin/menu/categories", json={"category_name": "TestCat"})
    cat_id = cat.json()["category_id"]
    
    item = client.post("/api/v1/restaurant/admin/menu/items", json={"category_id": cat_id, "item_name": "TestItem", "price": 500.00})
    item_id = item.json()["menu_item_id"]
    
    extra = client.post(f"/api/v1/restaurant/admin/menu/items/{item_id}/extras", json={"extra_name": "Cheese", "price": 50.00})
    extra_id = extra.json()["extra_id"]
    
    choice = client.post(f"/api/v1/restaurant/admin/menu/items/{item_id}/choices", json={"choice_name": "Spicy", "price": 10.00})
    choice_id = choice.json()["choice_id"]
    
    acc = client.post(f"/api/v1/restaurant/admin/menu/items/{item_id}/accompaniments", json={"accompaniment_name": "Fries", "price": 100.00})
    acc_id = acc.json()["accompaniment_id"]
    
    print("Creating order...")
    order_payload = {
        "customer_id": None,
        "delivery_option": "Premises",
        "items": [{
            "menu_item_id": item_id, 
            "quantity": 2,
            "choice_id": choice_id,
            "accompaniment_id": acc_id,
            "extras": [{"extra_id": extra_id, "quantity": 1}]
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
