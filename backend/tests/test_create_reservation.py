"""
Comprehensive test suite for creating conference reservations.
"""
import pytest
from datetime import date, time, datetime
from decimal import Decimal
from unittest.mock import MagicMock, AsyncMock
from fastapi.testclient import TestClient

from app.main import app
from app.db.database import get_db
from app.core.security import get_current_user
from app.schemas import ConferenceReservationCreate, ConferenceReservationResponse
from app.repositories import ConferenceRepository
from app.models import ConferenceReservation, ConferenceHall, Customer, ConferenceFacility, ConferenceBookingFacility

client = TestClient(app)


def test_create_simple_reservation(monkeypatch):
    """Test creating a basic conference reservation with standard hall pricing"""
    mock_db = MagicMock()
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()

    mock_customer = Customer(
        customer_id=10,
        customer_code="CUST-010",
        full_name="Alice Johnson",
        email="alice@example.com",
        phone_number="+256700000000",
        total_spent=Decimal("0.00"),
        visit_count=1,
        loyalty_points=0,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    mock_hall = ConferenceHall(
        hall_id=5,
        hall_name="Victoria Conference Room",
        capacity=80,
        standard_price=Decimal("450000.00"),
        is_active=True
    )
    mock_reservation = ConferenceReservation(
        conference_res_id=1,
        customer_id=10,
        hall_id=5,
        reservation_code="CON-2026-VIC001",
        event_name="Product Launch Workshop",
        event_start_date=date(2026, 9, 20),
        event_end_date=date(2026, 9, 20),
        start_time=time(9, 0),
        end_time=time(17, 0),
        num_participants=50,
        booking_type="Standard",
        total_amount=Decimal("450000.00"),
        subtotal=Decimal("450000.00"),
        hall_cost=Decimal("450000.00"),
        payment_responsibility="Individual",
        amount_paid=Decimal("200000.00"),
        balance_due=Decimal("250000.00"),
        reservation_status="Confirmed",
        payment_status="Partial",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    mock_reservation.customer = mock_customer
    mock_reservation.hall = mock_hall
    mock_reservation.facility_bookings = []

    async def mock_execute(stmt):
        stmt_str = str(stmt).lower()
        mock_res = MagicMock()
        mock_res.scalars.return_value.first.return_value = None
        mock_res.scalars.return_value.all.return_value = []
        if "from customers" in stmt_str:
            mock_res.scalar_one_or_none.return_value = mock_customer
        elif "from conference_halls" in stmt_str:
            mock_res.scalar_one_or_none.return_value = mock_hall
        elif "from conference_reservations" in stmt_str:
            mock_res.scalar_one_or_none.return_value = None
            mock_res.scalars.return_value.first.return_value = None
        else:
            mock_res.scalar_one_or_none.return_value = None
        return mock_res

    mock_db.execute = AsyncMock(side_effect=mock_execute)

    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: {"user_id": 1, "role": "admin"}

    async def mock_create(self, **kwargs):
        assert kwargs["customer_id"] == 10
        assert kwargs["hall_id"] == 5
        assert kwargs["event_name"] == "Product Launch Workshop"
        assert kwargs["hall_standard_price"] == Decimal("450000.00")
        assert kwargs["total_amount"] == Decimal("450000.00")
        assert kwargs["amount_paid"] == Decimal("200000.00")
        assert kwargs["balance_due"] == Decimal("250000.00")
        return mock_reservation

    monkeypatch.setattr(ConferenceRepository, "create_reservation", mock_create)
    async def mock_get_hall(self, hall_id):
        return mock_hall
    monkeypatch.setattr(ConferenceRepository, "get_hall_by_id", mock_get_hall)
    async def mock_get_res(self, res_id):
        return mock_reservation
    monkeypatch.setattr(ConferenceRepository, "get_reservation_by_id", mock_get_res)

    payload = {
        "customer_id": 10,
        "hall_id": 5,
        "event_name": "Product Launch Workshop",
        "event_start_date": "2026-09-20",
        "event_end_date": "2026-09-20",
        "start_time": "09:00:00",
        "end_time": "17:00:00",
        "num_participants": 50,
        "hall_standard_price": 450000.00,
        "subtotal": 450000.00,
        "total_amount": 450000.00,
        "amount_paid": 200000.00,
        "balance_due": 250000.00,
        "payment_responsibility": "Individual"
    }

    response = client.post("/api/v1/conference/reservations", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["conference_res_id"] == 1
    assert data["event_name"] == "Product Launch Workshop"
    assert float(data["hall_standard_price"]) == 450000.00
    assert float(data["total_amount"]) == 450000.00
    assert float(data["amount_paid"]) == 200000.00
    assert float(data["balance_due"]) == 250000.00
    assert data["customer"]["full_name"] == "Alice Johnson"
    assert data["hall"]["hall_name"] == "Victoria Conference Room"

    app.dependency_overrides.clear()


def test_create_reservation_with_facilities(monkeypatch):
    """Test creating a conference reservation with booked facilities"""
    mock_db = MagicMock()
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()

    mock_customer = Customer(
        customer_id=11,
        customer_code="CUST-011",
        full_name="Tech Global Ltd",
        email="events@techglobal.com",
        customer_type="Organisation",
        total_spent=Decimal("0.00"),
        visit_count=1,
        loyalty_points=0,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    mock_hall = ConferenceHall(
        hall_id=3,
        hall_name="Main Auditorium",
        capacity=300,
        standard_price=Decimal("1200000.00"),
        is_active=True
    )

    fac_1 = ConferenceFacility(facility_id=1, name="Projector & 4K Screen", price=Decimal("150000.00"))
    fac_2 = ConferenceFacility(facility_id=2, name="Buffet Lunch", price=Decimal("35000.00"))

    booking_fac_1 = ConferenceBookingFacility(
        id=101,
        booking_id=2,
        facility_id=1,
        quantity=1,
        unit_price=Decimal("150000.00"),
        total_price=Decimal("150000.00"),
        facility=fac_1
    )
    booking_fac_2 = ConferenceBookingFacility(
        id=102,
        booking_id=2,
        facility_id=2,
        quantity=100,
        unit_price=Decimal("35000.00"),
        total_price=Decimal("3500000.00"),
        facility=fac_2
    )

    mock_reservation = ConferenceReservation(
        conference_res_id=2,
        customer_id=11,
        hall_id=3,
        reservation_code="CON-2026-AUD002",
        event_name="Global Tech Summit 2026",
        event_start_date=date(2026, 11, 15),
        event_end_date=date(2026, 11, 16),
        start_time=time(8, 30),
        end_time=time(18, 0),
        num_participants=100,
        booking_type="Standard",
        total_amount=Decimal("4850000.00"),
        subtotal=Decimal("4850000.00"),
        hall_cost=Decimal("1200000.00"),
        payment_responsibility="Organisation",
        amount_paid=Decimal("4850000.00"),
        balance_due=Decimal("0.00"),
        reservation_status="Confirmed",
        payment_status="Paid",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    mock_reservation.customer = mock_customer
    mock_reservation.hall = mock_hall
    mock_reservation.facility_bookings = [booking_fac_1, booking_fac_2]

    async def mock_execute(stmt):
        stmt_str = str(stmt).lower()
        mock_res = MagicMock()
        mock_res.scalars.return_value.first.return_value = None
        mock_res.scalars.return_value.all.return_value = []
        if "from customers" in stmt_str:
            mock_res.scalar_one_or_none.return_value = mock_customer
        elif "from conference_halls" in stmt_str:
            mock_res.scalar_one_or_none.return_value = mock_hall
        elif "from conference_facilities" in stmt_str:
            if "facility_id = 1" in stmt_str or "facility_id == 1" in stmt_str or "conference_facilities.facility_id = 1" in stmt_str:
                mock_res.scalar_one_or_none.return_value = fac_1
            elif "facility_id = 2" in stmt_str or "facility_id == 2" in stmt_str or "conference_facilities.facility_id = 2" in stmt_str:
                mock_res.scalar_one_or_none.return_value = fac_2
            else:
                mock_res.scalar_one_or_none.return_value = fac_1
        elif "from conference_reservations" in stmt_str:
            mock_res.scalar_one_or_none.return_value = None
            mock_res.scalars.return_value.first.return_value = None
        else:
            mock_res.scalar_one_or_none.return_value = None
        return mock_res

    mock_db.execute = AsyncMock(side_effect=mock_execute)

    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: {"user_id": 1, "role": "admin"}

    async def mock_create(self, **kwargs):
        return mock_reservation

    monkeypatch.setattr(ConferenceRepository, "create_reservation", mock_create)
    async def mock_get_hall(self, hall_id):
        return mock_hall
    monkeypatch.setattr(ConferenceRepository, "get_hall_by_id", mock_get_hall)
    async def mock_get_res(self, res_id):
        return mock_reservation
    monkeypatch.setattr(ConferenceRepository, "get_reservation_by_id", mock_get_res)

    payload = {
        "customer_id": 11,
        "hall_id": 3,
        "event_name": "Global Tech Summit 2026",
        "event_start_date": "2026-11-15",
        "event_end_date": "2026-11-16",
        "start_time": "08:30:00",
        "end_time": "18:00:00",
        "num_participants": 100,
        "hall_standard_price": 1200000.00,
        "subtotal": 4850000.00,
        "total_amount": 4850000.00,
        "amount_paid": 4850000.00,
        "balance_due": 0.00,
        "payment_responsibility": "Organisation",
        "facilities": [
            {"facility_id": 1, "quantity": 1, "unit_price": 150000.00, "total_price": 150000.00},
            {"facility_id": 2, "quantity": 100, "unit_price": 35000.00, "total_price": 3500000.00}
        ]
    }

    response = client.post("/api/v1/conference/reservations", json=payload)
    assert response.status_code == 200

    data = response.json()
    assert data["conference_res_id"] == 2
    assert float(data["hall_standard_price"]) == 1200000.00
    assert float(data["total_amount"]) == 4850000.00
    assert len(data["facility_bookings"]) == 2
    assert data["facility_bookings"][0]["facility"]["name"] == "Projector & 4K Screen"
    assert float(data["facility_bookings"][1]["total_price"]) == 3500000.00

    app.dependency_overrides.clear()

