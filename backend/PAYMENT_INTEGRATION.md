# Seyeya Pay / TricsoftPay backend integration

## 1. Architecture overview

This backend already includes a reusable gateway client, a secure configuration module, and JWT-protected gateway routes. The app-side integration is intentionally separated from the business logic so that the provider client remains reusable across booking, checkout, and account workflows.

Core implementation files:
- `app/core/tricsoftpay.py` — centralized environment configuration and HMAC verification helpers.
- `app/services/tricsoftpay.py` — outbound API client for collection, disbursement, refund, fee, payment-link, and USSD workflows.
- `app/api/v1/payment_gateways.py` — JWT-authenticated gateway endpoints and public webhook validation routes.
- `app/api/v1/payment_methods.py` — payment-method gateway discovery and collection route.
- `app/main.py` — router registration for the payment gateway endpoints.

## 2. TricsoftPay configuration

The backend expects the provider configuration to be read from environment variables rather than hardcoded in the codebase. The shared configuration is kept in one place to avoid leaking secrets in request/response payloads or logs.

Required variables:
- `SEYEYA_PAY_ENVIRONMENT`
- `SEYEYA_PAY_BASE_URL`
- `SEYEYA_PAY_PUBLIC_KEY`
- `SEYEYA_PAY_SECRET_KEY`
- `SEYEYA_PAY_WEBHOOK_KEY`

The config helper masks the secret values before returning them to application callers.

## 3. Required environment variables

```env
SEYEYA_PAY_ENVIRONMENT=sandbox
SEYEYA_PAY_BASE_URL=https://sandbox.tricsoftpay.com/api
SEYEYA_PAY_PUBLIC_KEY=your_public_key_here
SEYEYA_PAY_SECRET_KEY=your_secret_key_here
SEYEYA_PAY_WEBHOOK_KEY=your_webhook_signature_key_here
```

## 4. Database models

The project already includes the existing `Payment` and `PaymentMethod` models. In addition, the payment pipeline now includes persistence models for gateway-level transaction tracking and webhook audit logs.

### `PaymentTransaction`

Fields:
- `id`
- `external_id`
- `provider`
- `provider_payment_id`
- `user_id`
- `customer_id`
- `payment_id`
- `payment_method`
- `amount`
- `currency`
- `status`
- `provider_response`
- `failure_reason`
- `created_at`
- `updated_at`
- `confirmed_at`

### `PaymentWebhookEvent`

Fields:
- `id`
- `provider`
- `event_reference`
- `event_type`
- `payload`
- `signature_verified`
- `processing_status`
- `received_at`
- `processed_at`

The models are defined in `app/models/__init__.py`.

## 5. Database migration instructions

The repository includes a migration file for the new transaction and webhook tracking tables.

Typical workflow:

```bash
cd /home/heinrich/Documents/seyeya/seyeya/backend
./venv/bin/alembic revision --autogenerate -m "add_seyeya_pay_transaction_tracking"
./venv/bin/alembic upgrade head
```

The generated migration should reflect the new `payment_transactions` and `payment_webhook_events` tables.

## 6. API endpoint documentation

### 1) GET /api/v1/payment-gateways/config
- Auth: JWT required
- Purpose: return the active gateway configuration without secrets

### 2) GET /api/v1/payment-gateways/methods
- Auth: JWT required
- Purpose: list supported provider codes

### 3) POST /api/v1/payment-gateways/collect
- Auth: JWT required
- Purpose: create a provider collection
- Example body:

```json
{
  "provider_code": "mtn_ug",
  "amount": 50000,
  "external_id": "txn_123",
  "customer_phone": "256700000000",
  "description": "Hotel reservation deposit"
}
```

### 4) GET /api/v1/payment-gateways/transactions
- Auth: JWT required
- Purpose: list recent provider transactions

### 5) GET /api/v1/payment-gateways/transactions/{payment_id}
- Auth: JWT required
- Purpose: retrieve a specific payment status

### 6) POST /api/v1/payment-gateways/disbursements
- Auth: JWT required
- Purpose: initiate a disbursement

### 7) POST /api/v1/payment-gateways/fees/calculate
- Auth: JWT required
- Purpose: calculate fees before submission

### 8) POST /api/v1/payment-gateways/refunds
- Auth: JWT required
- Purpose: create a refund request

### 9) POST /api/v1/payment-gateways/payment-links
- Auth: JWT required
- Purpose: create a hosted payment link

