"""
Unit and integration tests for secure payments module
"""
import pytest
import json
from unittest.mock import MagicMock, AsyncMock
from app.utils.validation import luhn_checksum, detect_card_brand, validate_card_details, validate_mobile_money, validate_paypal_email
from app.utils.masking import mask_card_number, mask_phone_number, mask_email
from app.utils.encryption import encrypt_data, decrypt_data
from app.services.payment_method import PaymentMethodService, compute_identifier_hash
from app.schemas import PaymentMethodCreate, PaymentMethodUpdate


# =====================================================================
# 1. TEST SECURITY & HELPER UTILITIES
# =====================================================================

def test_luhn_checksum():
    # Valid Visa card (Luhn compliant)
    assert luhn_checksum("49927398716") is True
    # Invalid card number
    assert luhn_checksum("49927398717") is False


def test_detect_card_brand():
    assert detect_card_brand("4111111111111") == "Visa"
    assert detect_card_brand("5105105105105105") == "Mastercard"
    assert detect_card_brand("2221000000000000") == "Mastercard"
    assert detect_card_brand("378282246310005") == ""  # Amex not supported


def test_validate_card_details():
    # Valid card details
    is_valid, err = validate_card_details("4111111111111111", 12, 2030)
    assert is_valid is True
    assert err == ""

    # Expired card details
    is_valid, err = validate_card_details("4111111111111111", 1, 2020)
    assert is_valid is False
    assert "expired" in err.lower()

    # Invalid brand
    is_valid, err = validate_card_details("378282246310005", 12, 2030)
    assert is_valid is False
    assert "brand" in err.lower()


def test_validate_mobile_money():
    # MTN MoMo valid
    is_valid, err, normalized = validate_mobile_money("+256701234567", "MTN MoMo")
    assert is_valid is True
    assert normalized == "+256701234567"

    # Airtel Money valid
    is_valid, err, normalized = validate_mobile_money("+254701234567", "Airtel Money")
    assert is_valid is True
    assert normalized == "+254701234567"

    # Auto-format format (no +)
    is_valid, err, normalized = validate_mobile_money("256701234567", "MTN MoMo")
    assert is_valid is True
    assert normalized == "+256701234567"

    # Local format with default country code
    is_valid, err, normalized = validate_mobile_money("0778978272", "MTN MoMo")
    assert is_valid is True
    assert normalized == "+256778978272"

    # Local format with specific country code
    is_valid, err, normalized = validate_mobile_money("0778978272", "MTN MoMo", "+254")
    assert is_valid is True
    assert normalized == "+254778978272"

    # Auto-format for Kenya prefix (no +)
    is_valid, err, normalized = validate_mobile_money("254712345678", "Airtel Money")
    assert is_valid is True
    assert normalized == "+254712345678"

    # Auto-format for Nigeria prefix (no +)
    is_valid, err, normalized = validate_mobile_money("2348012345678", "MTN MoMo")
    assert is_valid is True
    assert normalized == "+2348012345678"

    # Unsupported provider
    is_valid, err, normalized = validate_mobile_money("+256701234567", "Orange Money")
    assert is_valid is False
    assert "provider" in err.lower()


def test_validate_paypal_email():
    is_valid, err = validate_paypal_email("john.doe@gmail.com")
    assert is_valid is True

    is_valid, err = validate_paypal_email("invalid-email")
    assert is_valid is False
    assert "format" in err.lower()


def test_masking_helpers():
    # Card number
    assert mask_card_number("1234567812345678") == "**** **** **** 5678"
    assert mask_card_number("4111 1111 1111 1111") == "**** **** **** 1111"

    # Mobile money phone
    assert mask_phone_number("+256701234567") == "+256******567"
    assert mask_phone_number("+254701234567") == "+254******567"

    # Email
    assert mask_email("john.doe@gmail.com") == "j*****@gmail.com"
    assert mask_email("a@gmail.com") == "a*****@gmail.com"


def test_fuzzy_normalization_in_schema():
    # Test digital wallet / pay pal mapping
    data = {
        "payment_type": "pay pal",
        "provider": "string",
        "email": "ahikiriza@gmail.com"
    }
    schema = PaymentMethodCreate(**data)
    assert schema.payment_type == "digital_wallet"
    assert schema.provider == "PayPal"

    # Test Momo mapping
    data2 = {
        "payment_type": "Momo",
        "provider": "MTN MoMo",
        "account_name": "Henry",
        "phone_number": "0778978272"
    }
    schema2 = PaymentMethodCreate(**data2)
    assert schema2.payment_type == "mobile_money"
    assert schema2.provider == "MTN MoMo"
    assert schema2.phone_number == "+256778978272"


def test_update_schema_placeholder_conversion():
    data = {
        "nickname": "string",
        "phone_number": "string",
        "email": "",
        "expiry_month": 0,
        "expiry_year": 0
    }
    schema = PaymentMethodUpdate(**data)
    assert schema.nickname is None
    assert schema.phone_number is None
    assert schema.email is None
    assert schema.expiry_month is None
    assert schema.expiry_year is None


