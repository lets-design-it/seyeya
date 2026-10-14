import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import asyncio
from datetime import datetime, date, time
from decimal import Decimal

from app.core.config import settings
from app.utils.email import send_email_sync, send_email_async
from app.utils.email_templates import (
    get_registration_welcome_email,
    get_welcome_email,
    get_password_reset_email,
    get_password_changed_email,
    get_reservation_confirmation_email,
    get_order_confirmation_email,
    format_accommodation_details_html,
    format_conference_details_html,
    format_order_items_html
)

TEST_RECIPIENT = "ahikirizahenry05@gmail.com"

def test_smtp_configuration():
    print(f"\n--- 1. Testing SMTP Settings ---")
    print(f"SMTP_SERVER: {settings.SMTP_SERVER}:{settings.SMTP_PORT}")
    print(f"SMTP_USER: {settings.SMTP_USER}")
    print(f"SEND_FROM_EMAIL: {settings.SEND_FROM_EMAIL}")
    print(f"FRONTEND_URL: {getattr(settings, 'FRONTEND_URL', 'Not set')}")
    assert settings.SMTP_USER == "ahikirizahenry05@gmail.com"
    print("SMTP settings verified successfully.")


def test_registration_welcome_email():
    print(f"\n--- 2. Testing Account Creation Email ---")
    html = get_registration_welcome_email(
        full_name="Henry Ahikiriza",
        email=TEST_RECIPIENT,
        login_link=f"{settings.FRONTEND_URL}/login"
    )
    result = send_email_sync(
        to_email=TEST_RECIPIENT,
        subject="[Test] Welcome to SEYEYA Courts!",
        html_content=html,
        to_name="Henry Ahikiriza"
    )
    print(f"Account Creation Email Sent: {result}")
    assert result is True


def test_password_reset_email():
    print(f"\n--- 3. Testing Password Reset Request Email ---")
    mock_token = "a1b2c3d4e5f6789012345678abcdef01"
    html = get_password_reset_email(
        full_name="Henry Ahikiriza",
        reset_link=f"{settings.FRONTEND_URL}/reset-password?token={mock_token}",
        reset_token=mock_token
    )
    result = send_email_sync(
        to_email=TEST_RECIPIENT,
        subject="[Test] Reset Your SEYEYA Courts Password",
        html_content=html,
        to_name="Henry Ahikiriza"
    )
    print(f"Password Reset Email Sent: {result}")
    assert result is True


def test_accommodation_reservation_email():
    print(f"\n--- 4. Testing Accommodation Reservation Email ---")
    details_html = format_accommodation_details_html(
        room_label="Deluxe Executive Suite (Room 204)",
        check_in_date="2026-10-20",
        check_out_date="2026-10-23",
        num_nights=3,
        num_adults=2,
        num_children=1,
        rate_per_night="250,000",
        total_amount="750,000",
        balance_due="750,000",
        special_requests="High floor with balcony view, extra pillows please."
    )
    html = get_reservation_confirmation_email(
        full_name="Henry Ahikiriza",
        ref_code="ACC-2026-TEST789",
        details_html=details_html
    )
    result = send_email_sync(
        to_email=TEST_RECIPIENT,
        subject="[Test] Accommodation Reservation Confirmed - ACC-2026-TEST789",
        html_content=html,
        to_name="Henry Ahikiriza"
    )
    print(f"Accommodation Reservation Email Sent: {result}")
    assert result is True


def test_conference_reservation_email():
    print(f"\n--- 5. Testing Conference Reservation Email ---")
    details_html = format_conference_details_html(
        hall_name="Victoria Grand Hall",
        event_name="Annual Tech Leadership Summit 2026",
        start_date="2026-11-05",
        end_date="2026-11-06",
        start_time="08:30 AM",
        end_time="05:30 PM",
        num_participants=120,
        facilities_summary="High-Definition 4K Projector x 2, Wireless Microphones x 6, PA Sound System",
        total_amount="3,500,000",
        amount_paid="1,500,000",
        balance_due="2,000,000"
    )
    html = get_reservation_confirmation_email(
        full_name="Henry Ahikiriza",
        ref_code="CON-2026-TEST456",
        details_html=details_html
    )
    result = send_email_sync(
        to_email=TEST_RECIPIENT,
        subject="[Test] Conference Reservation Confirmed - CON-2026-TEST456",
        html_content=html,
        to_name="Henry Ahikiriza"
    )
    print(f"Conference Reservation Email Sent: {result}")
    assert result is True


def test_restaurant_order_email():
    print(f"\n--- 6. Testing Restaurant Order Email ---")
    items = [
        {
            "name": "Grilled Tilapia Whole",
            "quantity": 2,
            "unit_price": "45,000",
            "total_price": "90,000",
            "extras_text": "Choice: Spicy Garlic Butter | Accompaniment: Steamed Rice | Extra: Avocado Slices"
        },
        {
            "name": "Fresh Passion Juice Pitcher",
            "quantity": 1,
            "unit_price": "25,000",
            "total_price": "25,000",
            "extras_text": "Served chilled"
        }
    ]
    details_html = format_order_items_html(
        items=items,
        subtotal="115,000",
        tax_amount="20,700",
        delivery_charge="5,000",
        total_amount="120,000",
        delivery_option="Premises (Table 12 - Terrace)",
        location_details="Courtside Terrace Table #12",
        special_instr="Please serve the beverages before the main course."
    )
    html = get_order_confirmation_email(
        full_name="Henry Ahikiriza",
        order_num="ORD-2026-TEST123",
        items_html=details_html,
        total_amount="120,000"
    )
    result = send_email_sync(
        to_email=TEST_RECIPIENT,
        subject="[Test] Restaurant Order Confirmed - ORD-2026-TEST123",
        html_content=html,
        to_name="Henry Ahikiriza"
    )
    print(f"Restaurant Order Email Sent: {result}")
    assert result is True


if __name__ == "__main__":
    print("==================================================")
    print("STARTING SEYEYA EMAIL NOTIFICATIONS TEST SUITE")
    print("==================================================")
    test_smtp_configuration()
    test_registration_welcome_email()
    test_password_reset_email()
    test_accommodation_reservation_email()
    test_conference_reservation_email()
    test_restaurant_order_email()
    print("\n==================================================")
    print("ALL 5 EMAIL TYPES SENT SUCCESSFULLY VIA GMAIL SMTP!")
    print("==================================================")
