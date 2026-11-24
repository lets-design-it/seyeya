import pytest

from app.services.tricsoftpay import SeyeyaPayGateway


@pytest.mark.asyncio
async def test_refund_accepts_payment_uuid(monkeypatch):
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
            "payment_id": "refund-payment-id",
        }

    monkeypatch.setattr(gateway, "_request", capture_request)

    response = await gateway.refund_payment(
        payment_id="ff23b84f-2643-40e1-b3f7-0de509886534",
        amount=499,
        reason="Customer refund",
        external_id="refund-test-001",
    )

    assert captured == {
        "method": "POST",
        "path": "/payments/refund/",
        "json_body": {
            "payment_id": "ff23b84f-2643-40e1-b3f7-0de509886534",
            "amount": "499",
            "reason": "Customer refund",
            "external_id": "refund-test-001",
        },
        "params": None,
    }
    assert response["payment_id"] == "refund-payment-id"

    await gateway.client.aclose()
