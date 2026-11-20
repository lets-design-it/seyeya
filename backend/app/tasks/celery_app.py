"""
Celery configuration and tasks
"""
from celery import Celery
from app.core.config import settings
from datetime import datetime

# Initialize Celery
celery_app = Celery(
    "seyeya",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

# Configure Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
)


# Task definitions
@celery_app.task(bind=True, max_retries=3)
def send_order_confirmation_email(self, order_id: int):
    """Send order confirmation email"""
    try:
        # Email logic here
        print(f"Sending confirmation email for order {order_id}")
        return {"status": "success", "order_id": order_id}
    except Exception as exc:
        # Retry if failed
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True, max_retries=3)
def send_customer_welcome_email(self, user_id: int, email: str, reset_token: str, temp_password: Optional[str] = None):
    """Send welcome email with password reset link"""
    try:
        reset_link = f"https://your-app.example.com/reset-password?token={reset_token}"
        print(f"Sending customer welcome email to {email}")
        print(f"Reset link: {reset_link}")
        if temp_password:
            print(f"Temporary password: {temp_password}")
        return {"status": "success", "user_id": user_id, "email": email}
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True, max_retries=3)
def send_reservation_reminder(self, reservation_id: int):
    """Send reservation reminder SMS/Email"""
    try:
        print(f"Sending reminder for reservation {reservation_id}")
        return {"status": "success", "reservation_id": reservation_id}
    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)


@celery_app.task
def generate_daily_report():
    """Generate daily business report"""
    print(f"Generating daily report for {datetime.utcnow().date()}")
    return {"status": "success", "report_date": datetime.utcnow().date()}


@celery_app.task
def cleanup_old_sessions():
    """Clean up expired sessions"""
    print("Cleaning up expired sessions")
    return {"status": "success", "cleaned_at": datetime.utcnow()}


@celery_app.task(bind=True, max_retries=5)
def process_payment_verification(self, payment_id: int):
    """Reconcile one local payment transaction against TricsoftPay."""
    import asyncio
    from sqlalchemy import select

    from app.db.database import AsyncSessionLocal
    from app.models import PaymentTransaction
    from app.services.tricsoftpay import SeyeyaPayGateway

    async def reconcile():
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(PaymentTransaction).where(PaymentTransaction.id == payment_id))
            transaction = result.scalar_one_or_none()
            if transaction is None:
                return {"status": "missing", "payment_id": payment_id}
            if transaction.status in {"success", "failed"}:
                return {"status": transaction.status, "payment_id": payment_id}
            if not transaction.provider_payment_id:
                return {"status": "pending", "payment_id": payment_id, "provider_payment_id": None}

            gateway = SeyeyaPayGateway()
            try:
                response = await gateway.check_transaction_status(transaction.provider_payment_id)
            except (TimeoutError, ConnectionError):
                raise
            finally:
                await gateway.close()

            provider_status = str(response.get("status", "pending"))
            transaction.status = provider_status if provider_status in {"pending", "success", "failed"} else "pending"
            transaction.provider_response = response
            if transaction.status == "success":
                transaction.confirmed_at = datetime.utcnow()
            elif transaction.status == "failed":
                transaction.failure_reason = str(response.get("failure_reason") or response.get("provider_status") or "Payment failed")
            await db.commit()
            return {"status": transaction.status, "payment_id": payment_id}

    try:
        return asyncio.run(reconcile())
    except (TimeoutError, ConnectionError) as exc:
        raise self.retry(exc=exc, countdown=60)


@celery_app.task
def reconcile_pending_payment_transactions():
    """Enqueue reconciliation for pending TricsoftPay transactions."""
    import asyncio
    from sqlalchemy import select

    from app.db.database import AsyncSessionLocal
    from app.models import PaymentTransaction

    async def find_pending():
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(PaymentTransaction.id).where(
                    PaymentTransaction.status == "pending",
                    PaymentTransaction.provider_payment_id.isnot(None),
                ).limit(100)
            )
            return list(result.scalars().all())

    ids = asyncio.run(find_pending())
    for transaction_id in ids:
        process_payment_verification.delay(transaction_id)
    return {"queued": len(ids)}


@celery_app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    """Schedule periodic tasks"""
    sender.add_periodic_task(
        10.0,  # every 10 seconds
        process_payment_verification.s(),
        name='Reconcile pending transactions',
    )

celery_app.conf.beat_schedule = {
    "reconcile-pending-tricsoftpay-transactions": {
        "task": "app.tasks.celery_app.reconcile_pending_payment_transactions",
        "schedule": 60.0,
    }
}
