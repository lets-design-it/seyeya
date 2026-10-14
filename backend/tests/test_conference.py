"""
Unit and integration tests for conference reservation endpoints and schemas.
"""
import pytest
from datetime import date, time, datetime
from decimal import Decimal
from unittest.mock import MagicMock, AsyncMock
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import app
from app.db.database import get_db
from app.core.security import get_current_user
from app.schemas import ConferenceReservationCreate, ConferenceReservationResponse
from app.repositories import ConferenceRepository
from app.models import ConferenceReservation, ConferenceHall

client = TestClient(app)


# =====================================================================
# 1. SCHEMA VALIDATION TESTS
# =====================================================================

def test_conference_reservation_schema_valid():
    data = {
        "customer_id": 1,
        "hall_id": 2,
        "event_name": "Annual Strategy Planning",
        "event_start_date": "2026-08-10",
        "event_end_date": "2026-08-12",
        "start_time": "09:00:00",
        "end_time": "17:00:00",
        "num_participants": 50,
        "hall_standard_price": 500.00,
        "subtotal": 500.00,
        "total_amount": 500.00,
        "special_requests": "Theater style seating"
    }
    schema = ConferenceReservationCreate(**data)
    assert schema.customer_id == 1
    assert schema.event_start_date == date(2026, 8, 10)
    assert schema.event_end_date == date(2026, 8, 12)
    assert schema.hall_standard_price == Decimal("500.00")


def test_conference_reservation_schema_invalid():
    data = {
        "customer_id": 1,
        "hall_id": 2,
        "event_name": "Annual Strategy Planning",
        "event_date": "2026-08-10",  # Legacy event_date should fail validation now
        "start_time": "09:00:00",
        "end_time": "17:00:00",
        "num_participants": 50
    }
    with pytest.raises(ValidationError):
        ConferenceReservationCreate(**data)


# =====================================================================
# 2. API ENDPOINT TESTS
# =====================================================================

