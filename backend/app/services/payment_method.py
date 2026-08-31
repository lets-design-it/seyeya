"""
Service implementation for managing payment methods
"""
import json
import hashlib
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import PaymentMethod
from app.repositories import PaymentMethodRepository
from app.schemas import PaymentMethodCreate, PaymentMethodUpdate
from app.utils.encryption import encrypt_data, decrypt_data
from app.utils.masking import mask_card_number, mask_phone_number, mask_email
from app.utils.validation import detect_card_brand


def compute_identifier_hash(value: str) -> str:
    """Compute secure SHA-256 hash for duplicate check without storing plain text"""
    if not value:
        return ""
    # Clean whitespace and lowercase to standardize
    cleaned = "".join(value.split()).lower()
    return hashlib.sha256(cleaned.encode()).hexdigest()


class PaymentMethodService:
    """Service layer for business logic surrounding payment methods"""
    
    def __init__(self, db: AsyncSession):
        self.repository = PaymentMethodRepository(db)
        
    async def get_all_by_user(self, user_id: int) -> List[PaymentMethod]:
        """Get all payment methods for a user"""
        return await self.repository.get_all_by_user(user_id)
        
    async def get_by_id(self, user_id: int, payment_method_id: int) -> PaymentMethod:
        """Get specific payment method after verifying ownership"""
        pm = await self.repository.get_by_id(payment_method_id)
        if not pm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment method not found"
            )
        if pm.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this payment method"
            )
        return pm
        
    async def create(self, user_id: int, schema: PaymentMethodCreate) -> PaymentMethod:
        """Create a new payment method with proper encryption, masking, and validation"""
        # Determine unique identifier for duplicate checks
        unique_identifier = ""
        if schema.payment_type == "card":
            unique_identifier = schema.card_number
        elif schema.payment_type == "mobile_money":
            unique_identifier = schema.phone_number
        elif schema.payment_type == "digital_wallet":
            if schema.provider == "PayPal":
                unique_identifier = schema.email
            else:
                unique_identifier = schema.wallet_token
                
        unique_hash = compute_identifier_hash(unique_identifier)
        
        # Check for duplicates
        existing = await self.repository.get_by_hash(user_id, unique_hash)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This payment method has already been saved"
            )
            
        # Check if user already has other payment methods
        existing_methods = await self.repository.get_all_by_user(user_id)
        # If user has no existing methods, make this the default
        is_default = True if not existing_methods else False
        
        # Prepare safe/masked details dictionary
        details_dict = {}
        sensitive_dict = {}
        
        if schema.payment_type == "card":
            brand = detect_card_brand(schema.card_number)
            last4 = "".join(filter(str.isdigit, schema.card_number))[-4:]
            
            details_dict = {
                "display_name": f"{brand} ending in {last4}",
                "masked_card_number": mask_card_number(schema.card_number),
                "expiry_month": schema.expiry_month,
                "expiry_year": schema.expiry_year,
                "billing_address": schema.billing_address
            }
            sensitive_dict = {
                "cardholder_name": schema.cardholder_name,
                "card_number": schema.card_number,
                "expiry_month": schema.expiry_month,
                "expiry_year": schema.expiry_year,
                "billing_address": schema.billing_address,
                "cvv": schema.cvv
            }
            
        elif schema.payment_type == "mobile_money":
            details_dict = {
                "account_name": schema.account_name,
                "phone_number": mask_phone_number(schema.phone_number),
                "country_code": schema.country_code
            }
            sensitive_dict = {
                "account_name": schema.account_name,
                "phone_number": schema.phone_number,
                "country_code": schema.country_code
            }
            
        elif schema.payment_type == "digital_wallet":
            if schema.provider == "PayPal":
                details_dict = {
                    "email": mask_email(schema.email)
                }
                sensitive_dict = {
                    "email": schema.email
                }
            else: # Apple Pay or Google Pay
                details_dict = {
                    "wallet_name": schema.wallet_name or f"{schema.provider} Wallet"
                }
                sensitive_dict = {
                    "wallet_token": schema.wallet_token,
                    "device_id": schema.device_id,
                    "wallet_name": schema.wallet_name or f"{schema.provider} Wallet"
                }
                
        # Encrypt the sensitive dictionary
        encrypted_details = encrypt_data(json.dumps(sensitive_dict))
        
        # Create model instance
        pm = PaymentMethod(
            user_id=user_id,
            payment_type=schema.payment_type,
            provider=schema.provider,
            nickname=schema.nickname,
            is_default=is_default,
            is_verified=True,  # Initially verified since we passed validation
            status="active",
            details=details_dict,
            encrypted_details=encrypted_details,
            unique_hash=unique_hash
        )
        
        pm = await self.repository.create(pm)
        
        # If it was marked as default, unset other default methods
        if is_default:
            await self.repository.unset_other_defaults(user_id, exclude_id=pm.id)
            pm.is_default = True
            
        return pm

    async def update(self, user_id: int, payment_method_id: int, schema: PaymentMethodUpdate) -> PaymentMethod:
        """Update payment method details (expiry, billing address, nickname, default, phone, email, wallet details)"""
        pm = await self.get_by_id(user_id, payment_method_id)
        
        # Update nickname if provided
        if schema.nickname is not None:
            pm.nickname = schema.nickname
            
        # Update default status if requested
        if schema.is_default is True:
            pm.is_default = True
            await self.repository.unset_other_defaults(user_id, exclude_id=pm.id)
            
        # Update details_dict and sensitive_dict
        details_dict = pm.details or {}
        try:
            decrypted = decrypt_data(pm.encrypted_details)
            sensitive_dict = json.loads(decrypted)
        except Exception:
            sensitive_dict = {}
            
        has_identifier_change = False
        new_identifier = ""
            
        # Card updates
        if pm.payment_type == "card":
            if schema.expiry_month is not None:
                details_dict["expiry_month"] = schema.expiry_month
                sensitive_dict["expiry_month"] = schema.expiry_month
            if schema.expiry_year is not None:
                details_dict["expiry_year"] = schema.expiry_year
                sensitive_dict["expiry_year"] = schema.expiry_year
            if schema.billing_address is not None:
                details_dict["billing_address"] = schema.billing_address
                sensitive_dict["billing_address"] = schema.billing_address
            if schema.cvv is not None:
                sensitive_dict["cvv"] = schema.cvv
                
        # Mobile Money updates
        elif pm.payment_type == "mobile_money":
            if schema.account_name is not None:
                details_dict["account_name"] = schema.account_name
                sensitive_dict["account_name"] = schema.account_name
            if schema.phone_number is not None:
                details_dict["phone_number"] = mask_phone_number(schema.phone_number)
                sensitive_dict["phone_number"] = schema.phone_number
                has_identifier_change = True
                new_identifier = schema.phone_number
            if schema.country_code is not None:
                details_dict["country_code"] = schema.country_code
                sensitive_dict["country_code"] = schema.country_code
                
        # Digital Wallet updates
        elif pm.payment_type == "digital_wallet":
            if pm.provider == "PayPal":
                if schema.email is not None:
                    details_dict["email"] = mask_email(schema.email)
                    sensitive_dict["email"] = schema.email
                    has_identifier_change = True
                    new_identifier = schema.email
            else: # Apple/Google Pay
                if schema.wallet_name is not None:
                    details_dict["wallet_name"] = schema.wallet_name
                    sensitive_dict["wallet_name"] = schema.wallet_name
                if schema.wallet_token is not None:
                    sensitive_dict["wallet_token"] = schema.wallet_token
                    has_identifier_change = True
                    new_identifier = schema.wallet_token
                if schema.device_id is not None:
                    sensitive_dict["device_id"] = schema.device_id

        # Recompute hash if identifier changed (e.g. phone or email)
        if has_identifier_change:
            new_hash = compute_identifier_hash(new_identifier)
            if new_hash != pm.unique_hash:
                # Check duplicate conflicts
                existing = await self.repository.get_by_hash(user_id, new_hash)
                if existing and existing.id != pm.id:
                    raise HTTPException(
                        status_code=status.HTTP_409_CONFLICT,
                        detail="This payment method has already been registered"
                    )
                pm.unique_hash = new_hash
                
        # Save updated dicts
        pm.details = details_dict
        pm.encrypted_details = encrypt_data(json.dumps(sensitive_dict))
        
        return await self.repository.update(pm)
        
    async def delete(self, user_id: int, payment_method_id: int) -> bool:
        """Delete a payment method and optionally shift default status to another method"""
        pm = await self.get_by_id(user_id, payment_method_id)
        was_default = pm.is_default
        
        await self.repository.delete(pm)
        
        # If the deleted method was the default, assign a new default if other methods exist
        if was_default:
            remaining = await self.repository.get_all_by_user(user_id)
            if remaining:
                new_default = remaining[0]
                new_default.is_default = True
                await self.repository.update(new_default)
                await self.repository.unset_other_defaults(user_id, exclude_id=new_default.id)
                
        return True
        
    async def set_default(self, user_id: int, payment_method_id: int) -> PaymentMethod:
        """Explicitly set a payment method as default"""
        pm = await self.get_by_id(user_id, payment_method_id)
        pm.is_default = True
        await self.repository.update(pm)
        await self.repository.unset_other_defaults(user_id, exclude_id=pm.id)
        return pm
