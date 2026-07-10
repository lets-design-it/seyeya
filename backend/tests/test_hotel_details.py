"""
Unit and integration tests for Hotel Details Management module
"""
import pytest
import io
import os
from datetime import datetime
from unittest.mock import MagicMock, AsyncMock, patch
from fastapi import UploadFile, HTTPException, status
from pydantic import ValidationError

from app.schemas import HotelDetailsCreate, HotelDetailsUpdate
from app.utils.upload import validate_and_save_upload
from app.services.hotel_details import HotelDetailsService
from app.models import HotelDetails

# =====================================================================
# 1. SCHEMA VALIDATION TESTS
# =====================================================================

def test_hotel_details_schema_valid():
    # Valid input data
    data = {
        "hotel_name": "Seyeya Courts",
        "phone_number": "+256701234567",
        "email": "info@seyeyacourts.com",
        "physical_address": "Plot 12, Kampala Road",
        "city": "Kampala",
        "country": "Uganda",
        "latitude": 0.3476,
        "longitude": 32.5825,
        "website": "https://seyeyacourts.com",
        "facebook_url": "https://facebook.com/seyeya",
        "currency": "UGX",
        "timezone": "Africa/Kampala"
    }
    schema = HotelDetailsCreate(**data)
    assert schema.hotel_name == "Seyeya Courts"
    assert schema.latitude == 0.3476
    assert schema.longitude == 32.5825
    assert schema.currency == "UGX"


def test_hotel_details_schema_invalid_coordinates():
    data = {
        "hotel_name": "Seyeya Courts",
        "phone_number": "+256701234567",
        "email": "info@seyeyacourts.com",
        "physical_address": "Plot 12",
        "city": "Kampala",
        "country": "Uganda",
        "latitude": 95.0,  # Invalid (> 90)
        "longitude": 190.0, # Invalid (> 180)
    }
    with pytest.raises(ValidationError):
        HotelDetailsCreate(**data)


def test_hotel_details_schema_invalid_urls():
    data = {
        "hotel_name": "Seyeya Courts",
        "phone_number": "+256701234567",
        "email": "info@seyeyacourts.com",
        "physical_address": "Plot 12",
        "city": "Kampala",
        "country": "Uganda",
        "website": "not-a-valid-url"
    }
    with pytest.raises(ValidationError):
        HotelDetailsCreate(**data)


def test_hotel_details_schema_invalid_phone():
    data = {
        "hotel_name": "Seyeya Courts",
        "phone_number": "123",  # Too short
        "email": "info@seyeyacourts.com",
        "physical_address": "Plot 12",
        "city": "Kampala",
        "country": "Uganda",
    }
    with pytest.raises(ValidationError):
        HotelDetailsCreate(**data)


# =====================================================================
# 2. FILE UPLOAD & VALIDATION UTILITY TESTS
# =====================================================================

def test_validate_and_save_upload_invalid_type():
    mock_file = MagicMock(spec=UploadFile)
    mock_file.filename = "document.pdf"
    mock_file.content_type = "application/pdf"
    
    with pytest.raises(HTTPException) as exc_info:
        validate_and_save_upload(mock_file)
    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
    assert "not allowed" in exc_info.value.detail


def test_validate_and_save_upload_size_limit():
    mock_file = MagicMock(spec=UploadFile)
    mock_file.filename = "large_image.jpg"
    mock_file.content_type = "image/jpeg"
    
    # Mock file stream with large size
    mock_file.file = io.BytesIO(b"x" * (6 * 1024 * 1024))  # 6MB
    
    with pytest.raises(HTTPException) as exc_info:
        validate_and_save_upload(mock_file)
    assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
    assert "exceeds the limit" in exc_info.value.detail


# =====================================================================
# 3. SERVICE LAYER BUSINESS RULES TESTS
# =====================================================================

@pytest.mark.asyncio
async def test_service_create_hotel_details():
    mock_db = MagicMock()
    service = HotelDetailsService(mock_db)
    
    # Mock repository
    service.repository.create = AsyncMock()
    service.repository.deactivate_all_except = AsyncMock()
    
    async def mock_create(profile):
        profile.id = 1
        return profile
    service.repository.create.side_effect = mock_create
    
    create_schema = HotelDetailsCreate(
        hotel_name="Test Hotel",
        phone_number="+256701234567",
        email="info@test.com",
        physical_address="Street 1",
        city="Kampala",
        country="Uganda",
        is_active=True
    )
    
    profile = await service.create_profile(
        user_id=10,
        schema=create_schema,
        logo_url="/uploads/logo.png",
        cover_image_url="/uploads/cover.jpg"
    )
    
    assert profile.id == 1
    assert profile.hotel_name == "Test Hotel"
    assert profile.is_active is True
    assert profile.logo_url == "/uploads/logo.png"
    assert profile.created_by == 10
    
    # Verify that other profiles were deactivated
    service.repository.deactivate_all_except.assert_called_once_with(1)