### 10) POST /api/v1/payment-gateways/ussd
- Auth: JWT required
- Purpose: create a USSD flow request

### 11) POST /api/v1/payment-gateways/webhooks/verify
- Public route
- Purpose: verify the raw request body against the configured HMAC signature

### 12) POST /api/v1/payment-gateways/webhooks
- Public route
- Purpose: accept a provider webhook after signature verification

## 7. Authentication requirements

All internal gateway routes are protected by the application JWT middleware. Webhook routes are intentionally public, but they must validate the raw body signature before accepting or processing the payload.

## 8. Payment initiation examples

### Mobile money example

```http
POST /api/v1/payment-gateways/collect
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

```json
{
  "provider_code": "mtn_ug",
  "amount": 50000,
  "external_id": "txn_123",
  "customer_phone": "256700000000",
  "description": "Hotel deposit"
}
```

### Card example

```json
{
  "provider_code": "tricsoftpay_card_ug",
  "amount": 50000,
  "external_id": "txn_456",
  "customer_phone": "256700000001",
  "customer_email": "guest@example.com",
  "customer_first_name": "Jane",
  "customer_second_name": "Doe",
  "customer_city": "Kampala",
  "customer_country": "UG",
  "customer_state": "Central",
  "currency": "UGX",
  "description": "Conference booking"
}
```

## 9. Webhook configuration

The backend verifies the webhook signature using a raw request-body HMAC against `SEYEYA_PAY_WEBHOOK_KEY`. In the app, the implementation checks the `x-webhook-signature` header and rejects invalid payloads.

Important note: the exact provider header naming and payload schema can vary by provider deployment. This implementation isolates the verification step so it is easy to adapt if the live provider adds a different signature format or event envelope.

## 10. Transaction verification process

The backend must never treat an initiated payment as successful without provider confirmation. The system relies on:
- provider response payloads
- status polling via the list/get transaction APIs
- verified webhook confirmations
- reconciliation against stored transaction records

## 11. Refund and disbursement instructions

The gateway service includes the following reusable methods:
- `create_disbursement()`
- `refund_payment()`
- `list_transactions()`
- `calculate_fee()`

These are exposed via the payment gateway API routes for authenticated backend operations.

## 12. Testing instructions

Sandbox tests for the integration are contained in:
- `tests/test_tricsoftpay_gateway.py`

Run:

```bash
cd /home/heinrich/Documents/seyeya/seyeya/backend
./venv/bin/python -m pytest -q tests/test_tricsoftpay_gateway.py
```

## 13. Sandbox setup

Use sandbox credentials and test-only IDs. The code intentionally defaults to the sandbox base URL and the configured sample keys, but production deployments must override them with real environment variables.

## 14. Production deployment instructions

1. Set all gateway environment variables in the deployment environment.
2. Ensure the webhook endpoint is reachable over HTTPS.
3. Store keys in a secret manager, not in source control.
4. Keep sandbox and production credentials separated.
5. Enable signature verification and reject unverified webhooks.
6. Log provider IDs and event references, not raw secrets.

## 15. Outstanding provider requirements

The documentation can still require provider confirmation for live details such as the exact live webhook header name, event envelope structure, and the final supported payment-link or USSD payload variations. The app-side integration has the required code isolation points to adapt to those final changes without redesigning the backend.

## Request/response reference table

| Payment operation | HTTP method | Provider endpoint | Request body documented | Response handled |
| --- | --- | --- | --- | --- |
| MTN collection | POST | `/payments/collect` | Yes | Yes |
| Airtel collection | POST | `/payments/collect` | Yes | Yes |
| Card collection | POST | `/payments/collect` | Yes | Yes |
| USSD | POST | `/ussd-code` | Yes | Yes |
| Payment links | POST | `/payment-links` | Yes | Yes |
| Transaction status | GET | `/transactions` and `/payments/{id}` | Yes | Yes |
| Fee calculation | POST | `/fees/calculate` | Yes | Yes |
| Refund | POST | `/refunds` | Yes | Yes |
| Disbursement | POST | `/disbursements` | Yes | Yes |
| Webhook processing | POST | `/webhooks` | Yes | Yes |

## 16. Verification summary

This integration is covered at the backend gateway abstraction layer and verified with automated tests. The implementation is not a frontend payment UI and intentionally remains backend-only.
