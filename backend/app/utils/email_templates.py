"""
Responsive HTML/CSS Email Templates for SEYEYA Courts Branding
"""
from datetime import datetime
from typing import Optional

def get_base_template(content_html: str, title: str, year: Optional[int] = None) -> str:
    """
    Wraps content in a professional, responsive layout matching SEYEYA Courts branding.
    """
    if year is None:
        year = datetime.utcnow().year
    return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <style>
        body {{
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: #f4f5f7;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
        }}
        .wrapper {{
            width: 100%;
            background-color: #f4f5f7;
            padding: 40px 0;
        }}
        .container {{
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }}
        .header {{
            background: linear-gradient(135deg, #1e3a5f 0%, #0f1c2e 100%);
            padding: 32px 30px;
            text-align: center;
            color: #ffffff;
            border-bottom: 3px solid #d4af37;
        }}
        .header h1 {{
            margin: 0;
            font-size: 26px;
            font-weight: 700;
            letter-spacing: 0.5px;
            color: #ffffff;
        }}
        .header p {{
            margin: 6px 0 0 0;
            font-size: 13px;
            color: #d4af37;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
        }}
        .body {{
            padding: 40px 30px;
            color: #334155;
            line-height: 1.6;
            font-size: 16px;
        }}
        h1, h2, h3 {{
            color: #1e3a5f;
        }}
        .footer {{
            background-color: #f8fafc;
            padding: 24px 30px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
        }}
        .button {{
            display: inline-block;
            background-color: #1e3a5f;
            color: #ffffff !important;
            padding: 12px 28px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            font-size: 15px;
            margin: 15px 0;
            text-align: center;
            border: 1px solid #d4af37;
        }}
        .button-gold {{
            display: inline-block;
            background-color: #d4af37;
            color: #1e3a5f !important;
            padding: 12px 28px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 700;
            font-size: 15px;
            margin: 15px 0;
            text-align: center;
            border: 1px solid #b89327;
        }}
        .highlight {{
            background-color: #f7f9fc;
            border-left: 4px solid #d4af37;
            padding: 16px 20px;
            border-radius: 0 8px 8px 0;
            margin: 20px 0;
        }}
        .meta-table {{
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }}
        .meta-table td {{
            padding: 8px 0;
            border-bottom: 1px solid #f1f5f9;
        }}
        .meta-table td.label {{
            font-weight: 600;
            color: #1e3a5f;
            width: 35%;
        }}
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="header">
                <h1>SEYEYA COURTS</h1>
                <p>Integrated Booking & Reservation System</p>
            </div>
            <div class="body">
                {content_html}
            </div>
            <div class="footer">
                <p>&copy; {year} SEYEYA Courts. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
"""

def get_account_created_email(
    full_name: str,
    email: str,
    role_title: Optional[str] = "Customer",
    login_link: Optional[str] = None,
    *args,
    **kwargs
) -> str:
    """
    Email notification sent to user/customer when their account has been created.
    Uses SEYEYA Courts theme colors (#1e3a5f and #d4af37).
    Does NOT contain temporary passwords as the password is provided from the frontend.
    """
    login_url = login_link or "http://localhost:5173/login"
    role_html = f"<p style='margin: 6px 0 0 0;'>Account Type: <strong style='color: #1e3a5f;'>{role_title}</strong></p>" if role_title else ""
    
    content = f"""
    <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 50%; background-color: #f0f4f9; border: 2px solid #d4af37; text-align: center;">
            <span style="font-size: 26px; color: #1e3a5f;">&#10003;</span>
        </div>
        <h2 style="color: #1e3a5f; margin: 16px 0 6px 0; font-size: 22px; font-weight: 700;">Account Created Successfully</h2>
        <p style="color: #64748b; margin: 0; font-size: 14px;">Welcome to SEYEYA Courts</p>
    </div>

    <p>Dear <strong>{full_name}</strong>,</p>
    <p>Your account with <strong>SEYEYA Courts</strong> has been created successfully. We are excited to welcome you!</p>
    
    <div class="highlight">
        <p style="margin: 0; font-size: 13px; font-weight: 700; color: #1e3a5f; text-transform: uppercase; letter-spacing: 0.5px;">Account Information</p>
        <div style="margin-top: 10px; font-size: 15px;">
            <p style="margin: 4px 0 0 0;">Registered Email / Username: <strong style="color: #1e3a5f;">{email}</strong></p>
            {role_html}
        </div>
    </div>

    <p>You can now log in using your registered email and the password you set during registration.</p>

    <div style="text-align: center; margin: 30px 0;">
        <a href="{login_url}" class="button" style="background-color: #1e3a5f; color: #ffffff !important; border: 2px solid #d4af37; padding: 13px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">Log In to Your Account</a>
    </div>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 18px; margin-top: 25px;">
        <p style="font-size: 13px; color: #64748b; margin: 0; line-height: 1.5;">
            <strong style="color: #1e3a5f;">Security Reminder:</strong> Keep your password confidential. If you ever forget your password, you can securely request a password reset link at any time from the login page.
        </p>
    </div>

    <p style="margin-top: 25px;">Warm regards,<br><strong style="color: #1e3a5f;">The SEYEYA Courts Team</strong></p>
    """
    return get_base_template(content, "Welcome to SEYEYA Courts - Account Created")


def get_registration_welcome_email(
    full_name: str,
    email: str,
    password: Optional[str] = None,
    login_link: str = "",
    role_title: Optional[str] = None
) -> str:
    """Legacy alias for backward compatibility - sends the account created email."""
    return get_account_created_email(
        full_name=full_name,
        email=email,
        role_title=role_title or "Customer",
        login_link=login_link
    )


def get_welcome_email(
    full_name: str,
    email: str,
    temp_password: Optional[str] = None,
    reset_link: Optional[str] = None,
    role_title: str = "Customer",
    login_link: Optional[str] = None
) -> str:
    """Sends account created email without temporary password."""
    login_url = login_link or (reset_link.split("/reset-password")[0] + "/login" if reset_link and "/reset-password" in reset_link else "http://localhost:5173/login")
    return get_account_created_email(
        full_name=full_name,
        email=email,
        role_title=role_title,
        login_link=login_url
    )


def get_email_verification_code_email(email: str, code: str) -> str:
    """
    4-digit verification code email for mobile / web account verification.
    Uses SEYEYA Courts theme colors (#1e3a5f and #d4af37).
    """
    content = f"""
    <div style="text-align: center; margin-bottom: 24px;">
        <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 50%; background-color: #f0f4f9; border: 2px solid #d4af37; text-align: center;">
            <span style="font-size: 26px; color: #1e3a5f;">&#128274;</span>
        </div>
        <h2 style="color: #1e3a5f; margin: 16px 0 6px 0; font-size: 22px; font-weight: 700;">Verify Your Email Address</h2>
        <p style="color: #64748b; margin: 0; font-size: 14px;">One-Time Verification Code</p>
    </div>

    <p>Hello,</p>
    <p>Thank you for initiating account creation with <strong>SEYEYA Courts</strong>. Please enter the 4-digit verification code below to verify your email address (<strong>{email}</strong>) and proceed:</p>

    <div style="text-align: center; margin: 30px 0;">
        <div style="display: inline-block; background-color: #1e3a5f; color: #d4af37; padding: 18px 40px; border-radius: 10px; font-size: 38px; font-weight: 800; letter-spacing: 14px; border: 2px solid #d4af37; font-family: 'Courier New', Courier, monospace; box-shadow: 0 4px 12px rgba(30, 58, 95, 0.15);">
            {code}
        </div>
    </div>

    <p style="text-align: center; color: #64748b; font-size: 14px; margin: 15px 0;">
        This code is valid for <strong>10 minutes</strong>. Never share this code with anyone.
    </p>

    <div class="highlight" style="margin-top: 25px;">
        <p style="margin: 0; font-size: 13px; color: #475569;">
            If you did not request this verification code or attempt to create an account, please disregard this email.
        </p>
    </div>

    <p style="margin-top: 25px;">Warm regards,<br><strong style="color: #1e3a5f;">The SEYEYA Courts Security Team</strong></p>
    """
    return get_base_template(content, "SEYEYA Courts - Email Verification Code")

def get_verification_email(full_name: str, verification_link: str) -> str:
    content = f"""
    <h2>Verify Your Email Address</h2>
    <p>Dear {full_name},</p>
    <p>Thank you for registering. Please click the button below to verify your email address and activate your account:</p>
    <div style="text-align: center;">
        <a href="{verification_link}" class="button">Verify Email Address</a>
    </div>
    <p>Or copy this link to your browser:</p>
    <p style="font-size: 13px; color: #64748b; word-break: break-all;">{verification_link}</p>
    <p>If you did not sign up for a SEYEYA Courts account, please ignore this email.</p>
    """
    return get_base_template(content, "Verify Your Email Address")

def get_password_reset_email(full_name: str, reset_link: str, reset_token: str = "") -> str:
    token_section = ""
    if reset_token:
        token_section = f"""
        <div class="highlight" style="text-align: center;">
            <p style="margin:0; font-size:13px; color:#64748b;">Or use this Reset Token directly:</p>
            <p style="margin:5px 0 0 0; font-size:18px; font-weight:700; letter-spacing:2px; color:#1e293b;">{reset_token}</p>
        </div>
        """
    content = f"""
    <h2>Reset Your Password</h2>
    <p>Dear {full_name},</p>
    <p>We received a request to reset your SEYEYA Courts password. Click the button below to change your password (valid for 24 hours):</p>
    <div style="text-align: center;">
        <a href="{reset_link}" class="button">Reset Password</a>
    </div>
    {token_section}
    <p>Or copy this link to your browser:</p>
    <p style="font-size: 13px; color: #64748b; word-break: break-all;">{reset_link}</p>
    <p>If you did not make this request, you can safely ignore this email. Your account remains secure.</p>
    <p>Warm regards,<br>The SEYEYA Courts Team</p>
    """
    return get_base_template(content, "Password Reset Request")

def get_password_changed_email(full_name: str) -> str:
    content = f"""
    <h2>Password Successfully Changed</h2>
    <p>Dear {full_name},</p>
    <p>This is a confirmation that the password for your SEYEYA Courts account has just been changed.</p>
    <div class="highlight" style="border-left-color: #10b981; background-color: #ecfdf5;">
        <p style="margin:0; color:#065f46;"><strong>Security Notice:</strong> If you performed this action, no further steps are needed.</p>
    </div>
    <p>If you did NOT change your password, please contact our support team immediately to secure your account.</p>
    <p>Warm regards,<br>The SEYEYA Courts Security Team</p>
    """
    return get_base_template(content, "Password Changed Successfully")

def get_reservation_confirmation_email(full_name: str, ref_code: str, details_html: str) -> str:
    content = f"""
    <h2>Reservation Confirmed</h2>
    <p>Dear {full_name},</p>
    <p>Your reservation is successfully created. Here are your reservation details:</p>
    <div class="highlight">
        <p style="margin:0;">Reservation Code: <strong>{ref_code}</strong></p>
    </div>
    {details_html}
    <p>If you have any questions or would like to request modifications, please contact our front desk.</p>
    <p>Warm regards,<br>The SEYEYA Courts Team</p>
    """
    return get_base_template(content, "Reservation Confirmed")

def get_reservation_cancellation_email(full_name: str, ref_code: str, details_html: str) -> str:
    content = f"""
    <h2 style="color: #dc2626;">Reservation Cancelled</h2>
    <p>Dear {full_name},</p>
    <p>Your reservation <strong>{ref_code}</strong> has been cancelled. Below are the details:</p>
    {details_html}
    <p>If this was done in error or you need further assistance, please contact customer support.</p>
    """
    return get_base_template(content, "Reservation Cancelled")

def get_reservation_reminder_email(full_name: str, ref_code: str, details_html: str) -> str:
    content = f"""
    <h2>Upcoming Reservation Reminder</h2>
    <p>Dear {full_name},</p>
    <p>This is a reminder for your upcoming reservation (Code: <strong>{ref_code}</strong>):</p>
    {details_html}
    <p>We look forward to welcoming you to SEYEYA Courts!</p>
    """
    return get_base_template(content, "Reservation Reminder")

def get_order_confirmation_email(full_name: str, order_num: str, items_html: str, total_amount: str) -> str:
    content = f"""
    <h2>Order Confirmed</h2>
    <p>Dear {full_name},</p>
    <p>Your restaurant order has been placed successfully.</p>
    <div class="highlight">
        <p style="margin:0;">Order Number: <strong>{order_num}</strong></p>
        <p style="margin:5px 0 0 0;">Total Amount: <strong>UGX {total_amount}</strong></p>
    </div>
    <h3>Order Summary:</h3>
    {items_html}
    <p>We are preparing your food, and it will be ready shortly.</p>
    <p>Warm regards,<br>The SEYEYA Courts Restaurant Team</p>
    """
    return get_base_template(content, "Order Confirmation")

def get_payment_receipt_email(full_name: str, pay_ref: str, amount: str, method: str, date_str: str) -> str:
    content = f"""
    <h2>Payment Receipt</h2>
    <p>Dear {full_name},</p>
    <p>Thank you for your payment. Here is your receipt:</p>
    <table class="meta-table">
        <tr>
            <td class="label">Payment Reference</td>
            <td>{pay_ref}</td>
        </tr>
        <tr>
            <td class="label">Amount Paid</td>
            <td><strong>{amount}</strong></td>
        </tr>
        <tr>
            <td class="label">Payment Method</td>
            <td>{method}</td>
        </tr>
        <tr>
            <td class="label">Payment Date</td>
            <td>{date_str}</td>
        </tr>
        <tr>
            <td class="label">Status</td>
            <td><span style="color:#16a34a;font-weight:600;">Paid / Verified</span></td>
        </tr>
    </table>
    <p>Best regards,<br>The SEYEYA Courts Finance Team</p>
    """
    return get_base_template(content, "Payment Receipt")

def get_invoice_email(full_name: str, invoice_ref: str, items_html: str, balance_due: str, due_date: str) -> str:
    content = f"""
    <h2>Invoice Generated</h2>
    <p>Dear {full_name},</p>
    <p>A new invoice has been generated for your recent reservation/orders.</p>
    <div class="highlight">
        <p style="margin:0;">Invoice Reference: <strong>{invoice_ref}</strong></p>
        <p style="margin:5px 0 0 0;">Balance Due: <strong>{balance_due}</strong></p>
        <p style="margin:5px 0 0 0;">Due Date: <strong>{due_date}</strong></p>
    </div>
    <h3>Invoice Details:</h3>
    {items_html}
    <p>Please make payment on or before the due date to avoid service disruptions.</p>
    """
    return get_base_template(content, "Invoice Notification")

def get_booking_approved_email(full_name: str, ref_code: str, details_html: str) -> str:
    content = f"""
    <h2 style="color: #16a34a;">Booking Approved</h2>
    <p>Dear {full_name},</p>
    <p>Great news! Your booking request (Code: <strong>{ref_code}</strong>) has been approved by the manager.</p>
    {details_html}
    <p>We are preparing for your stay/event. See you soon!</p>
    """
    return get_base_template(content, "Booking Approved")

def get_booking_declined_email(full_name: str, ref_code: str, reason: str) -> str:
    content = f"""
    <h2 style="color: #dc2626;">Booking Declined</h2>
    <p>Dear {full_name},</p>
    <p>We regret to inform you that your booking request (Code: <strong>{ref_code}</strong>) was declined.</p>
    <div class="highlight" style="border-left-color: #dc2626; background-color: #fef2f2;">
        <p style="margin:0;"><strong>Reason:</strong></p>
        <p style="margin:5px 0 0 0;">{reason}</p>
    </div>
    <p>If you have questions, please contact our manager or attempt booking another slot.</p>
    """
    return get_base_template(content, "Booking Declined")

def get_system_announcement_email(title: str, message: str) -> str:
    content = f"""
    <h2>System Announcement: {title}</h2>
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin: 20px 0;">
        {message}
    </div>
    <p>If you have any feedback or queries, please feel free to reach out to our administration desk.</p>
    """
    return get_base_template(content, title)


def format_accommodation_details_html(
    room_label: str,
    check_in_date: str,
    check_out_date: str,
    num_nights: int,
    num_adults: int = 1,
    num_children: int = 0,
    rate_per_night: str = "0.00",
    total_amount: str = "0.00",
    balance_due: str = "0.00",
    special_requests: str = ""
) -> str:
    special_row = f"<tr><td class='label'>Special Requests</td><td>{special_requests}</td></tr>" if special_requests else ""
    return f"""
    <table class="meta-table">
        <tr>
            <td class="label">Room / Category</td>
            <td><strong>{room_label}</strong></td>
        </tr>
        <tr>
            <td class="label">Check-In Date</td>
            <td>{check_in_date}</td>
        </tr>
        <tr>
            <td class="label">Check-Out Date</td>
            <td>{check_out_date}</td>
        </tr>
        <tr>
            <td class="label">Duration</td>
            <td>{num_nights} night(s)</td>
        </tr>
        <tr>
            <td class="label">Guests</td>
            <td>{num_adults} Adult(s), {num_children} Child(ren)</td>
        </tr>
        <tr>
            <td class="label">Rate per Night</td>
            <td>UGX {rate_per_night}</td>
        </tr>
        <tr>
            <td class="label">Total Amount</td>
            <td><strong style="color: #1e293b;">UGX {total_amount}</strong></td>
        </tr>
        <tr>
            <td class="label">Balance Due</td>
            <td><span style="color: #e11d48; font-weight: 600;">UGX {balance_due}</span></td>
        </tr>
        {special_row}
    </table>
    """


def format_conference_details_html(
    hall_name: str,
    event_name: str,
    start_date: str,
    end_date: str,
    start_time: str,
    end_time: str,
    num_participants: int,
    facilities_summary: str = "",
    total_amount: str = "0.00",
    amount_paid: str = "0.00",
    balance_due: str = "0.00"
) -> str:
    fac_row = f"<tr><td class='label'>Facilities Included</td><td>{facilities_summary}</td></tr>" if facilities_summary else ""
    return f"""
    <table class="meta-table">
        <tr>
            <td class="label">Conference Hall</td>
            <td><strong>{hall_name}</strong></td>
        </tr>
        <tr>
            <td class="label">Event Name</td>
            <td>{event_name}</td>
        </tr>
        <tr>
            <td class="label">Dates</td>
            <td>{start_date} to {end_date}</td>
        </tr>
        <tr>
            <td class="label">Time Schedule</td>
            <td>{start_time} - {end_time}</td>
        </tr>
        <tr>
            <td class="label">Participants</td>
            <td>{num_participants} person(s)</td>
        </tr>
        {fac_row}
        <tr>
            <td class="label">Total Amount</td>
            <td><strong>UGX {total_amount}</strong></td>
        </tr>
        <tr>
            <td class="label">Amount Paid</td>
            <td>UGX {amount_paid}</td>
        </tr>
        <tr>
            <td class="label">Balance Due</td>
            <td><span style="color: #e11d48; font-weight: 600;">UGX {balance_due}</span></td>
        </tr>
    </table>
    """


def format_order_items_html(
    items: list,
    subtotal: str = "0.00",
    tax_amount: str = "0.00",
    delivery_charge: str = "0.00",
    total_amount: str = "0.00",
    delivery_option: str = "Premises",
    location_details: str = "",
    special_instr: str = ""
) -> str:
    rows = []
    for item in items:
        name = item.get("name", "Menu Item")
        qty = item.get("quantity", 1)
        price = item.get("unit_price", "0.00")
        total = item.get("total_price", "0.00")
        extras = item.get("extras_text", "")
        extra_html = f"<div style='font-size:12px;color:#64748b;'>{extras}</div>" if extras else ""
        rows.append(f"""
        <tr>
            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9;">
                <strong>{name}</strong> x {qty}
                {extra_html}
            </td>
            <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right;">
                UGX {total}
            </td>
        </tr>
        """)
    items_body = "".join(rows) if rows else "<tr><td colspan='2'>No items recorded</td></tr>"
    loc_row = f"<tr><td class='label'>Delivery Location</td><td>{location_details}</td></tr>" if location_details else ""
    instr_row = f"<tr><td class='label'>Instructions</td><td>{special_instr}</td></tr>" if special_instr else ""

    return f"""
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
            <tr style="border-bottom: 2px solid #e2e8f0; text-align: left; font-size: 13px; color: #64748b;">
                <th style="padding-bottom: 8px;">ITEM & DETAILS</th>
                <th style="padding-bottom: 8px; text-align: right;">AMOUNT</th>
            </tr>
        </thead>
        <tbody>
            {items_body}
        </tbody>
    </table>

    <table class="meta-table">
        <tr>
            <td class="label">Subtotal</td>
            <td>UGX {subtotal}</td>
        </tr>
        <tr>
            <td class="label">VAT / Tax</td>
            <td>UGX {tax_amount}</td>
        </tr>
        <tr>
            <td class="label">Delivery Fee</td>
            <td>UGX {delivery_charge}</td>
        </tr>
        <tr>
            <td class="label">Total Amount</td>
            <td><strong style="font-size: 16px; color: #1e293b;">UGX {total_amount}</strong></td>
        </tr>
        <tr>
            <td class="label">Delivery Type</td>
            <td>{delivery_option}</td>
        </tr>
        {loc_row}
        {instr_row}
    </table>
    """

