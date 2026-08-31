"""
Validation utilities for payment methods
"""
import re
from datetime import datetime
from typing import Tuple


def luhn_checksum(card_number: str) -> bool:
    """
    Validate card number format using Luhn algorithm (mod 10).
    """
    cleaned = "".join(filter(str.isdigit, card_number))
    if not cleaned:
        return False
        
    digits = [int(d) for d in cleaned]
    odd_digits = digits[-1::-2]
    even_digits = digits[-2::-2]
    
    total = sum(odd_digits)
    for d in even_digits:
        total += sum(divmod(d * 2, 10))
        
    return total % 10 == 0


def detect_card_brand(card_number: str) -> str:
    """
    Detect card brand from card number prefix.
    Only Visa and Mastercard are supported.
    """
    cleaned = "".join(filter(str.isdigit, card_number))
    if not cleaned:
        return ""
        
    # Visa: starts with 4
    if cleaned.startswith("4"):
        return "Visa"
        
    # Mastercard: starts with 51-55 or 2221-2720
    if len(cleaned) >= 2:
        prefix2 = int(cleaned[:2])
        if 51 <= prefix2 <= 55:
            return "Mastercard"
            
    if len(cleaned) >= 4:
        prefix4 = int(cleaned[:4])
        if 2221 <= prefix4 <= 2720:
            return "Mastercard"
            
    return ""


def validate_card_details(
    card_number: str, expiry_month: int, expiry_year: int
) -> Tuple[bool, str]:
    """
    Validate credit card number, brand, and expiration.
    Returns (is_valid, error_message).
    """
    cleaned = "".join(filter(str.isdigit, card_number))
    if not cleaned or len(cleaned) < 13 or len(cleaned) > 19:
        return False, "Card number must be between 13 and 19 digits"
        
    # Check brand
    brand = detect_card_brand(cleaned)
    if not brand:
        return False, "Unsupported card brand. Only Visa and Mastercard are supported."
        
    # Run Luhn check
    if not luhn_checksum(cleaned):
        return False, "Invalid card number (failed Luhn checksum)"
        
    # Expiry Month check
    if not (1 <= expiry_month <= 12):
        return False, "Expiry month must be between 1 and 12"
        
    # Expiry Year check
    now = datetime.now()
    curr_year = now.year
    curr_month = now.month
    
    # If a 2-digit year is passed, convert to 4-digit
    if expiry_year < 100:
        expiry_year += 2000
        
    if expiry_year < curr_year:
        return False, "Card has expired"
    elif expiry_year == curr_year and expiry_month < curr_month:
        return False, "Card has expired"
        
    return True, ""


def validate_mobile_money(
    phone_number: str, provider: str, country_code: str = None
) -> Tuple[bool, str, str]:
    """
    Validate and normalize mobile money phone number format and provider.
    Supported providers: MTN MoMo, Airtel Money.
    Supports local format input and prepends country_code if needed.
    """
    # Allowed providers
    if provider not in ["MTN MoMo", "Airtel Money"]:
        return False, f"Unsupported mobile money provider: {provider}", phone_number
        
    # Clean non-digit characters from phone number except potential leading '+'
    cleaned_phone = re.sub(r"[^\d+]", "", phone_number)
    
    # If the phone starts with '+', it is already international
    if cleaned_phone.startswith("+"):
        normalized = cleaned_phone
    else:
        # Check if the number already starts with a known international country code prefix
        known_prefixes = ["256", "254", "255", "250", "257", "211", "233", "234", "27"]
        starts_with_known = False
        for prefix in known_prefixes:
            if cleaned_phone.startswith(prefix):
                starts_with_known = True
                break
                
        if starts_with_known:
            normalized = "+" + cleaned_phone
        else:
            # Check if country_code is provided
            clean_cc = "+256"
            if country_code:
                clean_cc = re.sub(r"[^\d+]", "", country_code)
                if not clean_cc.startswith("+"):
                    clean_cc = "+" + clean_cc
            
            cc_digits = clean_cc.replace("+", "")
            
            # If phone already starts with the country code digits, just prepend '+'
            if cc_digits and cleaned_phone.startswith(cc_digits):
                normalized = "+" + cleaned_phone
            else:
                # Remove leading zero from phone if present
                if cleaned_phone.startswith("0"):
                    cleaned_phone = cleaned_phone[1:]
                    
                normalized = f"{clean_cc}{cleaned_phone}"
        
    # Check phone format: starts with '+' followed by 9 to 15 digits
    # e.g., +256701234567
    phone_pattern = re.compile(r"^\+[1-9]\d{8,14}$")
    if not phone_pattern.match(normalized):
        return False, "Phone number must be a valid mobile money number (e.g. +256700000000 or 0770000000)", normalized
        
    return True, "", normalized


def validate_paypal_email(email: str) -> Tuple[bool, str]:
    """
    Validate PayPal email format.
    """
    email_pattern = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")
    if not email_pattern.match(email):
        return False, "Invalid email address format"
    return True, ""
