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
        "booking_type": "FullDay",
        "special_requests": "Theater style seating"
    }
    schema = ConferenceReservationCreate(**data)
    assert schema.customer_id == 1
    assert schema.event_start_date == date(2026, 8, 10)
    assert schema.event_end_date == date(2026, 8, 12)
    assert schema.booking_type == "FullDay"


def test_conference_reservation_schema_invalid():
    data = {
        "customer_id": 1,
        "hall_id": 2,
        "event_name": "Annual Strategy Planning",
        "event_date": "2026-08-10",  # Legacy event_date should fail validation now
        "start_time": "09:00:00",
        "end_time": "17:00:00",
        "num_participants": 50,
        "booking_type": "FullDay"
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
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: {"user_id": 1, "role": "admin"}
    
    mock_hall = ConferenceHall(
        hall_id=2,
        hall_name="Grand Ballroom",
        capacity=100,
        full_day_rate=Decimal("500.00")
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
        booking_type="FullDay",
        total_amount=Decimal("500.00"),
        amount_paid=Decimal("0.00"),
        balance_due=Decimal("500.00"),
        reservation_status="Pending",
        payment_status="Pending",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    async def mock_get_hall_by_id(self, hall_id):
        assert hall_id == 2
        return mock_hall
        
    async def mock_create_reservation(self, customer_id, hall_id, event_name, event_start_date, event_end_date, start_time, end_time, num_participants, booking_type, reservation_code, total_amount):
        assert event_start_date == date(2026, 8, 10)
        assert event_end_date == date(2026, 8, 12)
        return mock_reservation

    monkeypatch.setattr(ConferenceRepository, "get_hall_by_id", mock_get_hall_by_id)
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
        "booking_type": "FullDay"
    }
    
    response = client.post("/api/v1/conference/reservations", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert data["conference_res_id"] == 123
    assert data["event_start_date"] == "2026-08-10"
    assert data["event_end_date"] == "2026-08-12"
    assert float(data["total_amount"]) == 500.00
    
    app.dependency_overrides.clear()
