"""Gateway-facing Seyeya Pay endpoints."""

import json
from decimal import Decimal
from typing import Any, Dict, Optional

from fastapi import APIRouter, Body, Depends, Header, HTTPException, Request, status
from pydantic import BaseModel, Field, model_validator
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.core.tricsoftpay import (
    SEYEYA_PAY_API_KEY_ID,
    SEYEYA_PAY_API_SECRET,
    get_seyeya_pay_config,
    verify_seyeya_pay_webhook_signature,
)
from app.db.database import get_db
from app.models import Payment, PaymentTransaction, PaymentWebhookEvent
from app.services.tricsoftpay import SeyeyaPayGateway

import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/payment-gateways", tags=["payment-gateways"])


class GatewayCollectRequest(BaseModel):
    provider_code: str = Field(..., description="Provider identifier: mtn_ug, airtel_ug or card_collections")
    amount: int = Field(..., gt=0, description="Amount to collect in the smallest currency unit")
    external_id: Optional[str] = Field(default=None, min_length=1, description="Optional unique external reference for the transaction")
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    customer_first_name: Optional[str] = None
    customer_second_name: Optional[str] = None
    customer_city: Optional[str] = None
    customer_country: Optional[str] = None
    customer_state: Optional[str] = None
    currency: Optional[str] = None
    description: Optional[str] = None
    customer_id: Optional[int] = None
    payment_id: Optional[int] = None

    @model_validator(mode="after")
    def normalize_placeholder_values(self):
        for field_name in (
            "external_id",
            "customer_phone",
            "customer_email",
            "customer_first_name",
            "customer_second_name",
            "customer_city",
            "customer_country",
            "customer_state",
            "currency",
            "description",
        ):
            value = getattr(self, field_name, None)
            if value is not None:
                normalized = str(value).strip()
                setattr(self, field_name, None if not normalized or normalized.lower() == "string" else normalized)
        return self


class GatewayDisbursementRequest(BaseModel):
    provider_code: str = Field(..., description="Recipient provider code, for example mtn_ug or airtel_ug")
    amount: int = Field(..., gt=0)
    customer_phone: Optional[str] = Field(default=None, description="Recipient phone number in digits, e.g. 256700000000")
    external_id: str = Field(..., min_length=1)
    description: Optional[str] = None
    recipient_name: Optional[str] = Field(default=None, min_length=1)
    recipient_phone: Optional[str] = Field(default=None, min_length=1)

    @staticmethod
    def _normalize_phone(value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        normalized = value.strip().replace(" ", "")
        if not normalized:
            return None
        if not normalized.isdigit():
            raise ValueError("Phone number must contain digits only")
        if not normalized.startswith("256"):
            raise ValueError("Phone number must start with country code 256")
        return normalized

    @model_validator(mode="after")
    def validate_disbursement_payload(self):
        allowed_providers = {"mtn_ug", "airtel_ug"}
        if self.provider_code not in allowed_providers:
            raise ValueError("Disbursements currently support mtn_ug or airtel_ug")

        if not self.customer_phone and not self.recipient_phone:
            raise ValueError("Either customer_phone or recipient_phone is required")

        self.customer_phone = self._normalize_phone(self.customer_phone or self.recipient_phone)
        if self.recipient_phone:
            self.recipient_phone = self._normalize_phone(self.recipient_phone)
        return self


class GatewayFeeRequest(BaseModel):
    provider_code: str = Field(...)
    amount: int = Field(..., gt=0)
    transaction_type: str = Field(default="collection")


class GatewayRefundRequest(BaseModel):
    payment_id: int = Field(..., gt=0)
    amount: int = Field(..., gt=0)
    reason: Optional[str] = None
    external_id: Optional[str] = None


class GatewayStatusRequest(BaseModel):
    payment_id: str = Field(..., min_length=1, description="TricsoftPay payment identifier returned by a collection or disbursement request")


class GatewayPaymentLinkRequest(BaseModel):
    amount: int = Field(..., gt=0)
    currency: str = Field(..., min_length=3, max_length=5)
    description: str = Field(..., min_length=1)
    external_id: str = Field(..., min_length=1)
    customer_email: Optional[str] = None
    redirect_url: Optional[str] = None


class GatewayUssdRequest(BaseModel):
    provider_code: str = Field(...)
    amount: int = Field(..., gt=0)
    external_id: str = Field(..., min_length=1)
    customer_phone: Optional[str] = None
    description: Optional[str] = None


def get_tricsoftpay_credentials(
    authorization: Optional[str] = Header(default=None, alias="Authorization"),
) -> tuple[str, str]:
    """Use TRICSOFTPAY_API_KEY_ID and TRICSOFTPAY_API_SECRET, or an ApiKey header override."""
    if authorization:
        normalized_authorization = authorization.strip()
        if normalized_authorization.lower() in {"", "string", "bearer", "apikey"}:
            normalized_authorization = ""

        if normalized_authorization:
            scheme, _, credentials = normalized_authorization.partition(" ")
            if scheme.lower() == "bearer":
                normalized_authorization = ""

        if normalized_authorization:
            scheme, _, credentials = normalized_authorization.partition(" ")
            if scheme.lower() != "apikey" or ":" not in credentials:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authorization must use ApiKey key_id:api_secret")

            api_key_id, api_secret = credentials.split(":", 1)
            api_key_id = api_key_id.strip()
            api_secret = api_secret.strip()
            if not api_key_id or not api_secret:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid TricsoftPay ApiKey credentials")
            return api_key_id, api_secret

    if not SEYEYA_PAY_API_KEY_ID or not SEYEYA_PAY_API_SECRET:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="TricsoftPay credentials are not configured")
    return SEYEYA_PAY_API_KEY_ID, SEYEYA_PAY_API_SECRET


