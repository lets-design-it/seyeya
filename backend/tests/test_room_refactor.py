"""
Comprehensive unit tests for ALL room and room category API endpoints in app/api/v1/accommodation.py
"""
import pytest
import pytest_asyncio
import uuid
from httpx import AsyncClient
from app.main import app
from app.core.security import create_access_token


@pytest_asyncio.fixture
async def async_client():
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client


@pytest.mark.asyncio
async def test_room_category_apis(async_client: AsyncClient):
    token = create_access_token(data={"sub": "1", "role": "Admin"})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. GET /api/v1/accommodation/categories
    cat_list_res = await async_client.get("/api/v1/accommodation/categories", headers=headers)
    assert cat_list_res.status_code == 200
    assert isinstance(cat_list_res.json(), list)

    # 2. POST /api/v1/accommodation/categories
    unique_cat_name = f"Test Category {uuid.uuid4().hex[:6]}"
    create_cat_res = await async_client.post(
        "/api/v1/accommodation/categories",
        json={
            "category_name": unique_cat_name,
            "description": "Category for comprehensive room endpoint testing",
            "base_rate": 150.00,
            "is_active": True
        },
        headers=headers
    )
    assert create_cat_res.status_code in (200, 201)
    cat_data = create_cat_res.json()
    cat_id = cat_data["room_category_id"]
    assert cat_data["category_name"] == unique_cat_name

    # 2b. GET /api/v1/accommodation/categories/{cat_id}
    get_single_res = await async_client.get(f"/api/v1/accommodation/categories/{cat_id}", headers=headers)
    assert get_single_res.status_code == 200
    assert get_single_res.json()["room_category_id"] == cat_id
    assert get_single_res.json()["category_name"] == unique_cat_name

    # 2c. GET 404 for non-existent category
    get_404_res = await async_client.get("/api/v1/accommodation/categories/999999", headers=headers)
    assert get_404_res.status_code == 404

    # 3. PUT /api/v1/accommodation/categories/{cat_id}
    updated_cat_name = f"Updated Category {uuid.uuid4().hex[:6]}"
    put_cat_res = await async_client.put(
        f"/api/v1/accommodation/categories/{cat_id}",
        json={
            "category_name": updated_cat_name,
            "base_rate": 175.50
        },
        headers=headers
    )
    assert put_cat_res.status_code == 200
    assert put_cat_res.json()["category_name"] == updated_cat_name
    assert float(put_cat_res.json()["base_rate"]) == 175.50

    # 4. DELETE empty category
    del_cat_res = await async_client.delete(f"/api/v1/accommodation/categories/{cat_id}", headers=headers)
    assert del_cat_res.status_code == 200


