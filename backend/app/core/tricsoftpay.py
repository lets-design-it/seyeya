"""Security-first TricsoftPay configuration and shared credential helpers."""

from __future__ import annotations

import base64
import hashlib
import hmac
import os
from typing import Any, Dict, Optional

from dotenv import load_dotenv


load_dotenv(os.path.join(os.path.dirname(__file__), "..", "..", ".env"), override=False)

TRICSOFTPAY_ACCOUNT_TYPE = (
    os.getenv("TRICSOFTPAY_ACCOUNT_TYPE")
    or os.getenv("SEYEYA_PAY_ACCOUNT_TYPE", "business")
    or "business"
).lower()
TRICSOFTPAY_ENVIRONMENT = (
    os.getenv("TRICSOFTPAY_ENVIRONMENT")
    or os.getenv("SEYEYA_PAY_ENVIRONMENT", "live")
).lower()

SEYEYA_PAY_ACCOUNT_TYPE = TRICSOFTPAY_ACCOUNT_TYPE
SEYEYA_PAY_ENVIRONMENT = TRICSOFTPAY_ENVIRONMENT

sandbox_default = "https://sandbox.tricsoftpay.com/api"
live_default = "https://api.tricsoftpay.com/api"
SEYEYA_PAY_BASE_URL = (
    os.getenv("TRICSOFTPAY_BASE_URL")
    or os.getenv("SEYEYA_PAY_BASE_URL")
    or live_default
).rstrip("/")

SEYEYA_PAY_API_KEY_ID = (
    os.getenv("TRICSOFTPAY_API_KEY_ID")
    or os.getenv("SEYEYA_PAY_API_KEY_ID")
    or os.getenv("SEYEYA_PAY_PUBLIC_KEY")
)
SEYEYA_PAY_API_SECRET = (
    os.getenv("TRICSOFTPAY_API_SECRET")
    or os.getenv("SEYEYA_PAY_API_SECRET")
    or os.getenv("SEYEYA_PAY_SECRET_KEY")
)
SEYEYA_PAY_WEBHOOK_KEY = (
    os.getenv("TRICSOFTPAY_WEBHOOK_SECRET")
    or os.getenv("SEYEYA_PAY_WEBHOOK_KEY")
)

# Compatibility exports used by existing modules.
SEYEYA_PAY_PUBLIC_KEY = SEYEYA_PAY_API_KEY_ID
SEYEYA_PAY_SECRET_KEY = SEYEYA_PAY_API_SECRET

SUPPORTED_PROVIDERS = [
    "mtn_ug",
    "airtel_ug",
    "card_collections",
]


def _mask_secret(value: Optional[str]) -> str:
    return "***********" if not value or not value.strip() else "***********"


def get_seyeya_pay_config() -> Dict[str, Any]:
    """Return gateway configuration without exposing secrets or API credentials."""
    base_url = SEYEYA_PAY_BASE_URL.rstrip("/")
    if not base_url.endswith("/api"):
        base_url = f"{base_url}/api"

    return {
        "enabled": bool(SEYEYA_PAY_API_KEY_ID and SEYEYA_PAY_API_SECRET),
        "account_type": TRICSOFTPAY_ACCOUNT_TYPE,
        "environment": TRICSOFTPAY_ENVIRONMENT,
        "base_url": base_url,
        "api_key_id": SEYEYA_PAY_API_KEY_ID,
        "api_secret": _mask_secret(SEYEYA_PAY_API_SECRET),
        "public_key": SEYEYA_PAY_PUBLIC_KEY,
        "secret_key": _mask_secret(SEYEYA_PAY_SECRET_KEY),
        "webhook_key": _mask_secret(SEYEYA_PAY_WEBHOOK_KEY),
        "supported_providers": SUPPORTED_PROVIDERS,
    }


def get_seyeya_pay_auth_header(
    api_key_id: Optional[str] = None,
    api_secret: Optional[str] = None,
) -> str:
    """Build the Business-account ApiKey Authorization header."""
    key_id = api_key_id or SEYEYA_PAY_API_KEY_ID
    secret = api_secret or SEYEYA_PAY_API_SECRET
    if not key_id or not secret:
        raise ValueError(
            "Business account authentication requires TRICSOFTPAY_API_KEY_ID and TRICSOFTPAY_API_SECRET"
        )
    if TRICSOFTPAY_ACCOUNT_TYPE != "business":
        raise ValueError("Only TricsoftPay Business accounts are supported")
    return f"ApiKey {key_id}:{secret}"


def verify_seyeya_pay_webhook_signature(raw_body: bytes, signature: Optional[str]) -> bool:
    """Verify the documented raw-body HMAC-SHA256 signature.

    Provider signature encoding/prefix is awaiting final confirmation. The
    implementation accepts only lowercase/uppercase hexadecimal HMAC values,
    with the commonly documented sha256/v1 prefixes, rather than guessing an
    incompatible encoding.
    """
    if not signature or not SEYEYA_PAY_WEBHOOK_KEY:
        return False

    normalized = signature.strip()
    lowered = normalized.lower()
    for prefix in ("sha256=", "sha256:", "v1=", "v1:", "v0=", "v0:"):
        if lowered.startswith(prefix):
            normalized = normalized[len(prefix):].strip()
            break

    expected = hmac.new(
        SEYEYA_PAY_WEBHOOK_KEY.encode("utf-8"),
        raw_body,
        hashlib.sha256,
    ).digest()

    try:
        if len(normalized) == 64:
            received = bytes.fromhex(normalized)
        else:
            received = base64.b64decode(normalized, validate=True)
    except (ValueError, base64.binascii.Error):
        return False

    if len(received) != hashlib.sha256().digest_size:
        return False
    return hmac.compare_digest(expected, received)
