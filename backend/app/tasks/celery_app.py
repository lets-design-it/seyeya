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


@celery_app.task
def process_payment_verification(payment_id: int):
    """Process payment verification"""
    print(f"Processing payment {payment_id}")
    return {"status": "success", "payment_id": payment_id}
