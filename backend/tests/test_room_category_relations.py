"""
Unit tests verifying that amenities, price rates, and policies can be sent in POST and PUT payloads for Room Categories.
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
async def test_room_category_create_and_update_with_relations(async_client: AsyncClient):
    token = create_access_token(data={"sub": "1", "role": "Admin"})
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Ensure at least one Policy and Amenity exist
    policy_res = await async_client.post(
        "/api/v1/accommodation/policies",
        json={
            "policy_type": "Check-in",
            "title": f"Standard Check-in {uuid.uuid4().hex[:4]}",
            "description": "Check in at 2:00 PM"
        },
        headers=headers
    )
    assert policy_res.status_code in (200, 201)
    policy_id = policy_res.json()["policy_id"]

    amenity_res = await async_client.post(
        "/api/v1/accommodation/amenities",
        json={
            "name": f"Free Espresso {uuid.uuid4().hex[:4]}",
            "description": "In-room espresso machine",
            "icon": "coffee"
        },
        headers=headers
    )
    assert amenity_res.status_code in (200, 201)
    amenity_id = amenity_res.json()["amenity_id"]

    # 2. POST /api/v1/accommodation/categories with amenities, available_rates, and policies
    cat_name = f"Deluxe Villa {uuid.uuid4().hex[:6]}"
    create_payload = {
        "category_name": cat_name,
        "description": "Villa with full rates, policies, and amenities payload",
        "base_rate": 350.00,
        "room_size": 85.0,
        "room_size_unit": "m²",
        "max_occupancy": 3,
        "is_active": True,
        "amenity_ids": [amenity_id],
        "available_rates": [
            {
                "rate_name": "Standard Rate",
                "price": 350.00,
                "meal_plan": "Breakfast Included",
                "includes_breakfast": True
            },
            {
                "rate_name": "Non-Refundable Special",
                "price": 300.00,
                "refundable": False
            }
        ],
        "policies": [
            {
                "policy_id": policy_id,
                "value": "Check in after 14:00"
            }
        ]
    }

    create_res = await async_client.post(
        "/api/v1/accommodation/categories",
        json=create_payload,
        headers=headers
    )
    assert create_res.status_code in (200, 201), create_res.text
    created_data = create_res.json()
    category_id = created_data["room_category_id"]

    # Check that returned JSON includes policies, available_rates, and amenities
    assert len(created_data["available_rates"]) == 2
    assert any(r["rate_name"] == "Standard Rate" for r in created_data["available_rates"])
    assert len(created_data["policies"]) == 1
    assert created_data["policies"][0]["policy_id"] == policy_id
    assert len(created_data["amenities"]) > 0

    # 3. PUT /api/v1/accommodation/categories/{category_id} to update relations
    policy_res2 = await async_client.post(
        "/api/v1/accommodation/policies",
        json={
            "policy_type": "Cancellation",
            "title": f"Strict Cancellation {uuid.uuid4().hex[:4]}",
            "description": "Cancel 48 hours prior"
        },
        headers=headers
    )
    assert policy_res2.status_code in (200, 201)
    policy_id2 = policy_res2.json()["policy_id"]

    update_payload = {
        "category_name": f"Updated Villa {uuid.uuid4().hex[:6]}",
        "base_rate": 380.00,
        "available_rates": [
            {
                "rate_name": "All-Inclusive Rate",
                "price": 450.00,
                "includes_breakfast": True,
                "includes_spa": True
            }
        ],
        "policy_ids": [policy_id2]
    }

    update_res = await async_client.put(
        f"/api/v1/accommodation/categories/{category_id}",
        json=update_payload,
        headers=headers
    )
    assert update_res.status_code == 200, update_res.text
    updated_data = update_res.json()

    # Verify updated relations
    assert len(updated_data["available_rates"]) == 1
    assert updated_data["available_rates"][0]["rate_name"] == "All-Inclusive Rate"
    assert len(updated_data["policies"]) == 1
    assert updated_data["policies"][0]["policy_id"] == policy_id2

    # Clean up created category
    del_res = await async_client.delete(
        f"/api/v1/accommodation/categories/{category_id}",
        headers=headers
    )
    assert del_res.status_code == 200
