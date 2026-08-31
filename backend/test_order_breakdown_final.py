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
    # 1. Create a category
    cat_payload = {"category_name": "Test Category 1"}
    cat_resp = client.post("/api/v1/restaurant/admin/menu/categories", json=cat_payload)
    if cat_resp.status_code != 200:
        print("Failed to create category:", cat_resp.text)
        return
    cat_id = cat_resp.json().get("category_id")

    # 2. Create a menu item
    item_payload = {"category_id": cat_id, "item_name": "Test Item 1", "price": 500.00}
    item_resp = client.post("/api/v1/restaurant/admin/menu/items", json=item_payload)
    item_id = item_resp.json().get("menu_item_id")

    # 3. Create extra
    extra_resp = client.post(f"/api/v1/restaurant/admin/menu/items/{item_id}/extras", json={"extra_name": "Cheese", "price": 50.00})
    extra_id = extra_resp.json().get("extra_id")

    # 4. Create choice
    choice_resp = client.post(f"/api/v1/restaurant/admin/menu/items/{item_id}/choices", json={"choice_name": "Spicy", "price": 10.00})
    choice_id = choice_resp.json().get("choice_id")

    # 5. Create accompaniment
    acc_resp = client.post(f"/api/v1/restaurant/admin/menu/items/{item_id}/accompaniments", json={"accompaniment_name": "Fries", "price": 100.00})
    acc_id = acc_resp.json().get("accompaniment_id")

    print("\n--- Creating Order with the new items ---")
    order_payload = {
        "customer_id": None,
        "delivery_option": "Premises",
        "items": [{
            "menu_item_id": item_id, 
            "quantity": 1,
            "choice_id": choice_id,
            "accompaniment_id": acc_id,
            "extras": [{"extra_id": extra_id, "quantity": 2}]
        }]
    }
    response = client.post("/api/v1/restaurant/orders", json=order_payload)
    print("Order Create Status:", response.status_code)
    
    if response.status_code == 200:
        data = response.json()
        print("\nOrder Item Breakdown in API Response:")
        item = data.get("items", [])[0]
        
        # Pretty print the dictionary using json
        import json
        print(json.dumps(item, indent=2))
        
        print("\nOrder Total Amount:", data.get("total_amount"))
    else:
        print("Failed to create order:", response.text)

if __name__ == "__main__":
    test_order_breakdown()
