"""TricsoftPay gateway client for Business-account sandbox and live operations."""

from __future__ import annotations

import logging
from typing import Any, Dict, Optional

import httpx
import pycountry

from app.core.tricsoftpay import (
    SEYEYA_PAY_BASE_URL,
    SEYEYA_PAY_PUBLIC_KEY,
    SEYEYA_PAY_SECRET_KEY,
    SUPPORTED_PROVIDERS,
    get_seyeya_pay_auth_header,
)

logger = logging.getLogger(__name__)


class SeyeyaPayGateway:
    """Reusable TricsoftPay HTTP client using Business ApiKey authentication."""

    def __init__(
        self,
        base_url: Optional[str] = None,
        public_key: Optional[str] = None,
        secret_key: Optional[str] = None,
        api_key_id: Optional[str] = None,
        api_secret: Optional[str] = None,
    ) -> None:
        resolved_base_url = (base_url or SEYEYA_PAY_BASE_URL).rstrip("/")
        if not resolved_base_url.endswith("/api"):
            resolved_base_url = f"{resolved_base_url}/api"

        self.base_url = resolved_base_url
        self.public_key = public_key or api_key_id or SEYEYA_PAY_PUBLIC_KEY
        self.secret_key = secret_key or api_secret or SEYEYA_PAY_SECRET_KEY
        if not self.public_key or not self.secret_key:
            raise ValueError("TricsoftPay authentication requires TRICSOFTPAY_API_KEY_ID and TRICSOFTPAY_API_SECRET")

        initial_auth = get_seyeya_pay_auth_header(
            self.public_key,
            self.secret_key,
        )

        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            timeout=httpx.Timeout(60.0),
            follow_redirects=True,
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": initial_auth,
            },
        )

    def get_auth_header(self) -> str:
        return get_seyeya_pay_auth_header(
            self.public_key,
            self.secret_key,
        )

    @staticmethod
    def _extract_payment_id(payload: Any) -> Any:
        if isinstance(payload, dict):
            for key in ("payment_id", "id", "transaction_id", "transactionId"):
                value = payload.get(key)
                if value not in (None, "", " "):
                    return value
            for nested_key in ("data", "result", "payment", "transaction"):
                value = payload.get(nested_key)
                if isinstance(value, dict):
                    nested_id = SeyeyaPayGateway._extract_payment_id(value)
                    if nested_id not in (None, "", " "):
                        return nested_id
        return None

    @staticmethod
    def _extract_action_url(payload: Any) -> Optional[str]:
        if not isinstance(payload, dict):
            return None
        for key in ("action_url", "actionUrl", "checkout_url", "payment_url", "url"):
            value = payload.get(key)
            if isinstance(value, str) and value:
                return value
        for nested_key in ("data", "result", "payment", "transaction"):
            value = payload.get(nested_key)
            if isinstance(value, dict):
                found = SeyeyaPayGateway._extract_action_url(value)
                if found:
                    return found
        return None

    @staticmethod
    def _extract_provider_status(payload: Any) -> Any:
        if isinstance(payload, dict):
            for key in ("status", "state"):
                value = payload.get(key)
                if value not in (None, "", " "):
                    return value
            for nested_key in ("data", "result", "payment", "transaction"):
                value = payload.get(nested_key)
                if isinstance(value, dict):
                    nested_status = SeyeyaPayGateway._extract_provider_status(value)
                    if nested_status is not None:
                        return nested_status
        return None

    @staticmethod
    def _normalize_provider_status(status_value: Any) -> str:
        if status_value is None:
            return "pending"
        value = str(status_value).strip().lower()
        if value in {"success", "succeeded", "successful", "paid", "approved", "completed", "done"}:
            return "success"
        if value in {"pending", "processing", "queued", "initiated", "in_progress", "in-progress", "created", "waiting", "scheduled"}:
            return "pending"
        if value in {"failed", "failure", "error", "rejected", "cancelled", "declined", "expired", "timeout"}:
            return "failed"
        if value.startswith("3") or value in {"200", "201", "202"}:
            return "pending"
        return "pending"

    @staticmethod
    def _safe_provider_error(response_status: int, error_payload: Any) -> str:
        message = ""
        if isinstance(error_payload, dict):
            message = str(error_payload.get("detail") or error_payload.get("message") or error_payload.get("error") or "")
        elif error_payload is not None:
            message = str(error_payload)

        lowered = message.lower()
        if isinstance(error_payload, dict):
            error_details = error_payload.get("error")
            if isinstance(error_details, dict):
                error_code = str(error_details.get("code") or "").upper()
                if error_code == "PERMISSION_DENIED":
                    if error_details.get("kyc_error"):
                        return "Disbursement permission is not granted on your payment account. Complete the required KYC verification and enable disbursement access."
                    return "Disbursement permission is not granted on your payment account."

        if response_status == 401 or "invalid api key" in lowered or "authentication" in lowered or "unauthorized" in lowered:
            return "Payment provider authentication failed."
        if response_status == 403 or "whitelist" in lowered or "ip address" in lowered or "forbidden" in lowered:
            return "Payment provider request is blocked by the configured IP whitelist."
        if response_status == 404:
            return "Payment provider endpoint not found."
        if response_status == 500:
            request_id = ""
            if isinstance(error_payload, dict):
                request_id = str(error_payload.get("request_id") or "").strip()
            if request_id:
                return f"Payment provider transaction service returned an internal error. Provider request ID: {request_id}"
            return "Payment provider transaction service returned an internal error."
        if response_status == 422:
            return "Payment provider rejected the payload."
        return "Payment provider request failed."

    @classmethod
    def _normalize_response_payload(cls, payload: Dict[str, Any], *, http_status: Optional[int] = None) -> Dict[str, Any]:
        normalized = dict(payload)
        provider_status = cls._extract_provider_status(payload)
        normalized["provider_status"] = provider_status
        normalized["http_status"] = http_status
        normalized["payment_id"] = cls._extract_payment_id(payload)
        normalized["action_url"] = cls._extract_action_url(payload)
        normalized["status"] = cls._normalize_provider_status(provider_status)
        return normalized

    async def _request(self, method: str, path: str, *, json_body: Optional[Dict[str, Any]] = None, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        kwargs: Dict[str, Any] = {
            "headers": {
                "Authorization": self.get_auth_header(),
                "Accept": "application/json",
                "Content-Type": "application/json",
            }
        }
        if json_body is not None:
            kwargs["json"] = json_body
        if params is not None:
            kwargs["params"] = params

        logger.info(
            "TricsoftPay outbound request: method=%s url=%s auth_mode=ApiKey",
            method,
            f"{self.base_url}{path}",
        )

        try:
            response = await self.client.request(method, path, **kwargs)
        except httpx.TimeoutException as exc:
            logger.error("TricsoftPay outbound timeout: method=%s url=%s timeout=60s", method, f"{self.base_url}{path}")
            raise TimeoutError("TricsoftPay request timed out") from exc
        except httpx.NetworkError as exc:
            logger.error("TricsoftPay network failure: method=%s url=%s error=%s", method, f"{self.base_url}{path}", str(exc))
            raise ConnectionError("TricsoftPay network request failed") from exc

        raw_body = response.text if hasattr(response, "text") else ""
        try:
            data = response.json()
        except ValueError:
            data = None

        logger.info(
            "TricsoftPay outbound response: method=%s url=%s http_status=%s body=%s",
            method,
            f"{self.base_url}{path}",
            response.status_code,
            raw_body[:2000],
        )

        if response.status_code >= 400:
            logger.warning(
                "TricsoftPay API request failed: method=%s path=%s http_status=%s",
                method,
                path,
                response.status_code,
            )
            raise ValueError(self._safe_provider_error(response.status_code, data))

        if isinstance(data, dict):
            return self._normalize_response_payload(data, http_status=response.status_code)
        return {"status": "pending", "provider_status": None, "http_status": response.status_code, "payment_id": None, "action_url": None}

    async def create_collection(
        self,
        provider_code: str,
        amount: int,
        external_id: Optional[str] = None,
        customer_phone: Optional[str] = None,
        customer_email: Optional[str] = None,
        customer_first_name: Optional[str] = None,
        customer_second_name: Optional[str] = None,
        customer_city: Optional[str] = None,
        customer_country: Optional[str] = None,
        customer_state: Optional[str] = None,
        currency: Optional[str] = None,
        description: Optional[str] = None,
    ) -> Dict[str, Any]:
        if provider_code not in SUPPORTED_PROVIDERS:
            raise ValueError(f"Unsupported provider_code '{provider_code}'")

        normalized_amount = int(amount)
        if normalized_amount <= 0:
            raise ValueError("amount must be greater than zero")

        payload: Dict[str, Any] = {"provider_code": provider_code, "amount": normalized_amount}

        if provider_code in {"mtn_ug", "airtel_ug"}:
            if not customer_phone:
                raise ValueError("customer_phone is required for mobile money collections")
            normalized_phone = customer_phone.strip().replace(" ", "")
            if not normalized_phone.isdigit() or not normalized_phone.startswith("256"):
                raise ValueError("customer_phone must contain digits and start with country code 256")
            payload["customer_phone"] = normalized_phone
        elif provider_code == "card_collections":
            if not external_id or not external_id.strip():
                raise ValueError("external_id is required for card collections")
            payload["external_id"] = external_id.strip()
            normalized_amount *= 100
            payload["amount"] = normalized_amount

            try:
                normalized_country = self._normalize_country_code(customer_country)
            except LookupError as exc:
                raise ValueError("customer_country must be a valid ISO 3166 country name or two-character country code") from exc
            if not normalized_country:
                raise ValueError("customer_country is required for card collections")

            required = {
                "customer_email": customer_email,
                "customer_phone": customer_phone,
                "customer_first_name": customer_first_name,
                "customer_second_name": customer_second_name,
                "customer_city": customer_city,
                "customer_country": normalized_country,
                "customer_state": customer_state,
                "currency": currency,
            }
            missing = [name for name, value in required.items() if not value]
            if missing:
                raise ValueError(f"Missing required card collection fields: {', '.join(missing)}")
            payload.update(required)
            if description:
                payload["description"] = description

        return await self._request("POST", "/payments/collect/", json_body=payload)

    async def calculate_fee(self, provider_code: str, amount: int, transaction_type: str = "collection") -> Dict[str, Any]:
        if provider_code not in {"mtn_ug", "airtel_ug"}:
            raise ValueError("Fee calculation supports mtn_ug or airtel_ug")
        if transaction_type not in {"collection", "disbursement"}:
            raise ValueError("transaction_type must be collection or disbursement")
        params = {"transaction_type": transaction_type, "provider_code": provider_code, "amount": int(amount)}
        return await self._request("GET", "/payments/calculate-fees", params=params)

    async def create_disbursement(self, provider_code: str, amount: int, external_id: str, customer_phone: Optional[str] = None, recipient_name: Optional[str] = None, recipient_phone: Optional[str] = None, description: Optional[str] = None) -> Dict[str, Any]:
        if provider_code not in {"mtn_ug", "airtel_ug"}:
            raise ValueError("Disbursements support mtn_ug or airtel_ug")
        phone_number = customer_phone or recipient_phone
        if not phone_number:
            raise ValueError("customer_phone is required for disbursements")
        phone_number = phone_number.strip().replace(" ", "")
        if not phone_number.isdigit() or not phone_number.startswith("256"):
            raise ValueError("customer_phone must contain digits and start with country code 256")
        payload = {"provider_code": provider_code, "amount": int(amount), "customer_phone": phone_number, "external_id": external_id}
        if recipient_name:
            payload["recipient_name"] = recipient_name
        if description:
            payload["description"] = description
        return await self._request("POST", "/payments/disburse/", json_body=payload)

    async def list_transactions(self, page: int = 1, page_size: int = 25, status: Optional[str] = None, external_id: Optional[str] = None, limit: Optional[int] = None, offset: Optional[int] = None) -> Dict[str, Any]:
        if limit is not None:
            page_size = limit
        if offset is not None and page_size:
            page = (offset // page_size) + 1
        params = {"page": page, "page_size": page_size}
        if status:
            params["status"] = status
        if external_id:
            params["external_id"] = external_id
        return await self._request("GET", "/payments/", params=params)

    async def get_payment(self, payment_id: int | str) -> Dict[str, Any]:
        return await self._request("GET", f"/payments/{payment_id}")

    async def check_transaction_status(self, payment_id: int | str) -> Dict[str, Any]:
        if payment_id in (None, "", " "):
            raise ValueError("payment_id is required")
        return await self._request("POST", "/payments/status/", json_body={"payment_id": str(payment_id)})

    async def refund_payment(self, payment_id: int | str, amount: Optional[int] = None, reason: Optional[str] = None, external_id: Optional[str] = None) -> Dict[str, Any]:
        normalized_payment_id = str(payment_id).strip()
        if not normalized_payment_id:
            raise ValueError("payment_id is required")

        payload = {"payment_id": normalized_payment_id}
        if amount is not None:
            normalized_amount = int(amount)
            if normalized_amount <= 0:
                raise ValueError("amount must be greater than zero")
            payload["amount"] = str(normalized_amount)
        if reason:
            payload["reason"] = reason
        if external_id:
            payload["external_id"] = external_id
        return await self._request("POST", "/payments/refund/", json_body=payload)

    async def create_payment_link(self, amount: int, currency: str, description: str, external_id: str, customer_email: Optional[str] = None, redirect_url: Optional[str] = None) -> Dict[str, Any]:
        payload = {"amount": int(amount), "currency": currency, "description": description, "external_id": external_id}
        if customer_email:
            payload["customer_email"] = customer_email
        if redirect_url:
            payload["redirect_url"] = redirect_url
        return await self._request("POST", "/payment-links", json_body=payload)

    async def create_ussd_code(self, provider_code: str, amount: int, external_id: str, customer_phone: Optional[str] = None, description: Optional[str] = None) -> Dict[str, Any]:
        """Initiate supported mobile-money collection as a USSD-compatible flow."""
        if provider_code not in {"mtn_ug", "airtel_ug"}:
            raise ValueError("USSD-compatible collection supports mtn_ug or airtel_ug")
        return await self.create_collection(
            provider_code=provider_code,
            amount=amount,
            external_id=external_id,
            customer_phone=customer_phone,
            description=description,
        )

    @staticmethod
    def _normalize_country_code(country: Optional[str]) -> str:
        """Convert an ISO code or country name to an uppercase ISO 3166-1 alpha-2 code."""
        if not country:
            return ""

        value = str(country).strip()
        if len(value) == 2:
            code = pycountry.countries.get(alpha_2=value.upper())
            if code:
                return code.alpha_2.upper()

        name = pycountry.countries.lookup(value)
        return name.alpha_2.upper()

    async def close(self) -> None:
        await self.client.aclose()
