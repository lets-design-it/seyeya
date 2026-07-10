"""
Unit and integration tests for menu choices, accompaniments, and extras endpoints.
"""
import pytest
from decimal import Decimal
from unittest.mock import MagicMock, AsyncMock, patch
from fastapi.testclient import TestClient
from app.main import app
from app.db.database import get_db
from app.core.security import get_current_user
from app.repositories import MenuRepository
from app.models import MenuChoice, MenuAccompaniment, MenuExtra, MenuItem

client = TestClient(app)


# =====================================================================
# 1. MENU CHOICES TEST CASES
# =====================================================================

def test_get_menu_item_choices_not_found(monkeypatch):
    app.dependency_overrides[get_db] = lambda: MagicMock()
    
    async def mock_get_menu_item(self, item_id):
        return None
        
    monkeypatch.setattr(MenuRepository, "get_menu_item", mock_get_menu_item)
    
    response = client.get("/api/v1/restaurant/menu/items/999/choices")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
    
    app.dependency_overrides.clear()


def test_get_menu_item_choices_success(monkeypatch):
    app.dependency_overrides[get_db] = lambda: MagicMock()
    
    mock_item = MenuItem(
        menu_item_id=1,
        item_name="Steak",
        price=Decimal("15.00")
    )
    mock_choice = MenuChoice(
        choice_id=10,
        choice_name="Rare",
        is_available=True,
        menu_item_id=1
    )
    mock_item.choices = [mock_choice]
    
    async def mock_get_menu_item(self, item_id):
        return mock_item
        
    monkeypatch.setattr(MenuRepository, "get_menu_item", mock_get_menu_item)
    
    response = client.get("/api/v1/restaurant/menu/items/1/choices")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["choice_id"] == 10
    assert data[0]["choice_name"] == "Rare"
    assert data[0]["is_available"] is True
    
    app.dependency_overrides.clear()


def test_add_menu_item_choice_success(monkeypatch):
    app.dependency_overrides[get_db] = lambda: MagicMock()
    app.dependency_overrides[get_current_user] = lambda: {"user_id": 1, "role": "admin"}
    
    mock_item = MenuItem(menu_item_id=1, item_name="Steak", price=Decimal("15.00"))
    mock_choice = MenuChoice(choice_id=11, choice_name="Medium", is_available=True, menu_item_id=1)
    
    async def mock_get_menu_item(self, item_id):
        return mock_item
        
    async def mock_create_choice(self, menu_item_id, choice_name, is_available):
        return mock_choice
        
    monkeypatch.setattr(MenuRepository, "get_menu_item", mock_get_menu_item)
    monkeypatch.setattr(MenuRepository, "create_menu_choice_for_item", mock_create_choice)
    
    payload = {"choice_name": "Medium", "is_available": True}
    response = client.post("/api/v1/restaurant/menu/items/1/choices", json=payload)
    
    assert response.status_code == 201
    data = response.json()
    assert data["choice_id"] == 11
    assert data["choice_name"] == "Medium"
    
    app.dependency_overrides.clear()