@pytest.mark.asyncio
async def test_all_room_apis(async_client: AsyncClient):
    token = create_access_token(data={"sub": "1", "role": "Admin"})
    headers = {"Authorization": f"Bearer {token}"}

    # Setup Category for rooms with full features
    cat_payload = {
        "category_name": f"Room Suite {uuid.uuid4().hex[:6]}",
        "description": "Category for room unit testing",
        "base_rate": 200.00,
        "is_active": True,
        "room_size": 120.0,
        "room_size_unit": "m²",
        "max_occupancy": 4,
        "beds": [
            {"type": "King Bed", "quantity": 1},
            {"type": "Twin Bed", "quantity": 2}
        ],
        "views": ["Ocean View", "Garden View"],
        "bathroom_features": ["Rain Shower", "Free-standing Tub", "Double Vanity"],
        "room_facilities": ["High-Speed Wi-Fi", "Smart TV", "Mini Fridge", "Air Conditioning"],
        "images": [
            {"url": "https://example.com/photos/room_main.jpg", "is_primary": True},
            {"url": "https://example.com/photos/room_deck.jpg", "is_primary": False}
        ]
    }
    cat_res = await async_client.post("/api/v1/accommodation/categories", json=cat_payload, headers=headers)
    assert cat_res.status_code in (200, 201), cat_res.text
    created_cat = cat_res.json()
    cat_id = created_cat["room_category_id"]

    assert created_cat["room_size"] == 120.0
    assert len(created_cat["beds"]) == 2
    assert len(created_cat["views"]) == 2
    assert len(created_cat["bathroom_features"]) == 3
    assert len(created_cat["room_facilities"]) == 4
    assert len(created_cat["images"]) == 2

    # 1. GET /api/v1/accommodation/rooms (available rooms query)
    avail_res = await async_client.get("/api/v1/accommodation/rooms?check_in=2026-09-01&check_out=2026-09-05")
    assert avail_res.status_code == 200
    assert isinstance(avail_res.json(), list)

    # 2. GET /api/v1/accommodation/rooms/all (all rooms)
    all_res = await async_client.get("/api/v1/accommodation/rooms/all", headers=headers)
    assert all_res.status_code == 200
    assert isinstance(all_res.json(), list)

    # 3. GET non-existent room ID -> 404
    get_404 = await async_client.get("/api/v1/accommodation/rooms/9999999")
    assert get_404.status_code == 404

    # 4. POST /api/v1/accommodation/rooms (Create Room)
    test_room_num = f"RM-{uuid.uuid4().hex[:6].upper()}"
    room_payload = {
        "room_category_id": cat_id,
        "room_number": test_room_num,
        "room_name": "Executive Ocean Villa",
        "building": "Ocean Block",
        "wing": "South Wing",
        "floor": "3rd Floor",
        "room_status": "Available",
        "is_active": True
    }

    create_res = await async_client.post("/api/v1/accommodation/rooms", json=room_payload, headers=headers)
    assert create_res.status_code == 201, f"Failed to create room: {create_res.text}"
    created_room = create_res.json()
    room_id = created_room["room_id"]

    assert created_room["room_number"] == test_room_num
    assert created_room["room_name"] == "Executive Ocean Villa"
    assert created_room["building"] == "Ocean Block"
    assert created_room["wing"] == "South Wing"
    assert created_room["floor"] == "3rd Floor"

    # 5. POST duplicate room_number -> 400
    dup_res = await async_client.post("/api/v1/accommodation/rooms", json=room_payload, headers=headers)
    assert dup_res.status_code == 400
    assert "already exists" in dup_res.json()["detail"]

    # 6. POST invalid category -> 404
    bad_cat_payload = dict(room_payload)
    bad_cat_payload["room_number"] = f"RM-{uuid.uuid4().hex[:6].upper()}"
    bad_cat_payload["room_category_id"] = 9999999
    bad_cat_res = await async_client.post("/api/v1/accommodation/rooms", json=bad_cat_payload, headers=headers)
    assert bad_cat_res.status_code == 404

    # 7. GET /api/v1/accommodation/rooms/{room_id}
    get_res = await async_client.get(f"/api/v1/accommodation/rooms/{room_id}")
    assert get_res.status_code == 200
    fetched = get_res.json()
    assert fetched["room_id"] == room_id
    assert fetched["room_name"] == "Executive Ocean Villa"

    # 8. PUT /api/v1/accommodation/categories/{cat_id} (Update Category Features)
    update_cat_payload = {
        "room_size": 130.0,
        "beds": [{"type": "Super King Bed", "quantity": 2}],
        "views": ["Ocean View"],
        "bathroom_features": ["Rain Shower", "Sauna"],
        "room_facilities": ["High-Speed Wi-Fi", "Espresso Machine"],
        "images": [
            {"url": "https://example.com/photos/room_renovated.jpg", "is_primary": True}
        ]
    }
    put_cat_res = await async_client.put(f"/api/v1/accommodation/categories/{cat_id}", json=update_cat_payload, headers=headers)
    assert put_cat_res.status_code == 200, f"Failed to update category: {put_cat_res.text}"
    updated_cat = put_cat_res.json()
    assert updated_cat["room_size"] == 130.0
    assert len(updated_cat["beds"]) == 1
    assert len(updated_cat["views"]) == 1
    assert len(updated_cat["bathroom_features"]) == 2

    # 8b. PUT /api/v1/accommodation/rooms/{room_id} (Update Room Core)
    update_payload = {
        "room_name": "Executive Ocean Villa (Renovated)"
    }
    put_res = await async_client.put(f"/api/v1/accommodation/rooms/{room_id}", json=update_payload, headers=headers)
    assert put_res.status_code == 200, f"Failed to update room: {put_res.text}"
    updated_room = put_res.json()

    assert updated_room["room_name"] == "Executive Ocean Villa (Renovated)"

    # 9. DELETE /api/v1/accommodation/rooms/{room_id}
    del_res = await async_client.delete(f"/api/v1/accommodation/rooms/{room_id}", headers=headers)
    assert del_res.status_code in (200, 204)

    # Confirm room deleted
    get_after_del = await async_client.get(f"/api/v1/accommodation/rooms/{room_id}")
    assert get_after_del.status_code == 404

    # Cleanup Category
    await async_client.delete(f"/api/v1/accommodation/categories/{cat_id}", headers=headers)