def test_encryption_roundtrip():
    secret_text = "HighlySensitiveData123"
    cipher = encrypt_data(secret_text)
    assert cipher != secret_text
    
    decrypted = decrypt_data(cipher)
    assert decrypted == secret_text


def test_compute_identifier_hash():
    val1 = "4111 1111 1111 1111"
    val2 = "4111111111111111"
    # Whitespace cleanup and lowercase standardization
    assert compute_identifier_hash(val1) == compute_identifier_hash(val2)


# =====================================================================
# 2. SERVICE LAYER INTEGRATION TESTS
# =====================================================================

@pytest.mark.asyncio
async def test_service_create_card():
    # Mock database session
    mock_db = MagicMock()
    service = PaymentMethodService(mock_db)
    
    # Mock repository methods
    service.repository.get_by_hash = AsyncMock(return_value=None)
    service.repository.get_all_by_user = AsyncMock(return_value=[])
    service.repository.create = AsyncMock()
    service.repository.unset_other_defaults = AsyncMock()
    
    # Mock repository create return value
    async def mock_create(pm):
        pm.id = 42
        return pm
    service.repository.create.side_effect = mock_create

    # Input schema
    create_schema = PaymentMethodCreate(
        payment_type="card",
        provider="Visa",
        cardholder_name="Jane Doe",
        card_number="4111111111111111",
        expiry_month=12,
        expiry_year=2030,
        billing_address="123 Main St",
        nickname="My Visa",
        cvv="123"
    )

    result = await service.create(user_id=1, schema=create_schema)

    assert result.id == 42
    assert result.payment_type == "card"
    assert result.provider == "Visa"
    assert result.is_default is True
    assert result.details["masked_card_number"] == "**** **** **** 1111"
    assert result.details["expiry_month"] == 12
    
    # Check encryption roundtrip on stored details
    decrypted = decrypt_data(result.encrypted_details)
    sensitive = json.loads(decrypted)
    assert sensitive["card_number"] == "4111111111111111"
    assert sensitive["cardholder_name"] == "Jane Doe"
    assert sensitive["cvv"] == "123"


@pytest.mark.asyncio
async def test_service_create_mobile_money():
    mock_db = MagicMock()
    service = PaymentMethodService(mock_db)
    
    service.repository.get_by_hash = AsyncMock(return_value=None)
    service.repository.get_all_by_user = AsyncMock(return_value=[MagicMock()])  # Already has methods, not default
    service.repository.create = AsyncMock()
    
    async def mock_create(pm):
        pm.id = 43
        return pm
    service.repository.create.side_effect = mock_create

    create_schema = PaymentMethodCreate(
        payment_type="mobile_money",
        provider="MTN MoMo",
        account_name="John Doe",
        phone_number="+256701234567",
        country_code="UG",
        nickname="MoMo"
    )

    result = await service.create(user_id=1, schema=create_schema)

    assert result.id == 43
    assert result.is_default is False
    assert result.details["phone_number"] == "+256******567"
    
    decrypted = decrypt_data(result.encrypted_details)
    sensitive = json.loads(decrypted)
    assert sensitive["phone_number"] == "+256701234567"


@pytest.mark.asyncio
async def test_service_update_card():
    mock_db = MagicMock()
    service = PaymentMethodService(mock_db)
    
    # Mock existing payment method
    existing_pm = MagicMock()
    existing_pm.user_id = 1
    existing_pm.payment_type = "card"
    existing_pm.details = {"expiry_month": 12, "expiry_year": 2030}
    existing_pm.encrypted_details = encrypt_data(json.dumps({"card_number": "4111111111111111", "cvv": "123"}))
    
    service.repository.get_by_id = AsyncMock(return_value=existing_pm)
    service.repository.update = AsyncMock(return_value=existing_pm)
    service.repository.unset_other_defaults = AsyncMock()
    
    update_schema = PaymentMethodUpdate(
        nickname="Updated Visa",
        expiry_month=11,
        expiry_year=2031,
        cvv="456"
    )
    
    result = await service.update(user_id=1, payment_method_id=100, schema=update_schema)
    
    assert result.nickname == "Updated Visa"
    assert result.details["expiry_month"] == 11
    assert result.details["expiry_year"] == 2031
    
    # Verify encrypted details were updated
    decrypted = decrypt_data(result.encrypted_details)
    sensitive = json.loads(decrypted)
    assert sensitive["expiry_month"] == 11
    assert sensitive["expiry_year"] == 2031
    assert sensitive["card_number"] == "4111111111111111"
    assert sensitive["cvv"] == "456"


# =====================================================================
# 3. API ROUTER LAYER TESTS
# =====================================================================
from fastapi.testclient import TestClient
from app.main import app
from app.db.database import get_db
from app.core.security import get_current_user

