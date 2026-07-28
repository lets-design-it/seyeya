"""
Responsive HTML/CSS Email Templates for SEYEYA Courts Branding
"""

def get_base_template(content_html: str, title: str) -> str:
    """
    Wraps content in a professional, responsive layout matching SEYEYA Courts branding.
    """
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
            background: linear-gradient(135deg, #1e293b, #0f172a);
            padding: 30px;
            text-align: center;
            color: #ffffff;
        }}
        .header h1 {{
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.5px;
        }}
        .header p {{
            margin: 5px 0 0 0;
            font-size: 14px;
            color: #94a3b8;
        }}
        .body {{
            padding: 40px 30px;
            color: #334155;
            line-height: 1.6;
            font-size: 16px;
        }}
        .footer {{
            background-color: #f8fafc;
            padding: 20px 30px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
        }}
        .button {{
            display: inline-block;
            background-color: #3b82f6;
            color: #ffffff !important;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
        }}
        .highlight {{
            background-color: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 15px;
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
            color: #475569;
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
                <p>&copy; 2026 SEYEYA Courts. All rights reserved.</p>
                <p>Plot 45, Seyeya Road, Kampala, Uganda | Tel: +256 700 000 000</p>
            </div>
        </div>
    </div>
</body>
</html>
"""

def get_welcome_email(full_name: str, email: str, temp_password: str, reset_link: str) -> str:
    content = f"""
    <h2>Welcome to SEYEYA Courts!</h2>
    <p>Dear {full_name},</p>
    <p>An account has been successfully created for you on SEYEYA Courts platform.</p>
    <div class="highlight">
        <p style="margin:0;"><strong>Your Temporary Credentials:</strong></p>
        <p style="margin:5px 0 0 0;">Email: <strong>{email}</strong></p>
        <p style="margin:5px 0 0 0;">Password: <strong>{temp_password}</strong></p>
    </div>
    <p>Please click the button below to set up your password and secure your account:</p>
    <div style="text-align: center;">
        <a href="{reset_link}" class="button">Set Up Account Password</a>
    </div>
    <p>Or copy this link to your browser:</p>
    <p style="font-size: 13px; color: #64748b; word-break: break-all;">{reset_link}</p>
    <p>If you did not request this account, please contact our support team.</p>
    """
    return get_base_template(content, "Welcome to SEYEYA Courts")

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

def get_password_reset_email(full_name: str, reset_link: str) -> str:
    content = f"""
    <h2>Reset Your Password</h2>
    <p>Dear {full_name},</p>
    <p>We received a request to reset your SEYEYA Courts password. Click the button below to change your password (valid for 24 hours):</p>
    <div style="text-align: center;">
        <a href="{reset_link}" class="button">Reset Password</a>
    </div>
    <p>Or copy this link to your browser:</p>
    <p style="font-size: 13px; color: #64748b; word-break: break-all;">{reset_link}</p>
    <p>If you did not make this request, please ignore this email.</p>
    """
    return get_base_template(content, "Password Reset Request")

def get_reservation_confirmation_email(full_name: str, ref_code: str, details_html: str) -> str:
    content = f"""
    <h2>Reservation Confirmed</h2>
    <p>Dear {full_name},</p>
    <p>Your reservation is successfully created. Here are the reservation details:</p>
    <div class="highlight">
        <p style="margin:0;">Reservation Code: <strong>{ref_code}</strong></p>
    </div>
    {details_html}
    <p>If you have any questions or would like to request modifications, please contact our front desk.</p>
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
        <p style="margin:5px 0 0 0;">Total Amount: <strong>{total_amount}</strong></p>
    </div>
    <h3>Order Summary:</h3>
    {items_html}
    <p>We are preparing your food, and it will be ready shortly.</p>
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
