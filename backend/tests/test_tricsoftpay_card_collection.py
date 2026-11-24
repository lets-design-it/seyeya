import uuid

import pytest

from app.services.tricsoftpay import SeyeyaPayGateway


@pytest.mark.asyncio
async def test_card_collection_builds_provider_payload(monkeypatch):
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
            "provider_status": "created",
            "payment_id": "test-payment-id",
            "action_url": "https://sandbox.example.invalid/checkout/test-payment-id",
        }

    monkeypatch.setattr(gateway, "_request", capture_request)

    transaction_id = f"card-test-{uuid.uuid4()}"
    email = f"{uuid.uuid4().hex}@example.invalid"

    response = await gateway.create_collection(
        provider_code="card_collections",
        amount=499,
        external_id=transaction_id,
        customer_email=email,
        customer_phone="256700000001",
        customer_first_name="Test",
        customer_second_name="Customer",
        customer_city="Test City",
        customer_country="UG",
        customer_state="Test Region",
        currency="USD",
        description="Test card collection",
    )

    assert captured["method"] == "POST"
    assert captured["path"] == "/payments/collect/"
    assert captured["params"] is None

    payload = captured["json_body"]
    assert payload == {
        "provider_code": "card_collections",
        "amount": 49900,
        "external_id": transaction_id,
        "customer_email": email,
        "customer_phone": "256700000001",
        "customer_first_name": "Test",
        "customer_second_name": "Customer",
        "customer_city": "Test City",
        "customer_country": "UG",
        "customer_state": "Test Region",
        "currency": "USD",
        "description": "Test card collection",
    }
    assert response["payment_id"] == "test-payment-id"

    await gateway.client.aclose()
