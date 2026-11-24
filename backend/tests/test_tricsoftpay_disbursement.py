import uuid

import pytest

from app.services.tricsoftpay import SeyeyaPayGateway


@pytest.mark.asyncio
async def test_disbursement_builds_provider_payload(monkeypatch):
    gateway = SeyeyaPayGateway(
        base_url="https://sandbox.example.invalid",
        public_key="test-api-key-id",
        secret_key="test-api-secret",
    )

    captured = {}

    async def capture_request(method, path, *, json_body=None, params=None):
        captured.update(method=method, path=path, json_body=json_body, params=params)
        return {
            "status": "pending",
            "provider_status": "initiated",
            "payment_id": "test-disbursement-id",
        }

    monkeypatch.setattr(gateway, "_request", capture_request)

    external_id = f"disbursement-test-{uuid.uuid4()}"
    response = await gateway.create_disbursement(
        provider_code="mtn_ug",
        amount=25000,
        external_id=external_id,
        recipient_name="Test Recipient",
        recipient_phone="256700000001",
        description="Test disbursement",
    )

    assert captured == {
        "method": "POST",
        "path": "/payments/disburse/",
        "json_body": {
            "provider_code": "mtn_ug",
            "amount": 25000,
            "customer_phone": "256700000001",
            "external_id": external_id,
            "recipient_name": "Test Recipient",
            "description": "Test disbursement",
        },
        "params": None,
    }
    assert response["payment_id"] == "test-disbursement-id"

    await gateway.client.aclose()


def test_permission_denied_disbursement_error():
    error = {
        "success": False,
        "error": {
            "code": "PERMISSION_DENIED",
            "message": "Disburse permission not granted on your account.",
            "kyc_error": True,
        },
    }

    message = SeyeyaPayGateway._safe_provider_error(403, error)

    assert "KYC verification" in message
    assert "disbursement access" in message


def test_transaction_service_internal_error_includes_request_id():
    error = {
        "error": True,
        "status_code": 500,
        "message": "Internal server error",
        "request_id": "a7cfd642-f70b-46f8-a3ed-f61d2facdb63",
    }

    message = SeyeyaPayGateway._safe_provider_error(500, error)

    assert "a7cfd642-f70b-46f8-a3ed-f61d2facdb63" in message
