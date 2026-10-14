"""
Comprehensive unit tests for Room Amenities, Rate Plans, and Policies endpoints.
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
async def test_room_amenity_features(async_client: AsyncClient):
    token = create_access_token(data={"sub": "1", "role": "Admin"})
    headers = {"Authorization": f"Bearer {token}"}
    
    unique_suffix = uuid.uuid4().hex[:6]
    
    # 1. Create Amenity Category
    cat_payload = {
        "name": f"Test Category {unique_suffix}",
        "description": "Category for testing",
        "is_active": True
    }
    cat_res = await async_client.post("/api/v1/accommodation/amenity-categories", json=cat_payload, headers=headers)
    assert cat_res.status_code == 200, cat_res.text
    category_id = cat_res.json()["category_id"]
    
    # 2. Get Amenity Categories
    cats_res = await async_client.get("/api/v1/accommodation/amenity-categories", headers=headers)
    assert cats_res.status_code == 200
    assert any(c["category_id"] == category_id for c in cats_res.json())
    
    # 3. Create Amenities
    am1_payload = {
        "category_id": category_id,
        "name": f"King Bed {unique_suffix}",
        "description": "Luxurious bed",
        "icon": "bed",
        "price": 25.00,
        "is_active": True
    }
    am1_res = await async_client.post("/api/v1/accommodation/amenities", json=am1_payload, headers=headers)
    assert am1_res.status_code == 200, am1_res.text
    amenity1_id = am1_res.json()["amenity_id"]
    
    am2_payload = {
        "category_id": category_id,
        "name": f"WiFi {unique_suffix}",
        "is_active": True
    }
    am2_res = await async_client.post("/api/v1/accommodation/amenities", json=am2_payload, headers=headers)
    assert am2_res.status_code == 200, am2_res.text
    amenity2_id = am2_res.json()["amenity_id"]
    
    am3_payload = {
        "category_id": None,
        "name": f"Air Conditioned {unique_suffix}",
        "is_active": True
    }
    am3_res = await async_client.post("/api/v1/accommodation/amenities", json=am3_payload, headers=headers)
    assert am3_res.status_code == 200, am3_res.text
    amenity3_id = am3_res.json()["amenity_id"]
    
    # 4. Get Amenities
    ams_res = await async_client.get("/api/v1/accommodation/amenities", headers=headers)
    assert ams_res.status_code == 200
    assert any(a["amenity_id"] == amenity1_id for a in ams_res.json())
    
    # 5. Create Room Category and Room to assign amenities
    room_cat_payload = {
        "category_name": f"Room Cat {unique_suffix}",
        "base_rate": 100.0,
        "is_active": True
    }
    room_cat_res = await async_client.post("/api/v1/accommodation/categories", json=room_cat_payload, headers=headers)
    assert room_cat_res.status_code in (200, 201)
    room_category_id = room_cat_res.json()["room_category_id"]
    
    room_payload = {
        "room_category_id": room_category_id,
        "room_number": f"TEST-{unique_suffix}",
        "room_status": "Available",
        "max_occupancy": 2,
        "is_active": True
    }
    room_res = await async_client.post("/api/v1/accommodation/rooms", json=room_payload, headers=headers)
    assert room_res.status_code == 201, room_res.text
    room_id = room_res.json()["id"]
    
    # 6. Assign Amenities to Category
    assign_res = await async_client.post(
        f"/api/v1/accommodation/categories/{room_category_id}/amenities",
        json=[amenity1_id, amenity2_id, amenity3_id],
        headers=headers
    )
    assert assign_res.status_code == 200, assign_res.text
    
    # 7. Create Category Rate
    rate_payload = {
        "rate_name": "Standard Rate",
        "price": "150.00",
        "includes_breakfast": True,
        "is_active": True
    }
    rate_res = await async_client.post(f"/api/v1/accommodation/categories/{room_category_id}/rates", json=rate_payload, headers=headers)
    assert rate_res.status_code == 200, rate_res.text
    rate_id = rate_res.json()["rate_id"]
    
    # 8. Create Policy
    policy_payload = {
        "policy_type": "Cancellation",
        "title": "Free Cancellation",
        "description": "Cancel anytime",
        "is_active": True
    }
    policy_res = await async_client.post(f"/api/v1/accommodation/policies", json=policy_payload, headers=headers)
    assert policy_res.status_code == 200, policy_res.text
    policy_id = policy_res.json()["policy_id"]
    
    # Assign Policy to Category
    policy_assignment_payload = {
        "policy_id": policy_id,
        "value": "48 hours prior",
        "is_active": True
    }
    assignment_res = await async_client.post(f"/api/v1/accommodation/categories/{room_category_id}/policies", json=policy_assignment_payload, headers=headers)
    assert assignment_res.status_code == 200, assignment_res.text
    assignment_id = assignment_res.json()["id"]
    
    # 9. Verify Category Response Structure
    get_cat_res = await async_client.get(f"/api/v1/accommodation/categories", headers=headers)
    assert get_cat_res.status_code == 200, get_cat_res.text
    cats_data = get_cat_res.json()
    cat_data = next((c for c in cats_data if c["room_category_id"] == room_category_id), None)
    assert cat_data is not None
    
    assert "amenities" in cat_data
    amenities = cat_data["amenities"]
    assert isinstance(amenities, list)
    cat_group = next((g for g in amenities if g["category_id"] == category_id), None)
    assert cat_group is not None
    assert len(cat_group["amenities"]) == 2
    
    king_bed_amenity = next((a for a in cat_group["amenities"] if a["id"] == amenity1_id), None)
    assert king_bed_amenity is not None
    
    uncat_group = next((g for g in amenities if g["category_id"] is None), None)
    assert uncat_group is not None
    assert uncat_group["category_name"] == "Other Room Amenities"
    assert any(a["id"] == amenity3_id for a in uncat_group["amenities"])
    
    assert "available_rates" in cat_data
    assert len(cat_data["available_rates"]) == 1
    assert cat_data["available_rates"][0]["rate_id"] == rate_id
    
    assert "policies" in cat_data
    assert len(cat_data["policies"]) == 1
    assert cat_data["policies"][0]["policy_id"] == policy_id
    
    # Verify room is clean
    get_room_res = await async_client.get(f"/api/v1/accommodation/rooms/{room_id}", headers=headers)
    assert get_room_res.status_code == 200, get_room_res.text
    room_data = get_room_res.json()
    assert "amenities" not in room_data
    assert "available_rates" not in room_data
    assert "policies" not in room_data

    # 10. Cleanup
    await async_client.delete(f"/api/v1/accommodation/rooms/{room_id}", headers=headers)
    await async_client.delete(f"/api/v1/accommodation/categories/{room_category_id}/policies/{policy_id}", headers=headers)
    await async_client.delete(f"/api/v1/accommodation/categories/{room_category_id}/rates/{rate_id}", headers=headers)
    await async_client.delete(f"/api/v1/accommodation/categories/{room_category_id}", headers=headers)
    await async_client.delete(f"/api/v1/accommodation/amenities/{amenity1_id}", headers=headers)
    await async_client.delete(f"/api/v1/accommodation/amenities/{amenity2_id}", headers=headers)
    await async_client.delete(f"/api/v1/accommodation/amenities/{amenity3_id}", headers=headers)
    await async_client.delete(f"/api/v1/accommodation/amenity-categories/{category_id}", headers=headers)