@pytest.mark.asyncio
async def test_service_update_hotel_details():
    mock_db = MagicMock()
    service = HotelDetailsService(mock_db)
    
    # Mock existing details
    existing_profile = HotelDetails(
        id=2,
        hotel_name="Old Hotel Name",
        phone_number="+256701234567",
        email="info@test.com",
        physical_address="Street 1",
        city="Kampala",
        country="Uganda",
        is_active=False
    )
    
    service.repository.get_by_id = AsyncMock(return_value=existing_profile)
    service.repository.update = AsyncMock(return_value=existing_profile)
    service.repository.deactivate_all_except = AsyncMock()
    
    update_schema = HotelDetailsUpdate(
        hotel_name="New Hotel Name",
        is_active=True  # Activating this profile should trigger deactivation of others
    )
    
    profile = await service.update_profile(
        user_id=20,
        id=2,
        schema=update_schema
    )
    
    assert profile.hotel_name == "New Hotel Name"
    assert profile.is_active is True
    assert profile.updated_by == 20
    
    # Verify that other profiles were deactivated
    service.repository.deactivate_all_except.assert_called_once_with(2)


# =====================================================================
# 4. API LAYER ROUTER TESTS
# =====================================================================
from fastapi.testclient import TestClient
from app.main import app
from app.db.database import get_db
from app.core.security import get_current_user, get_current_admin_user

client = TestClient(app)


def test_api_get_active_profile(monkeypatch):
    # Mock database dependency
    app.dependency_overrides[get_db] = lambda: MagicMock()
    
    # Mock service get_active_profile with a real model instance to pass serialization
    mock_profile = HotelDetails(
        id=5,
        hotel_name="Seyeya Courts Active",
        phone_number="+256701234567",
        email="active@seyeyacourts.com",
        physical_address="Kampala",
        city="Kampala",
        country="Uganda",
        currency="USD",
        timezone="UTC",
        is_active=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    async def mock_get_active(self):
        return mock_profile
        
    monkeypatch.setattr(HotelDetailsService, "get_active_profile", mock_get_active)
    
    response = client.get("/api/v1/hotel-details")
    assert response.status_code == 200
    
    data = response.json()
    assert data["success"] is True
    assert data["data"]["hotel_name"] == "Seyeya Courts Active"
    assert data["data"]["is_active"] is True
    
    app.dependency_overrides.clear()


def test_api_create_profile_unauthorized():
    # Attempting to POST without auth credentials
    response = client.post("/api/v1/hotel-details", data={"hotel_name": "Guest Test"})
    assert response.status_code == 403  # HTTPBearer returns 403 Forbidden by default when missing credentials


def test_api_create_profile_success(monkeypatch):
    # Mock current admin dependency
    app.dependency_overrides[get_current_user] = lambda: {"user_id": 99}
    app.dependency_overrides[get_current_admin_user] = lambda: {"user_id": 99}
    app.dependency_overrides[get_db] = lambda: MagicMock()
    
    mock_profile = HotelDetails(
        id=10,
        hotel_name="Form Hotel",
        phone_number="+256701234567",
        email="form@hotel.com",
        physical_address="Kampala",
        city="Kampala",
        country="Uganda",
        currency="USD",
        timezone="UTC",
        is_active=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    
    async def mock_create_profile(self, user_id, schema, logo_url=None, cover_image_url=None):
        return mock_profile
        
    monkeypatch.setattr(HotelDetailsService, "create_profile", mock_create_profile)
    
    form_data = {
        "hotel_name": "Form Hotel",
        "phone_number": "+256701234567",
        "email": "form@hotel.com",
        "physical_address": "Kampala",
        "city": "Kampala",
        "country": "Uganda",
        "currency": "USD",
        "timezone": "UTC",
        "is_active": "true"
    }
    
    response = client.post("/api/v1/hotel-details", data=form_data)
    assert response.status_code == 201
    
    data = response.json()
    assert data["success"] is True
    assert data["data"]["id"] == 10
    assert data["data"]["hotel_name"] == "Form Hotel"
    
    app.dependency_overrides.clear()
