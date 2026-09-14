import pytest
from httpx import AsyncClient
from app.main import app
from decimal import Decimal
import pytest_asyncio
import uuid
from app.core.security import create_access_token

@pytest_asyncio.fixture
async def async_client():
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

@pytest.mark.asyncio
async def test_conference_reservation_creation(async_client: AsyncClient):
    token = create_access_token(data={"sub": "1", "role": "Admin"})
    admin_token_headers = {"Authorization": f"Bearer {token}"}
    uid = uuid.uuid4().hex[:6]
    # Create customer
    customer_data = {
        "full_name": f"Acme Corp {uid}",
        "email": f"contact_{uid}@acmecorp.com",
        "phone_number": f"123{uid}",
        "customer_type": "Organisation",
        "company_name": f"Acme Corporation {uid}"
    }
    cust_res = await async_client.post("/api/v1/crm/customers", json=customer_data, headers=admin_token_headers)
    print(cust_res.text)
    assert cust_res.status_code in [200, 201]
    customer_id = cust_res.json()["customer_id"]

    # Create hall
    hall_data = {
        "hall_name": f"Grand Hall {uid}",
        "capacity": 100,
        "standard_price": 500000.0,
        "hourly_rate": 50000.0,
        "half_day_rate": 200000.0,
        "full_day_rate": 400000.0,
        "description": "A very grand hall."
    }
    hall_res = await async_client.post("/api/v1/conference/halls", json=hall_data, headers=admin_token_headers)
    assert hall_res.status_code in [200, 201]
    hall_id = hall_res.json()["hall_id"]

    # Create facility 1 (Fixed)
    fac_1_data = {
        "name": f"Projector Hire {uid}",
        "price": 50000.0,
        "pricing_type": "FIXED"
    }
    f1_res = await async_client.post("/api/v1/conference/facilities", json=fac_1_data, headers=admin_token_headers)
    assert f1_res.status_code in [200, 201]
    fac_1_id = f1_res.json()["facility_id"]

    # Create facility 2 (Per Person)
    fac_2_data = {
        "name": f"Lunch Buffer {uid}",
        "price": 30000.0,
        "pricing_type": "PER_PERSON"
    }
    f2_res = await async_client.post("/api/v1/conference/facilities", json=fac_2_data, headers=admin_token_headers)
    assert f2_res.status_code in [200, 201]
    fac_2_id = f2_res.json()["facility_id"]

    # Create Reservation
    reservation_data = {
        "customer_id": customer_id,
        "hall_id": hall_id,
        "event_name": "Acme Annual General Meeting",
        "event_start_date": "2024-12-01",
        "event_end_date": "2024-12-01",
        "start_time": "09:00:00",
        "end_time": "17:00:00",
        "num_participants": 50,
        "booking_type": "FullDay",
        "payment_responsibility": "Organisation",
        "facilities": [
            {"facility_id": fac_1_id, "quantity": 1},  # Fixed: 50,000
            {"facility_id": fac_2_id, "quantity": 1}   # Per Person: 30,000 * 50 = 1,500,000
        ]
    }
    
    res = await async_client.post("/api/v1/conference/reservations", json=reservation_data, headers=admin_token_headers)
    print(res.text)
    assert res.status_code == 200
    
    data = res.json()
    assert data["customer_id"] == customer_id
    assert data["hall_id"] == hall_id
    assert data["payment_responsibility"] == "Organisation"
    assert data["num_participants"] == 50
    assert data["hall_unit_price"] == 500000.0
    
    # Expected: Hall Cost (FullDay = 400,000) + Fixed (50,000) + PerPerson (30,000 * 50 = 1,500,000) = 1,950,000
    assert data["subtotal"] == 1950000.0
    assert data["total_amount"] == 1950000.0
    
    assert "facility_bookings" in data
    assert len(data["facility_bookings"]) == 2
    
    f1_booking = next((f for f in data["facility_bookings"] if f["facility_id"] == fac_1_id), None)
    assert f1_booking is not None
    assert f1_booking["unit_price"] == 50000.0
    assert f1_booking["total_price"] == 50000.0
    
    f2_booking = next((f for f in data["facility_bookings"] if f["facility_id"] == fac_2_id), None)
    assert f2_booking is not None
    assert f2_booking["unit_price"] == 30000.0
    assert f2_booking["total_price"] == 1500000.0

    print("Test passed successfully.")
