"""
Email utility functions for immediate and background sending
"""
import smtplib
import logging
import asyncio
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from app.core.config import settings
from app.utils.email_templates import (
    get_welcome_email,
    get_registration_welcome_email,
    get_account_created_email,
    get_password_reset_email,
    get_password_changed_email
)

logger = logging.getLogger(__name__)


def send_email_sync(
    to_email: str,
    subject: str,
    html_content: str,
    to_name: Optional[str] = None
) -> bool:
    """
    Synchronous SMTP email sender using standard library smtplib.
    Returns True if sent successfully, False otherwise.
    Never raises an exception to the caller so API endpoints remain uninterrupted.
    """
    if not to_email or "@" not in to_email:
        logger.warning(f"Invalid recipient email provided: {to_email}")
        return False

    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning(
            f"SMTP configuration is missing. Email simulated to: {to_email} | Subject: {subject}"
        )
        print(f"\n[EMAIL SIMULATION] To: {to_email}")
        print(f"Subject: {subject}\n")
        return False

    try:
        msg = MIMEMultipart()
        sender_email = settings.SMTP_USER or settings.SEND_FROM_EMAIL
        msg['From'] = f"SEYEYA Courts <{sender_email}>"
        msg['To'] = f"{to_name} <{to_email}>" if to_name else to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(html_content, 'html', 'utf-8'))

        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT, timeout=15)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(sender_email, [to_email], msg.as_string())
        server.close()

        logger.info(f"Email successfully sent to {to_email} with subject '{subject}'")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email} via SMTP: {str(e)}")
        print(f"\n[EMAIL SEND FAILURE FALLBACK] To: {to_email} | Subject: {subject} | Error: {str(e)}\n")
        return False


async def send_email_async(
    to_email: str,
    subject: str,
    html_content: str,
    to_name: Optional[str] = None
) -> bool:
    """
    Non-blocking async wrapper around send_email_sync using asyncio.to_thread.
    """
    try:
        return await asyncio.to_thread(send_email_sync, to_email, subject, html_content, to_name)
    except Exception as e:
        logger.error(f"Error in send_email_async for {to_email}: {str(e)}")
        return False


def send_immediate_welcome_email(
    email: str, 
    full_name: str, 
    temp_password: Optional[str] = None, 
    reset_token: Optional[str] = None,
    role_title: str = "User"
) -> bool:
    """
    Sends an account created email immediately to the user/customer.
    """
    frontend_base = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
    login_link = f"{frontend_base}/login"
    html = get_account_created_email(
        full_name=full_name,
        email=email,
        role_title=role_title,
        login_link=login_link
    )
    return send_email_sync(
        to_email=email,
        subject="Welcome to SEYEYA Courts - Account Created",
        html_content=html,
        to_name=full_name
    )


def send_account_registered_email(
    email: str,
    full_name: str,
    password: Optional[str] = None,
    role_title: Optional[str] = None
) -> bool:
    """
    Sends an account created email for newly registered accounts with login link.
    """
    frontend_base = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
    login_link = f"{frontend_base}/login"
    html = get_account_created_email(
        full_name=full_name,
        email=email,
        role_title=role_title or "Customer",
        login_link=login_link
    )
    return send_email_sync(
        to_email=email,
        subject="Welcome to SEYEYA Courts - Account Created",
        html_content=html,
        to_name=full_name
    )


def send_password_reset_email(
    email: str, 
    full_name: str, 
    reset_token: str
) -> bool:
    """
    Sends a password reset link to the user immediately.
    """
    frontend_base = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
    reset_link = f"{frontend_base}/reset-password?token={reset_token}"
    html = get_password_reset_email(
        full_name=full_name,
        reset_link=reset_link,
        reset_token=reset_token
    )
    return send_email_sync(
        to_email=email,
        subject="Reset Your SEYEYA Courts Password",
        html_content=html,
        to_name=full_name
    )


def send_password_changed_email(
    email: str,
    full_name: str
) -> bool:
    """
    Sends a security notification when account password has been changed.
    """
    html = get_password_changed_email(full_name=full_name)
    return send_email_sync(
        to_email=email,
        subject="Your SEYEYA Courts Password Was Changed",
        html_content=html,
        to_name=full_name
    )
