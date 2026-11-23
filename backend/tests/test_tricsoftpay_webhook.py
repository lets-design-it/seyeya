import base64
import hashlib
import hmac

import app.core.tricsoftpay as tricsoftpay_config


def test_webhook_signature_accepts_hexadecimal(monkeypatch):
    monkeypatch.setattr(tricsoftpay_config, "SEYEYA_PAY_WEBHOOK_KEY", "test-webhook-secret")
    raw_body = b'{"data":{"external_id":"webhook-001","status":"success"}}'
    signature = hmac.new(b"test-webhook-secret", raw_body, hashlib.sha256).hexdigest()

    assert tricsoftpay_config.verify_seyeya_pay_webhook_signature(raw_body, signature)
    assert tricsoftpay_config.verify_seyeya_pay_webhook_signature(raw_body, "sha256=" + signature)


def test_webhook_signature_accepts_base64(monkeypatch):
    monkeypatch.setattr(tricsoftpay_config, "SEYEYA_PAY_WEBHOOK_KEY", "test-webhook-secret")
    raw_body = b'{"data":{"external_id":"webhook-001","status":"failed"}}'
    digest = hmac.new(b"test-webhook-secret", raw_body, hashlib.sha256).digest()
    signature = base64.b64encode(digest).decode("ascii")

    assert tricsoftpay_config.verify_seyeya_pay_webhook_signature(raw_body, "v1=" + signature)


def test_webhook_signature_rejects_wrong_body(monkeypatch):
    monkeypatch.setattr(tricsoftpay_config, "SEYEYA_PAY_WEBHOOK_KEY", "test-webhook-secret")
    signature = hmac.new(b"test-webhook-secret", b"original", hashlib.sha256).hexdigest()

    assert not tricsoftpay_config.verify_seyeya_pay_webhook_signature(b"tampered", signature)