def test_create_conference_reservation_success(monkeypatch):
    # Setup mocks
    mock_db = MagicMock()
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()
    
    from app.models import Customer
    mock_customer = Customer(
        customer_id=1,
        full_name="Test Customer",
        customer_code="C001",
        email="test@example.com",
        phone_number="1234567890",
        total_spent=Decimal("0.00"),
        visit_count=1,
        loyalty_points=0,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    mock_hall = ConferenceHall(
        hall_id=2,
        hall_name="Grand Ballroom",
        capacity=100,
        standard_price=Decimal("500.00"),
        description="Grand Ballroom",
        image="hall.jpg",
        is_active=True
    )
    
    mock_reservation = ConferenceReservation(
        conference_res_id=123,
        customer_id=1,
        hall_id=2,
        reservation_code="CON-2026-ABCDEF",
        event_name="Annual Strategy Planning",
        event_start_date=date(2026, 8, 10),
        event_end_date=date(2026, 8, 12),
        start_time=time(9, 0),
        end_time=time(17, 0),
        num_participants=50,
        booking_type="Standard",
        total_amount=Decimal("500.00"),
        subtotal=Decimal("500.00"),
        hall_cost=Decimal("500.00"),
        payment_responsibility="Individual",
        amount_paid=Decimal("0.00"),
        balance_due=Decimal("500.00"),
        reservation_status="Pending",
        payment_status="Pending",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    mock_reservation.hall = mock_hall
    mock_reservation.customer = mock_customer
    mock_reservation.facility_bookings = []
    async def mock_execute(stmt):
        stmt_str = str(stmt).lower()
        mock_res = MagicMock()
        mock_res.scalars.return_value.first.return_value = None
        if "customers" in stmt_str:
            mock_res.scalar_one_or_none.return_value = mock_customer
        elif "conference_halls" in stmt_str:
            mock_res.scalar_one_or_none.return_value = mock_hall
        elif "conference_reservations" in stmt_str:
            mock_res.scalar_one_or_none.return_value = mock_reservation
        else:
            mock_res.scalar_one_or_none.return_value = None
        return mock_res
        
    mock_db.execute = AsyncMock(side_effect=mock_execute)
    
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: {"user_id": 1, "role": "admin"}
    
    async def mock_create_reservation(self, *args, **kwargs):
        return mock_reservation

    monkeypatch.setattr(ConferenceRepository, "create_reservation", mock_create_reservation)
    
    payload = {
        "customer_id": 1,
        "hall_id": 2,
        "event_name": "Annual Strategy Planning",
        "event_start_date": "2026-08-10",
        "event_end_date": "2026-08-12",
        "start_time": "09:00:00",
        "end_time": "17:00:00",
        "num_participants": 50,
        "hall_standard_price": 500.00,
        "subtotal": 500.00,
        "total_amount": 500.00
    }
    
    response = client.post("/api/v1/conference/reservations", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert data["conference_res_id"] == 123
    assert data["event_start_date"] == "2026-08-10"
    assert data["event_end_date"] == "2026-08-12"
    assert float(data["total_amount"]) == 500.00
    assert float(data["hall_standard_price"]) == 500.00
    
    app.dependency_overrides.clear()


def test_retrieve_reservations_with_hall_and_facilities(monkeypatch):
    from app.models import ConferenceFacility, ConferenceHallFacility
    # Setup mocks
    mock_db = MagicMock()
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()
    
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: {"user_id": 1, "role": "admin"}
    
    mock_facility = ConferenceFacility(
        facility_id=1,
        name="Sound System",
        category_id=1,
        price=Decimal("1000.00"),
        pricing_type="FIXED",
        is_active=True
    )
    
    mock_hall_facility = ConferenceHallFacility(
        id=1,
        hall_id=2,
        facility_id=1,
        status="Available"
    )
    # Eager loaded relation mock
    mock_hall_facility.facility = mock_facility
    
    mock_hall = ConferenceHall(
        hall_id=2,
        hall_name="Grand Ballroom",
        capacity=100,
        standard_price=Decimal("500.00")
    )
    mock_hall.facilities = [mock_hall_facility]
    
    mock_reservation = ConferenceReservation(
        conference_res_id=123,
        customer_id=1,
        hall_id=2,
        reservation_code="CON-2026-ABCDEF",
        event_name="Annual Strategy Planning",
        event_start_date=date(2026, 8, 10),
        event_end_date=date(2026, 8, 12),
        start_time=time(9, 0),
        end_time=time(17, 0),
        num_participants=50,
        booking_type="Standard",
        total_amount=Decimal("500.00"),
        subtotal=Decimal("500.00"),
        hall_cost=Decimal("500.00"),
        payment_responsibility="Individual",
        amount_paid=Decimal("0.00"),
        balance_due=Decimal("500.00"),
        reservation_status="Pending",
        payment_status="Pending",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    mock_reservation.hall = mock_hall
    mock_reservation.facility_bookings = []
    
    async def mock_get_all_reservations(self):
        return [mock_reservation]
        
    monkeypatch.setattr(ConferenceRepository, "get_all_reservations", mock_get_all_reservations)
    
    response = client.get("/api/v1/conference/reservations")
    assert response.status_code == 200
    
    data = response.json()
    assert len(data) == 1
    reservation = data[0]
    assert reservation["hall"]["hall_name"] == "Grand Ballroom"
    assert len(reservation["hall"]["facilities"]) == 1
    assert reservation["hall"]["facilities"][0]["facility"]["name"] == "Sound System"
    
    app.dependency_overrides.clear()


def test_create_conference_hall(monkeypatch):
    mock_db = MagicMock()
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: {"user_id": 1, "role": "admin"}

    mock_hall = ConferenceHall(
        hall_id=10,
        hall_name="Pavilion Hall",
        capacity=200,
        standard_price=Decimal("750.00"),
        description="Spacious pavilion",
        image="pavilion.jpg",
        is_active=True
    )
    mock_hall.facilities = []

    async def mock_create_hall(self, **kwargs):
        return mock_hall

    monkeypatch.setattr(ConferenceRepository, "create_hall", mock_create_hall)

    payload = {
        "hall_name": "Pavilion Hall",
        "capacity": 200,
        "standard_price": 750.00,
        "description": "Spacious pavilion",
        "image": "pavilion.jpg",
        "facility_ids": [1, 2]
    }

    response = client.post("/api/v1/conference/halls", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["hall_name"] == "Pavilion Hall"
    assert float(data["standard_price"]) == 750.00

    app.dependency_overrides.clear()


def test_update_conference_hall(monkeypatch):
    mock_db = MagicMock()
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: {"user_id": 1, "role": "admin"}

    mock_hall = ConferenceHall(
        hall_id=2,
        hall_name="Updated Ballroom",
        capacity=150,
        standard_price=Decimal("600.00"),
        description="Updated description",
        image="ballroom_updated.jpg",
        is_active=True
    )
    mock_hall.facilities = []

    async def mock_update_hall(self, hall_id, **kwargs):
        assert hall_id == 2
        return mock_hall

    monkeypatch.setattr(ConferenceRepository, "update_hall", mock_update_hall)

    payload = {
        "hall_name": "Updated Ballroom",
        "capacity": 150,
        "standard_price": 600.00,
        "description": "Updated description",
        "facility_ids": [1]
    }

    response = client.put("/api/v1/conference/halls/2", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["hall_name"] == "Updated Ballroom"
    assert data["capacity"] == 150
    assert float(data["standard_price"]) == 600.00

    app.dependency_overrides.clear()


def test_assign_facilities_to_conference_hall(monkeypatch):
    mock_db = MagicMock()
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: {"user_id": 1, "role": "admin"}

    mock_hall = ConferenceHall(
        hall_id=2,
        hall_name="Grand Ballroom",
        capacity=100,
        standard_price=Decimal("500.00"),
        is_active=True
    )
    mock_hall.facilities = []

    async def mock_assign(self, hall_id, facility_ids):
        assert hall_id == 2
        assert facility_ids == [1, 2, 3]
        return mock_hall

    monkeypatch.setattr(ConferenceRepository, "assign_facilities_to_hall", mock_assign)

    payload = {"facility_ids": [1, 2, 3]}
    response = client.post("/api/v1/conference/halls/2/facilities", json=payload)
    assert response.status_code == 200

    app.dependency_overrides.clear()


def test_delete_conference_hall(monkeypatch):
    mock_db = MagicMock()
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: {"user_id": 1, "role": "admin"}

    async def mock_delete_hall(self, hall_id):
        assert hall_id == 2
        return True

    monkeypatch.setattr(ConferenceRepository, "delete_hall", mock_delete_hall)

    response = client.delete("/api/v1/conference/halls/2")
    assert response.status_code == 200
    data = response.json()
    assert "deleted successfully" in data["message"]

    app.dependency_overrides.clear()


def test_assign_facilities_to_category_schema():
    from app.schemas import ConferenceCategoryFacilitiesAssign
    assign = ConferenceCategoryFacilitiesAssign(facility_ids=[10, 20])
    assert assign.facility_ids == [10, 20]


def test_assign_multiple_facilities_flexible_formats(monkeypatch):
    from app.api.v1.conference import extract_facility_ids
    # Dict format with facility_ids
    assert extract_facility_ids([1, 2, 3], None) == [1, 2, 3]
    # Facilities key with list of dicts
    assert extract_facility_ids(None, [{"facility_id": 4}, {"facility_id": 5}]) == [4, 5]
    # Facilities key with list of ints
    assert extract_facility_ids(None, [10, 20, 30]) == [10, 20, 30]
    # String ids
    assert extract_facility_ids(["1", "2"], None) == [1, 2]


