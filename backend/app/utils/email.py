"""
Email utility functions for immediate sending
"""
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

def send_immediate_welcome_email(
    email: str, 
    full_name: str, 
    temp_password: str, 
    reset_token: str
) -> bool:
    """
    Sends a welcome email to the customer immediately with login credentials 
    and a link to set a new password.
    
    If SMTP parameters are missing or the transfer fails, logs a warning and 
    returns False without raising an error to protect the registration flow.
    """
    # 1. Check if SMTP configuration is completed
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning(
            f"SMTP configuration is missing. Welcome email not sent to {email}. "
            f"Temporary password: {temp_password}, Reset token: {reset_token}"
        )
        # Also print to stdout for easy debugging during local development
        print(f"\n[EMAIL SIMULATION] To: {email}")
        print(f"Dear {full_name}, welcome to SEYEYA Courts!")
        print(f"Your temporary password is: {temp_password}")
        print(f"Reset Link: http://localhost:8000/reset-password?token={reset_token}\n")
        return False
        
    try:
        # Create message container
        msg = MIMEMultipart()
        msg['From'] = settings.SEND_FROM_EMAIL
        msg['To'] = email
        msg['Subject'] = "Welcome to SEYEYA Courts - Your Credentials"
        
        reset_link = f"http://localhost:8000/reset-password?token={reset_token}"
        
        # HTML body
        html = f"""
        <html>
          <body>
            <h2>Welcome to SEYEYA Courts!</h2>
            <p>Dear {full_name},</p>
            <p>An account has been created for you on the SEYEYA booking platform.</p>
            <p>Here are your temporary login details:</p>
            <ul>
              <li><strong>Email:</strong> {email}</li>
              <li><strong>Temporary Password:</strong> {temp_password}</li>
            </ul>
            <p>For security reasons, we strongly recommend you change your password immediately by clicking the link below:</p>
            <p><a href="{reset_link}">Click here to set your password</a></p>
            <p>Or copy this link to your browser:</p>
            <p>{reset_link}</p>
            <p>Best regards,<br>The SEYEYA Courts Team</p>
          </body>
        </html>
        """
        
        msg.attach(MIMEText(html, 'html'))
        
        # Connect to SMTP server
        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SEND_FROM_EMAIL, email, msg.as_string())
        server.close()
        
        logger.info(f"Welcome email successfully sent to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send welcome email to {email} via SMTP: {str(e)}")
        # Print fallback details to stdout for developer visibility
        print(f"\n[EMAIL SEND FAILURE FALLBACK] To: {email}")
        print(f"Temporary password: {temp_password}, Reset token: {reset_token}\n")
        return False


def send_password_reset_email(
    email: str, 
    full_name: str, 
    reset_token: str
) -> bool:
    """
    Sends a password reset link to the user immediately.
    
    If SMTP parameters are missing or the transfer fails, logs a warning and 
    returns False without raising an error.
    """
    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.warning(
            f"SMTP configuration is missing. Password reset email not sent to {email}. "
            f"Reset token: {reset_token}"
        )
        print(f"\n[EMAIL SIMULATION] To: {email}")
        print(f"Dear {full_name}, click the link below to reset your password:")
        print(f"Reset Link: http://localhost:8000/reset-password?token={reset_token}\n")
        return False
        
    try:
        msg = MIMEMultipart()
        msg['From'] = settings.SEND_FROM_EMAIL
        msg['To'] = email
        msg['Subject'] = "Reset Your SEYEYA Courts Password"
        
        reset_link = f"http://localhost:8000/reset-password?token={reset_token}"
        
        html = f"""
        <html>
          <body>
            <h2>Password Reset Request</h2>
            <p>Dear {full_name},</p>
            <p>We received a request to reset your password for your SEYEYA Courts account.</p>
            <p>Click the link below to set a new password. This link is valid for 24 hours:</p>
            <p><a href="{reset_link}">Reset my password</a></p>
            <p>Or copy this link to your browser:</p>
            <p>{reset_link}</p>
            <p>If you did not make this request, please ignore this email.</p>
            <p>Best regards,<br>The SEYEYA Courts Team</p>
          </body>
        </html>
        """
        
        msg.attach(MIMEText(html, 'html'))
        
        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.sendmail(settings.SEND_FROM_EMAIL, email, msg.as_string())
        server.close()
        
        logger.info(f"Password reset email successfully sent to {email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send password reset email to {email} via SMTP: {str(e)}")
        print(f"\n[EMAIL SEND FAILURE FALLBACK] To: {email}")
        print(f"Password Reset Link: http://localhost:8000/reset-password?token={reset_token}\n")
        return False
