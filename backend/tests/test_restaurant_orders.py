"""
Unit and integration tests for restaurant orders endpoints.
"""
import pytest
from datetime import datetime
from decimal import Decimal
from unittest.mock import MagicMock, AsyncMock, patch
from fastapi.testclient import TestClient
from app.main import app
from app.db.database import get_db
from app.core.security import get_current_user
from app.services import RestaurantOrderService
from app.models import RestaurantOrder, OrderItem

client = TestClient(app)

# Mock user for auth
def override_get_current_user():
    return {"user_id": 1, "role": "admin"}

app.dependency_overrides[get_current_user] = override_get_current_user

def test_create_order(monkeypatch):
    app.dependency_overrides[get_db] = lambda: AsyncMock()
    
    async def mock_create_order(*args, **kwargs):
        order = RestaurantOrder(
            order_id=1,
            order_number="ORD-2026-12345678",
            customer_id=kwargs.get("customer_id"),
            seating_location=kwargs.get("seating_location"),
            delivery_option=kwargs.get("delivery_option"),
            delivery_address=kwargs.get("delivery_address"),
            delivery_lat=kwargs.get("delivery_lat"),
            delivery_lng=kwargs.get("delivery_lng"),
            delivery_charge=kwargs.get("delivery_charge"),
            preferred_time=kwargs.get("preferred_time"),
            special_instr=kwargs.get("special_instr"),
            allergy_info=kwargs.get("allergy_info"),
            assigned_waiter=kwargs.get("assigned_waiter"),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        return order
        
    async def mock_get_order(self, order_id):
        return RestaurantOrder(
            order_id=order_id,
            order_number="ORD-2026-12345678",
            seating_location="Balcony",
            delivery_option="Remote",
            delivery_address="123 Test St",
            delivery_lat=12.34,
            delivery_lng=56.78,
            delivery_charge=5.0,
            special_instr="No onions",
            allergy_info="Peanuts",
            assigned_waiter=42,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
    monkeypatch.setattr(RestaurantOrderService, "create_order", mock_create_order)
    monkeypatch.setattr(RestaurantOrderService, "get_order", mock_get_order)
    
    data = {
        "customer_id": 1,
        "seating_location": "Balcony",
        "delivery_option": "Remote",
        "delivery_address": "123 Test St",
        "delivery_lat": 12.34,
        "delivery_lng": 56.78,
        "delivery_charge": 5.0,
        "preferred_time": "2026-09-11T12:00:00",
        "special_instr": "No onions",
        "allergy_info": "Peanuts",
        "assigned_waiter": 42,
        "items": [
            {"menu_item_id": 1, "quantity": 2}
        ]
    }
    
    response = client.post("/api/v1/restaurant/orders", json=data)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["seating_location"] == "Balcony"
    assert res_data["allergy_info"] == "Peanuts"
    assert res_data["assigned_waiter"] == 42
    assert res_data["delivery_address"] == "123 Test St"


def test_update_order(monkeypatch):
    app.dependency_overrides[get_db] = lambda: AsyncMock()
    
    mock_order = RestaurantOrder(
        order_id=1,
        order_number="ORD-2026-12345678",
        order_status="Pending",
        payment_status="Pending",
        amount_paid=Decimal(0),
        total_amount=Decimal(100),
        balance_due=Decimal(100),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    async def mock_get_order(self, order_id):
        return mock_order
        
    monkeypatch.setattr(RestaurantOrderService, "get_order", mock_get_order)
    
    data = {
        "order_status": "Confirmed",
        "payment_status": "Paid",
        "amount_paid": 100.0,
        "seating_location": "Lounge",
        "delivery_address": "456 Elm St",
        "allergy_info": "Gluten",
        "assigned_waiter": 10,
        "tracking_number": "TRK12345"
    }
    
    response = client.patch("/api/v1/restaurant/orders/1", json=data)
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["order_status"] == "Confirmed"
    assert res_data["payment_status"] == "Paid"
    assert float(res_data["amount_paid"]) == 100.0
    assert res_data["seating_location"] == "Lounge"
    assert res_data["allergy_info"] == "Gluten"
    assert res_data["assigned_waiter"] == 10
    assert res_data["tracking_number"] == "TRK12345"