client = TestClient(app)


def test_api_create_payment_method(monkeypatch):
    # Mock current user and db dependencies
    app.dependency_overrides[get_current_user] = lambda: {"user_id": 1}
    
    mock_db = MagicMock()
    app.dependency_overrides[get_db] = lambda: mock_db
    
    # Mock the service creation method
    mock_pm = MagicMock()
    mock_pm.id = 100
    mock_pm.user_id = 1
    mock_pm.payment_type = "card"
    mock_pm.provider = "Visa"
    mock_pm.nickname = "My card"
    mock_pm.is_default = True
    mock_pm.is_verified = True
    mock_pm.status = "active"
    mock_pm.details = {
        "display_name": "Visa ending in 1111",
        "masked_card_number": "**** **** **** 1111",
        "expiry_month": 12,
        "expiry_year": 2030,
        "billing_address": "123 Main St"
    }
    mock_pm.encrypted_details = "encrypted-placeholder"
    
    async def mock_service_create(self, user_id, schema):
        return mock_pm
        
    monkeypatch.setattr(PaymentMethodService, "create", mock_service_create)
    
    payload = {
        "payment_type": "card",
        "provider": "Visa",
        "cardholder_name": "Jane Doe",
        "card_number": "4111111111111111",
        "expiry_month": 12,
        "expiry_year": 2030,
        "billing_address": "123 Main St",
        "nickname": "My card"
    }
    
    response = client.post("/api/v1/payment-methods", json=payload)
    
    assert response.status_code == 201
    data = response.json()
    assert data["id"] == 100
    assert data["payment_type"] == "card"
    assert data["provider"] == "Visa"
    assert data["masked_card_number"] == "**** **** **** 1111"
    assert data["is_default"] is True
    
    # Clean up overrides
    app.dependency_overrides.clear()


def test_api_list_payment_methods(monkeypatch):
    app.dependency_overrides[get_current_user] = lambda: {"user_id": 1}
    mock_db = MagicMock()
    app.dependency_overrides[get_db] = lambda: mock_db
    
    mock_pm = MagicMock()
    mock_pm.id = 101
    mock_pm.user_id = 1
    mock_pm.payment_type = "mobile_money"
    mock_pm.provider = "MTN MoMo"
    mock_pm.nickname = "My MoMo"
    mock_pm.is_default = False
    mock_pm.is_verified = True
    mock_pm.status = "active"
    mock_pm.details = {
        "account_name": "John Doe",
        "phone_number": "+256******567",
        "country_code": "UG"
    }
    mock_pm.encrypted_details = "encrypted-placeholder"
    
    async def mock_service_list(self, user_id):
        return [mock_pm]
        
    monkeypatch.setattr(PaymentMethodService, "get_all_by_user", mock_service_list)
    
    response = client.get("/api/v1/payment-methods")
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == 101
    assert data[0]["payment_type"] == "mobile_money"
    assert data[0]["phone_number"] == "+256******567"
    
    app.dependency_overrides.clear()


@pytest.mark.asyncio
async def test_service_update_mobile_money(monkeypatch):
    from app.services.payment_method import PaymentMethodService
    from app.schemas import PaymentMethodUpdate
    from app.models import PaymentMethod
    from app.utils.encryption import encrypt_data, decrypt_data
    from unittest.mock import MagicMock
    import json
    
    mock_db = MagicMock()
    service = PaymentMethodService(mock_db)
    
    pm = PaymentMethod(
        id=5,
        user_id=1,
        payment_type="mobile_money",
        provider="MTN MoMo",
        nickname="Old Nickname",
        is_default=False,
        details={
            "account_name": "Old Account",
            "phone_number": "+256******272",
            "country_code": "+256"
        },
        encrypted_details=encrypt_data(json.dumps({
            "account_name": "Old Account",
            "phone_number": "+256778978272",
            "country_code": "+256"
        })),
        unique_hash="old-hash"
    )
    
    async def mock_get_by_id(pm_id):
        return pm
        
    async def mock_update(model):
        return model
        
    async def mock_get_by_hash(user_id, hash_val):
        return None
        
    service.repository.get_by_id = mock_get_by_id
    service.repository.update = mock_update
    service.repository.get_by_hash = mock_get_by_hash
    
    update_schema = PaymentMethodUpdate(
        nickname="New Nickname",
        account_name="New Account",
        phone_number="0771234567"
    )
    
    updated_pm = await service.update(user_id=1, payment_method_id=5, schema=update_schema)
    
    assert updated_pm.nickname == "New Nickname"
    assert updated_pm.details["account_name"] == "New Account"
    assert updated_pm.details["phone_number"] == "+256******567"
    
    decrypted = decrypt_data(updated_pm.encrypted_details)
    sensitive = json.loads(decrypted)
    assert sensitive["account_name"] == "New Account"
    assert sensitive["phone_number"] == "+256771234567"
    assert updated_pm.unique_hash != "old-hash"