def create_gateway_client(credentials: tuple[str, str]) -> SeyeyaPayGateway:
    api_key_id, api_secret = credentials
    return SeyeyaPayGateway(api_key_id=api_key_id, api_secret=api_secret)


@router.get("/config")
async def get_gateway_config(credentials: tuple[str, str] = Depends(get_tricsoftpay_credentials)) -> Dict[str, Any]:
    """Return the active gateway configuration without exposing secrets."""
    del credentials
    return get_seyeya_pay_config()


@router.get("/methods")
async def list_payment_methods(credentials: tuple[str, str] = Depends(get_tricsoftpay_credentials)) -> Dict[str, Any]:
    """List the supported provider codes for gateway collections."""
    del credentials
    config = get_seyeya_pay_config()
    return {
        "environment": config["environment"],
        "base_url": config["base_url"],
        "providers": config["supported_providers"],
    }


@router.post("/collect")
async def collect_with_gateway(
    payload: GatewayCollectRequest = Body(...),
    credentials: tuple[str, str] = Depends(get_tricsoftpay_credentials),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Create a collection using direct TricsoftPay ApiKey credentials."""

    original_amount = payload.amount
    persisted_amount = Decimal(str(payload.amount))
    external_id = payload.external_id
    transaction = PaymentTransaction(
        external_id=external_id or "",
        provider="tricsoftpay",
        provider_payment_id=None,
        user_id=None,
        customer_id=payload.customer_id,
        payment_id=payload.payment_id,
        payment_method="card" if payload.provider_code == "card_collections" else "mobile_money",
        amount=persisted_amount,
        currency=(payload.currency or "UGX"),
        status="pending",
        provider_response={},
    )
    # db.add(transaction)
    # await db.commit()
    # await db.refresh(transaction)

    try:
        gateway = create_gateway_client(credentials)
        provider_response = await gateway.create_collection(
            provider_code=payload.provider_code,
            amount=original_amount,
            external_id=external_id,
            customer_phone=payload.customer_phone,
            customer_email=payload.customer_email,
            customer_first_name=payload.customer_first_name,
            customer_second_name=payload.customer_second_name,
            customer_city=payload.customer_city,
            customer_country=payload.customer_country,
            customer_state=payload.customer_state,
            currency=payload.currency,
            description=payload.description,
        )
        transaction.provider_response = provider_response
        transaction.provider_payment_id = str(provider_response.get("payment_id")) if provider_response.get("payment_id") not in (None, "") else None
        provider_status = str(provider_response.get("status", "pending"))
        transaction.status = provider_status if provider_status in {"pending", "success", "failed"} else "pending"
        # await db.commit()
        # await db.refresh(transaction)
        return provider_response
    except TimeoutError as exc:
        transaction.status = "failed"
        transaction.failure_reason = str(exc)
        await db.commit()
        raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail=str(exc)) from exc
    except ConnectionError as exc:
        transaction.status = "failed"
        transaction.failure_reason = str(exc)
        await db.commit()
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc
    except ValueError as exc:
        transaction.status = "failed"
        transaction.failure_reason = str(exc)
        await db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        transaction.status = "failed"
        transaction.failure_reason = "Unexpected gateway initiation failure"
        await db.commit()
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Seyeya Pay gateway error") from exc


@router.get("/transactions")
async def list_gateway_transactions(
    page: int = 1,
    page_size: int = 25,
    limit: Optional[int] = None,
    offset: int = 0,
    transaction_status: Optional[str] = None,
    external_id: Optional[str] = None,
    credentials: tuple[str, str] = Depends(get_tricsoftpay_credentials),
) -> Dict[str, Any]:
    """List recent transactions using the provider payment listing API."""
    try:
        gateway = create_gateway_client(credentials)
        if limit is not None:
            page_size = limit
        if offset and page_size:
            page = (offset // page_size) + 1
        return await gateway.list_transactions(page=page, page_size=page_size, status=transaction_status, external_id=external_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/transactions/{payment_id}")
async def get_gateway_transaction(
    payment_id: str,
    credentials: tuple[str, str] = Depends(get_tricsoftpay_credentials),
) -> Dict[str, Any]:
    """Retrieve a payment using the provider payment details API."""
    if not payment_id or payment_id.strip() == "":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="payment_id is required")
    try:
        gateway = create_gateway_client(credentials)
        return await gateway.get_payment(payment_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/status")
@router.post("/transactions/status")
async def get_gateway_transaction_status(
    payload: GatewayStatusRequest = Body(...),
    credentials: tuple[str, str] = Depends(get_tricsoftpay_credentials),
) -> Dict[str, Any]:
    """Check the latest provider status for a TricsoftPay payment_id."""
    try:
        gateway = create_gateway_client(credentials)
        return await gateway.check_transaction_status(payload.payment_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/disburse")
@router.post("/disbursements")
async def create_gateway_disbursement(
    payload: GatewayDisbursementRequest = Body(...),
    credentials: tuple[str, str] = Depends(get_tricsoftpay_credentials),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    """Send funds to a recipient using the Seyeya Pay disbursement API."""

    existing = await db.execute(
        select(PaymentTransaction).where(PaymentTransaction.external_id == payload.external_id)
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A disbursement with this external_id already exists")

    transaction = PaymentTransaction(
        external_id=payload.external_id,
        provider=payload.provider_code,
        user_id=None,
        payment_method="mobile_money",
        amount=Decimal(str(payload.amount)),
        currency="UGX",
        status="pending",
        provider_response={},
    )
    db.add(transaction)
    await db.commit()
    await db.refresh(transaction)

    try:
        gateway = create_gateway_client(credentials)
        provider_response = await gateway.create_disbursement(
            provider_code=payload.provider_code,
            amount=payload.amount,
            external_id=payload.external_id,
            customer_phone=payload.customer_phone,
            recipient_name=payload.recipient_name,
            recipient_phone=payload.recipient_phone,
            description=payload.description,
        )
        payment_id = gateway._extract_payment_id(provider_response) if isinstance(provider_response, dict) else None
        transaction.provider_response = provider_response
        normalized_status = str(provider_response.get("status", "pending")) if isinstance(provider_response, dict) else "pending"
        transaction.status = normalized_status
        transaction.provider_payment_id = str(payment_id) if payment_id else None
        await db.commit()
        await db.refresh(transaction)
        return provider_response
    except ValueError as exc:
        transaction.status = "failed"
        transaction.failure_reason = str(exc)
        await db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/fees/calculate")
async def calculate_gateway_fee(
    payload: GatewayFeeRequest = Body(...),
    credentials: tuple[str, str] = Depends(get_tricsoftpay_credentials),
) -> Dict[str, Any]:
    """Calculate collection or disbursement fees before submission."""
    try:
        gateway = create_gateway_client(credentials)
        return await gateway.calculate_fee(
            provider_code=payload.provider_code,
            amount=payload.amount,
            transaction_type=payload.transaction_type,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/refunds")
async def refund_gateway_payment(
    payload: GatewayRefundRequest = Body(...),
    credentials: tuple[str, str] = Depends(get_tricsoftpay_credentials),
) -> Dict[str, Any]:
    """Return an eligible payment using the Seyeya Pay refund API."""
    try:
        gateway = create_gateway_client(credentials)
        return await gateway.refund_payment(
            payment_id=payload.payment_id,
            amount=payload.amount,
            reason=payload.reason,
            external_id=payload.external_id,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/payment-links")
async def create_gateway_payment_link(
    payload: GatewayPaymentLinkRequest = Body(...),
    credentials: tuple[str, str] = Depends(get_tricsoftpay_credentials),
) -> Dict[str, Any]:
    """Create a hosted payment link for a customer."""
    try:
        gateway = create_gateway_client(credentials)
        return await gateway.create_payment_link(
            amount=payload.amount,
            currency=payload.currency,
            description=payload.description,
            external_id=payload.external_id,
            customer_email=payload.customer_email,
            redirect_url=payload.redirect_url,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/ussd")
async def create_gateway_ussd(
    payload: GatewayUssdRequest = Body(...),
    credentials: tuple[str, str] = Depends(get_tricsoftpay_credentials),
) -> Dict[str, Any]:
    """Create a USSD payment flow for feature-phone customers."""
    try:
        gateway = create_gateway_client(credentials)
        return await gateway.create_ussd_code(
            provider_code=payload.provider_code,
            amount=payload.amount,
            external_id=payload.external_id,
            customer_phone=payload.customer_phone,
            description=payload.description,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("/webhooks/verify")
async def verify_gateway_webhook(request: Request) -> Dict[str, Any]:
    """Validate a Seyeya Pay webhook using the raw request body and HMAC signature."""
    raw_body = await request.body()
    signature = request.headers.get("x-webhook-signature")

    if not signature:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing webhook signature")

    if not verify_seyeya_pay_webhook_signature(raw_body, signature):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid webhook signature")

    payload = json.loads(raw_body.decode("utf-8") or "{}")
    data = payload.get("data", {})
    external_id = data.get("external_id")
    status_value = data.get("status")

    if not external_id or status_value not in {"success", "failed"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payload")

    return {"received": True, "verified": True, "external_id": external_id, "status": status_value}


@router.post("/webhooks")
async def handle_gateway_webhook(request: Request, db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """Accept a verified TricsoftPay webhook and apply terminal status once."""
    raw_body = await request.body()
    signature = request.headers.get("x-webhook-signature")
    if not signature:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing webhook signature")
    if not verify_seyeya_pay_webhook_signature(raw_body, signature):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid webhook signature")

    try:
        payload = json.loads(raw_body.decode("utf-8") or "{}")
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON webhook payload") from exc

    data = payload.get("data", {})
    external_id = data.get("external_id")
    status_value = data.get("status")
    if not external_id or status_value not in {"success", "failed"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payload")

    event_reference = f"{external_id}:{status_value}"
    event_result = await db.execute(
        select(PaymentWebhookEvent).where(
            PaymentWebhookEvent.provider == "tricsoftpay",
            PaymentWebhookEvent.event_reference == event_reference,
        )
    )
    existing_event = event_result.scalar_one_or_none()
    if existing_event is not None:
        return {"received": True, "verified": True, "external_id": external_id, "status": status_value, "duplicate": True}

    transaction_result = await db.execute(
        select(PaymentTransaction).where(PaymentTransaction.external_id == external_id)
    )
    transaction = transaction_result.scalar_one_or_none()
    if transaction is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unknown external_id")

    event_type = str(data.get("transaction_type") or data.get("event_type") or "collection")
    event = PaymentWebhookEvent(
        provider="tricsoftpay",
        event_reference=event_reference,
        event_type=event_type,
        payload=payload,
        signature_verified=True,
        processing_status="processing",
    )
    db.add(event)

    transaction.status = status_value
    transaction.provider_response = payload
    if status_value == "success":
        transaction.confirmed_at = __import__("datetime").datetime.utcnow()
        transaction.failure_reason = None
    else:
        transaction.failure_reason = str(data.get("failure_reason") or data.get("message") or "Payment failed")

    if status_value == "success" and transaction.payment_id:
        payment_result = await db.execute(select(Payment).where(Payment.payment_id == transaction.payment_id))
        payment = payment_result.scalar_one_or_none()
        if payment is not None and payment.payment_status != "Paid":
            payment.payment_status = "Paid"
            payment.verified_at = __import__("datetime").datetime.utcnow()
            payment.gateway_response = json.dumps(payload)
            db.add(payment)

            if payment.reference_type == "RestaurantOrder":
                from app.models import RestaurantOrder
                result = await db.execute(select(RestaurantOrder).where(RestaurantOrder.order_id == payment.reference_id))
                business_record = result.scalar_one_or_none()
                if business_record:
                    business_record.amount_paid += payment.amount_paid
                    business_record.balance_due = business_record.total_amount - business_record.amount_paid
                    business_record.payment_status = "Paid" if business_record.balance_due <= 0 else "PartiallyPaid"
                    db.add(business_record)
            elif payment.reference_type == "AccommodationReservation":
                from app.models import AccommodationReservation
                result = await db.execute(select(AccommodationReservation).where(AccommodationReservation.reservation_id == payment.reference_id))
                business_record = result.scalar_one_or_none()
                if business_record:
                    business_record.amount_paid += payment.amount_paid
                    business_record.balance_due = business_record.total_amount - business_record.amount_paid
                    business_record.payment_status = "Paid" if business_record.balance_due <= 0 else "PartiallyPaid"
                    db.add(business_record)
            elif payment.reference_type == "ConferenceReservation":
                from app.models import ConferenceReservation
                result = await db.execute(select(ConferenceReservation).where(ConferenceReservation.conference_res_id == payment.reference_id))
                business_record = result.scalar_one_or_none()
                if business_record:
                    business_record.amount_paid += payment.amount_paid
                    business_record.balance_due = business_record.total_amount - business_record.amount_paid
                    business_record.payment_status = "Paid" if business_record.balance_due <= 0 else "PartiallyPaid"
                    db.add(business_record)

    event.processing_status = "processed"
    event.processed_at = __import__("datetime").datetime.utcnow()
    await db.commit()
    await db.refresh(transaction)
    return {"received": True, "verified": True, "external_id": external_id, "status": status_value}