def test_update_menu_choice_success(monkeypatch):
    app.dependency_overrides[get_db] = lambda: MagicMock()
    app.dependency_overrides[get_current_user] = lambda: {"user_id": 1}
    
    mock_choice = MenuChoice(choice_id=11, choice_name="Medium Well", is_available=False, menu_item_id=1)
    
    async def mock_update_choice(self, choice_id, updates):
        assert choice_id == 11
        assert updates["choice_name"] == "Medium Well"
        assert updates["is_available"] is False
        return mock_choice
        
    monkeypatch.setattr(MenuRepository, "update_menu_choice", mock_update_choice)
    
    payload = {"choice_name": "Medium Well", "is_available": False}
    response = client.patch("/api/v1/restaurant/menu/choices/11", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert data["choice_id"] == 11
    assert data["choice_name"] == "Medium Well"
    assert data["is_available"] is False
    
    app.dependency_overrides.clear()


def test_delete_menu_choice_success(monkeypatch):
    app.dependency_overrides[get_db] = lambda: MagicMock()
    app.dependency_overrides[get_current_user] = lambda: {"user_id": 1}
    
    async def mock_delete_choice(self, choice_id):
        assert choice_id == 11
        return True
        
    monkeypatch.setattr(MenuRepository, "delete_menu_choice", mock_delete_choice)
    
    response = client.delete("/api/v1/restaurant/menu/choices/11")
    assert response.status_code == 204
    
    app.dependency_overrides.clear()


# =====================================================================
# 2. MENU ACCOMPANIMENTS TEST CASES
# =====================================================================

def test_get_menu_item_accompaniments_success(monkeypatch):
    app.dependency_overrides[get_db] = lambda: MagicMock()
    
    mock_item = MenuItem(menu_item_id=2, item_name="Burger", price=Decimal("10.00"))
    mock_acc = MenuAccompaniment(
        accompaniment_id=20,
        accompaniment_name="Fries",
        price=Decimal("2.50"),
        is_available=True,
        menu_item_id=2
    )
    mock_item.accompaniments = [mock_acc]
    
    async def mock_get_menu_item(self, item_id):
        return mock_item
        
    monkeypatch.setattr(MenuRepository, "get_menu_item", mock_get_menu_item)
    
    response = client.get("/api/v1/restaurant/menu/items/2/accompaniments")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["accompaniment_id"] == 20
    assert data[0]["accompaniment_name"] == "Fries"
    assert float(data[0]["price"]) == 2.50
    
    app.dependency_overrides.clear()


def test_add_menu_item_accompaniment_success(monkeypatch):
    app.dependency_overrides[get_db] = lambda: MagicMock()
    app.dependency_overrides[get_current_user] = lambda: {"user_id": 1}
    
    mock_item = MenuItem(menu_item_id=2, item_name="Burger", price=Decimal("10.00"))
    mock_acc = MenuAccompaniment(
        accompaniment_id=21,
        accompaniment_name="Salad",
        price=None,  # Not compulsory
        is_available=True,
        menu_item_id=2
    )
    
    async def mock_get_menu_item(self, item_id):
        return mock_item
        
    async def mock_create_acc(self, menu_item_id, accompaniment_name, price, is_available):
        assert price is None
        return mock_acc
        
    monkeypatch.setattr(MenuRepository, "get_menu_item", mock_get_menu_item)
    monkeypatch.setattr(MenuRepository, "create_menu_accompaniment_for_item", mock_create_acc)
    
    payload = {"accompaniment_name": "Salad", "price": None, "is_available": True}
    response = client.post("/api/v1/restaurant/menu/items/2/accompaniments", json=payload)
    
    assert response.status_code == 201
    data = response.json()
    assert data["accompaniment_id"] == 21
    assert data["accompaniment_name"] == "Salad"
    assert data["price"] is None
    
    app.dependency_overrides.clear()


def test_update_menu_accompaniment_success(monkeypatch):
    app.dependency_overrides[get_db] = lambda: MagicMock()
    app.dependency_overrides[get_current_user] = lambda: {"user_id": 1}
    
    mock_acc = MenuAccompaniment(
        accompaniment_id=21,
        accompaniment_name="Sweet Potato Fries",
        price=Decimal("3.00"),
        is_available=True,
        menu_item_id=2
    )
    
    async def mock_update_acc(self, accompaniment_id, updates):
        assert accompaniment_id == 21
        assert float(updates["price"]) == 3.00
        return mock_acc
        
    monkeypatch.setattr(MenuRepository, "update_menu_accompaniment", mock_update_acc)
    
    payload = {"price": 3.00}
    response = client.patch("/api/v1/restaurant/menu/accompaniments/21", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert data["accompaniment_id"] == 21
    assert float(data["price"]) == 3.00
    
    app.dependency_overrides.clear()


def test_delete_menu_accompaniment_success(monkeypatch):
    app.dependency_overrides[get_db] = lambda: MagicMock()
    app.dependency_overrides[get_current_user] = lambda: {"user_id": 1}
    
    async def mock_delete_acc(self, accompaniment_id):
        return True
        
    monkeypatch.setattr(MenuRepository, "delete_menu_accompaniment", mock_delete_acc)
    
    response = client.delete("/api/v1/restaurant/menu/accompaniments/21")
    assert response.status_code == 204
    
    app.dependency_overrides.clear()


# =====================================================================
# 3. MENU EXTRAS TEST CASES (EDIT/DELETE)
# =====================================================================

def test_update_menu_extra_success(monkeypatch):
    app.dependency_overrides[get_db] = lambda: MagicMock()
    app.dependency_overrides[get_current_user] = lambda: {"user_id": 1}
    
    mock_extra = MenuExtra(
        extra_id=50,
        extra_name="Extra Cheese",
        price=Decimal("1.50"),
        is_available=True,
        menu_item_id=2
    )
    
    async def mock_update_extra(self, extra_id, updates):
        assert extra_id == 50
        assert float(updates["price"]) == 1.50
        return mock_extra
        
    monkeypatch.setattr(MenuRepository, "update_menu_extra", mock_update_extra)
    
    payload = {"price": 1.50}
    response = client.patch("/api/v1/restaurant/menu/extras/50", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert data["extra_id"] == 50
    assert float(data["price"]) == 1.50
    
    app.dependency_overrides.clear()


def test_delete_menu_extra_success(monkeypatch):
    app.dependency_overrides[get_db] = lambda: MagicMock()
    app.dependency_overrides[get_current_user] = lambda: {"user_id": 1}
    
    async def mock_delete_extra(self, extra_id):
        return True
        
    monkeypatch.setattr(MenuRepository, "delete_menu_extra", mock_delete_extra)
    
    response = client.delete("/api/v1/restaurant/menu/extras/50")
    assert response.status_code == 204
    
    app.dependency_overrides.clear()
