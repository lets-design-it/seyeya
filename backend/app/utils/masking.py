"""
Masking utilities for PCI DSS compliant API responses
"""


def mask_card_number(card_number: str) -> str:
    """
    Mask a credit card number to only expose the last four digits.
    Example: '1234567812345678' -> '**** **** **** 5678'
    """
    if not card_number:
        return ""
    # Remove spaces/dashes
    cleaned = "".join(filter(str.isdigit, card_number))
    if len(cleaned) < 4:
        return "****"
    
    last_four = cleaned[-4:]
    return f"**** **** **** {last_four}"


def mask_phone_number(phone: str) -> str:
    """
    Mask a mobile money phone number.
    Example: '+256701234567' -> '+256*******567'
    """
    if not phone:
        return ""
    
    # Handle country prefix (e.g., +256 or +254)
    # The requirement asks for +256*******123 format
    # Let's count digits and preserve country prefix (+ followed by 1-3 digits) and last 3 digits
    if phone.startswith("+"):
        # Detect prefix length (usually +256 is 4 chars)
        # Let's assume the first 4 characters are prefix (e.g., +256)
        prefix = phone[:4]
        suffix = phone[-3:] if len(phone) >= 7 else ""
        middle_len = len(phone) - len(prefix) - len(suffix)
        stars = "*" * max(middle_len, 3)
        return f"{prefix}{stars}{suffix}"
    else:
        # Non-E.164 phone number
        suffix = phone[-3:] if len(phone) >= 6 else ""
        middle_len = len(phone) - len(suffix)
        stars = "*" * max(middle_len, 5)
        return f"{stars}{suffix}"


def mask_email(email: str) -> str:
    """
    Mask a PayPal email address.
    Example: 'john.doe@gmail.com' -> 'j*****@gmail.com'
    """
    if not email or "@" not in email:
        return email
    
    parts = email.split("@", 1)
    name = parts[0]
    domain = parts[1]
    
    if len(name) <= 1:
        masked_name = name + "*****"
    else:
        masked_name = name[0] + "*****"
        
    return f"{masked_name}@{domain}"
