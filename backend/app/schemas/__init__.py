"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, Field, EmailStr, field_validator, model_validator
from datetime import datetime, date, time
from typing import Optional, List, Any
from decimal import Decimal


# =====================================================================
# AUTH SCHEMAS
# =====================================================================

class UserRegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    phone_number: Optional[str] = None
    password: str
    confirm_password: str
    role_ids: Optional[List[int]] = None
    is_staff: Optional[bool] = False
    
    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user_id: Optional[int] = None
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    is_staff: Optional[bool] = False
    customer_id: Optional[int] = None
    roles: Optional[List[str]] = []


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


# =====================================================================
# USER SCHEMAS
# =====================================================================

class UserBase(BaseModel):
    full_name: str
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    is_staff: Optional[bool] = False
    is_active: Optional[bool] = True


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    password: Optional[str] = None
    is_staff: Optional[bool] = None
    is_active: Optional[bool] = None


class UserResponse(UserBase):
    user_id: int
    last_login_at: Optional[datetime] = None
    roles: Optional[List[str]] = []
    
    @model_validator(mode="before")
    @classmethod
    def extract_roles(cls, data: Any) -> Any:
        if isinstance(data, dict):
            return data
            
        roles_list = []
        if hasattr(data, "roles") and data.roles:
            roles_list = [ur.role.role_name for ur in data.roles if ur.role]
            
        # Create dictionary from ORM attributes
        return {
            "user_id": data.user_id,
            "full_name": data.full_name,
            "email": data.email,
            "phone_number": data.phone_number,
            "is_staff": data.is_staff,
            "is_active": data.is_active,
            "last_login_at": data.last_login_at,
            "roles": roles_list
        }

    class Config:
        from_attributes = True


# =====================================================================
# CUSTOMER SCHEMAS
# =====================================================================

class CustomerBase(BaseModel):
    full_name: str
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    nationality: Optional[str] = None
    address: Optional[str] = None
    nin: Optional[str] = None
    passport_number: Optional[str] = None
    customer_type: Optional[str] = "Registered"
    is_contract_client: Optional[bool] = False
    is_active: Optional[bool] = True


class CustomerCreate(CustomerBase):
    user_id: Optional[int] = None
    total_spent: Optional[Decimal] = Decimal(0)
    visit_count: Optional[int] = 0
    loyalty_points: Optional[int] = 0


class CustomerUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    nationality: Optional[str] = None
    address: Optional[str] = None
    nin: Optional[str] = None
    passport_number: Optional[str] = None
    customer_type: Optional[str] = None
    is_contract_client: Optional[bool] = None
    is_active: Optional[bool] = None


class CustomerResponse(CustomerBase):
    customer_id: int
    customer_code: str
    user_id: Optional[int] = None
    total_spent: Decimal
    visit_count: int
    loyalty_points: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# =====================================================================
# ROLES AND PERMISSIONS SCHEMAS
# =====================================================================

class PermissionResponse(BaseModel):
    permission_id: int
    group_id: Optional[int] = None
    permission_key: str
    display_name: str
    description: Optional[str] = None
    is_active: Optional[bool] = True

    class Config:
        from_attributes = True


class PermissionGroupResponse(BaseModel):
    group_id: int
    group_name: str
    permissions: List[PermissionResponse] = []

    class Config:
        from_attributes = True


class RolePermissionResponse(BaseModel):
    role_permission_id: int
    role_id: int
    permission_id: int
    permission: Optional[PermissionResponse] = None

    class Config:
        from_attributes = True


class RoleResponse(BaseModel):
    role_id: int
    role_name: str
    description: Optional[str] = None
    parent_role_id: Optional[int] = None
    is_active: bool
    is_system_role: bool
    permissions: List[RolePermissionResponse] = []

    class Config:
        from_attributes = True


class RoleCreate(BaseModel):
    role_name: str
    description: Optional[str] = None
    parent_role_id: Optional[int] = None
    is_active: Optional[bool] = True
    is_system_role: Optional[bool] = False
    permission_ids: Optional[List[int]] = []


class RoleUpdate(BaseModel):
    role_name: Optional[str] = None
    description: Optional[str] = None
    parent_role_id: Optional[int] = None
    is_active: Optional[bool] = None
    permission_ids: Optional[List[int]] = None


class UserRoleAssign(BaseModel):
    role_id: int
    expires_at: Optional[datetime] = None


class RolePermissionAssign(BaseModel):
    permission_ids: List[int]


class TransactionResponse(BaseModel):
    type: str
    reference_id: int
    amount: Optional[Decimal] = None
    currency: Optional[str] = None
    date: datetime
    description: Optional[str] = None


class CustomerProfileResponse(CustomerResponse):
    num_restaurant_orders: int
    num_accommodation_reservations: int
    num_conference_reservations: int
    recent_transactions: List[TransactionResponse] = []
    reviews: Optional[List[str]] = []
    customer_tier: Optional[str] = None


class TopCustomerResponse(BaseModel):
    customer_id: int
    customer_code: str
    full_name: str
    total_spent: Decimal

    class Config:
        from_attributes = True


# =====================================================================
# RESTAURANT SCHEMAS
# =====================================================================

class MenuCategoryResponse(BaseModel):
    category_id: int
    category_name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    sort_order: int
    is_active: bool
    
    class Config:
        from_attributes = True


class MenuCategoryCreate(BaseModel):
    category_name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    sort_order: Optional[int] = 0
    is_active: Optional[bool] = True


class MenuExtraResponse(BaseModel):
    extra_id: int
    extra_name: str
    price: Decimal
    is_available: bool
    image_url: Optional[str] = None
    
    class Config:
        from_attributes = True


class MenuChoiceCreate(BaseModel):
    choice_name: str
    price: Optional[Decimal] = None
    is_available: Optional[bool] = True


class MenuChoiceUpdate(BaseModel):
    choice_name: Optional[str] = None
    price: Optional[Decimal] = None
    is_available: Optional[bool] = None


class MenuChoiceResponse(BaseModel):
    choice_id: int
    menu_item_id: int
    choice_name: str
    price: Optional[Decimal] = None
    is_available: bool
    
    class Config:
        from_attributes = True


class MenuAccompanimentCreate(BaseModel):
    accompaniment_name: str
    price: Optional[Decimal] = None
    is_available: Optional[bool] = True


class MenuAccompanimentUpdate(BaseModel):
    accompaniment_name: Optional[str] = None
    price: Optional[Decimal] = None
    is_available: Optional[bool] = None


class MenuAccompanimentResponse(BaseModel):
    accompaniment_id: int
    menu_item_id: int
    accompaniment_name: str
    price: Optional[Decimal] = None
    is_available: bool
    
    class Config:
        from_attributes = True


class MenuExtraUpdate(BaseModel):
    extra_name: Optional[str] = None
    price: Optional[Decimal] = None
    is_available: Optional[bool] = None
    image_url: Optional[str] = None


class MenuItemResponse(BaseModel):
    menu_item_id: int
    category_id: int
    item_name: str
    description: Optional[str] = None
    price: Decimal
    quantity: int
    image_url: Optional[str] = None
    allergen_info: Optional[str] = None
    preparation_time: Optional[int] = None
    is_available: bool
    is_active: bool
    extras: Optional[List[MenuExtraResponse]] = []
    choices: Optional[List[MenuChoiceResponse]] = []
    accompaniments: Optional[List[MenuAccompanimentResponse]] = []
    
    class Config:
        from_attributes = True


class MenuItemCreate(BaseModel):
    category_id: int
    item_name: str
    description: Optional[str] = None
    price: Decimal
    quantity: Optional[int] = 0
    image_url: Optional[str] = None
    allergen_info: Optional[str] = None
    preparation_time: Optional[int] = None
    is_available: Optional[bool] = True
    is_active: Optional[bool] = True


class MenuExtraCreate(BaseModel):
    extra_name: str
    price: Decimal = 0
    is_available: Optional[bool] = True
    image_url: Optional[str] = None


class MenuExtraResponse(BaseModel):
    extra_id: int
    extra_name: str
    price: Decimal
    is_available: bool
    
    class Config:
        from_attributes = True


class OrderItemExtraCreate(BaseModel):
    extra_id: int
    quantity: int = 1


class OrderItemCreate(BaseModel):
    menu_item_id: int
    quantity: int = 1
    special_notes: Optional[str] = None
    choice_id: Optional[int] = None
    accompaniment_id: Optional[int] = None
    extras: Optional[List[OrderItemExtraCreate]] = None


class RestaurantOrderCreate(BaseModel):
    customer_id: Optional[int] = None
    seating_location: Optional[str] = None
    delivery_option: str = "Premises"
    delivery_address: Optional[str] = None
    preferred_time: Optional[datetime] = None
    special_instr: Optional[str] = None
    items: List[OrderItemCreate]


class RestaurantOrderUpdate(BaseModel):
    order_status: Optional[str] = None
    payment_status: Optional[str] = None
    amount_paid: Optional[Decimal] = None


class OrderItemResponse(BaseModel):
    order_item_id: int
    menu_item_id: int
    quantity: int
    unit_price: Decimal
    total_price: Decimal
    special_notes: Optional[str] = None
    choice_id: Optional[int] = None
    accompaniment_id: Optional[int] = None
    
    class Config:
        from_attributes = True


class RestaurantOrderResponse(BaseModel):
    order_id: int
    customer_id: Optional[int] = None
    order_number: str
    seating_location: Optional[str] = None
    delivery_option: str
    total_amount: Decimal
    amount_paid: Decimal
    balance_due: Decimal
    order_status: str
    payment_status: str
    items: List[OrderItemResponse]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class CustomerOrdersResponse(BaseModel):
    customer_id: int
    total_orders: int
    orders: List[RestaurantOrderResponse]

    class Config:
        from_attributes = True


# =====================================================================
# ACCOMMODATION SCHEMAS
# =====================================================================

class RoomCategoryResponse(BaseModel):
    room_category_id: int
    category_name: str
    description: Optional[str] = None
    base_rate_usd: Decimal
    is_active: bool
    
    class Config:
        from_attributes = True


class RoomPhotoResponse(BaseModel):
    photo_id: int
    photo_url: str
    caption: Optional[str] = None
    sort_order: int
    
    class Config:
        from_attributes = True


class RoomResponse(BaseModel):
    room_id: int
    room_number: str
    floor: Optional[str] = None
    room_status: str
    max_occupancy: int
    description: Optional[str] = None
    amenities: Optional[str] = None
    photos: List[RoomPhotoResponse]
    
    class Config:
        from_attributes = True


class AccommodationReservationCreate(BaseModel):
    customer_id: int
    room_id: int
    check_in_date: date
    check_out_date: date
    num_adults: int = 1
    num_children: int = 0
    special_requests: Optional[str] = None


class GuestCheckInDetailCreate(BaseModel):
    guest_name: str
    nationality: Optional[str] = None
    phone_number: Optional[str] = None
    passport_number: Optional[str] = None
    is_primary: bool = False


class AccommodationReservationUpdate(BaseModel):
    reservation_status: Optional[str] = None
    payment_status: Optional[str] = None
    amount_paid: Optional[Decimal] = None


class AccommodationReservationResponse(BaseModel):
    reservation_id: int
    customer_id: int
    room_id: int
    reservation_code: str
    check_in_date: date
    check_out_date: date
    num_nights: int
    total_amount: Decimal
    amount_paid: Decimal
    balance_due: Decimal
    reservation_status: str
    payment_status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# =====================================================================
# CONFERENCE SCHEMAS
# =====================================================================

class ConferenceHallResponse(BaseModel):
    hall_id: int
    hall_name: str
    capacity: int
    hourly_rate: Optional[Decimal] = None
    full_day_rate: Optional[Decimal] = None
    half_day_rate: Optional[Decimal] = None
    description: Optional[str] = None
    amenities: Optional[str] = None
    
    class Config:
        from_attributes = True


class ConferenceResourceResponse(BaseModel):
    resource_id: int
    resource_name: str
    daily_rate: Decimal
    quantity: int
    is_available: bool
    
    class Config:
        from_attributes = True


class ConferenceMealPackageResponse(BaseModel):
    package_id: int
    package_name: str
    description: Optional[str] = None
    price_per_person: Decimal
    min_participants: int
    
    class Config:
        from_attributes = True


class ConferenceResourceBookingCreate(BaseModel):
    resource_id: int
    quantity: int = 1


class ConferenceMealBookingCreate(BaseModel):
    package_id: int
    num_participants: int


class ConferenceReservationCreate(BaseModel):
    customer_id: int
    hall_id: int
    event_name: str
    event_start_date: date
    event_end_date: date
    start_time: time
    end_time: time
    num_participants: int
    booking_type: str
    special_requests: Optional[str] = None
    resources: Optional[List[ConferenceResourceBookingCreate]] = None
    meals: Optional[List[ConferenceMealBookingCreate]] = None


class ConferenceReservationUpdate(BaseModel):
    reservation_status: Optional[str] = None
    payment_status: Optional[str] = None
    amount_paid: Optional[Decimal] = None


class ConferenceReservationResponse(BaseModel):
    conference_res_id: int
    customer_id: int
    hall_id: int
    reservation_code: str
    event_name: str
    event_start_date: date
    event_end_date: date
    start_time: time
    end_time: time
    booking_type: str
    num_participants: int
    total_amount: Decimal
    amount_paid: Decimal
    balance_due: Decimal
    reservation_status: str
    payment_status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# =====================================================================
# PAYMENT SCHEMAS
# =====================================================================

class PaymentCreate(BaseModel):
    customer_id: Optional[int] = None
    payment_type: str  # RestaurantOrder | AccommodationReservation | ConferenceReservation
    reference_type: str  # RestaurantOrder | AccommodationReservation | ConferenceReservation
    reference_id: int
    payment_method: str  # MobileMoney | VISA | FlexPay | BankTransfer
    amount_paid: Decimal
    is_deposit: bool = False
    deposit_percent: Optional[Decimal] = None


class PaymentResponse(BaseModel):
    payment_id: int
    customer_id: Optional[int] = None
    payment_type: str
    reference_type: str
    reference_id: int
    payment_method: str
    amount_paid: Decimal
    payment_status: str
    payment_date: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True


class PaymentMethodCreate(BaseModel):
    payment_type: str  # card | mobile_money | digital_wallet
    provider: str      # Visa | Mastercard | MTN MoMo | Airtel Money | PayPal | Apple Pay | Google Pay
    nickname: Optional[str] = None
    
    # Card fields
    cardholder_name: Optional[str] = None
    card_number: Optional[str] = None
    expiry_month: Optional[int] = None
    expiry_year: Optional[int] = None
    billing_address: Optional[str] = None
    cvv: Optional[str] = None
    
    # Mobile Money fields
    account_name: Optional[str] = None
    phone_number: Optional[str] = None
    country_code: Optional[str] = None
    
    # PayPal / Digital Wallet fields
    email: Optional[str] = None
    wallet_name: Optional[str] = None
    wallet_token: Optional[str] = None
    device_id: Optional[str] = None

    @model_validator(mode="after")
    def validate_payment_method(self) -> 'PaymentMethodCreate':
        # Smart fuzzy normalization of payment type and provider first
        ptype_raw = self.payment_type or ""
        prov_raw = self.provider or ""
        
        ptype_clean = ptype_raw.lower().strip().replace(" ", "").replace("_", "")
        prov_clean = prov_raw.lower().strip().replace(" ", "").replace("_", "")
        
        detected_type = None
        detected_provider = None
        
        # 1. Card check
        if "visa" in ptype_clean or "visa" in prov_clean:
            detected_type = "card"
            detected_provider = "Visa"
        elif "mastercard" in ptype_clean or "mastercard" in prov_clean:
            detected_type = "card"
            detected_provider = "Mastercard"
        elif ptype_clean == "card":
            detected_type = "card"
            if prov_clean == "mastercard":
                detected_provider = "Mastercard"
            else:
                detected_provider = "Visa"
                
        # 2. Mobile Money check
        elif "mtn" in ptype_clean or "mtn" in prov_clean or "momo" in ptype_clean or "momo" in prov_clean:
            detected_type = "mobile_money"
            detected_provider = "MTN MoMo"
        elif "airtel" in ptype_clean or "airtel" in prov_clean:
            detected_type = "mobile_money"
            detected_provider = "Airtel Money"
        elif ptype_clean in ["mobilemoney", "mobile_money"]:
            detected_type = "mobile_money"
            if "airtel" in prov_clean:
                detected_provider = "Airtel Money"
            else:
                detected_provider = "MTN MoMo"
                
        # 3. Digital Wallet check
        elif "paypal" in ptype_clean or "paypal" in prov_clean or "pay" in ptype_clean or "pay" in prov_clean:
            detected_type = "digital_wallet"
            if "apple" in prov_clean or "apple" in ptype_clean:
                detected_provider = "Apple Pay"
            elif "google" in prov_clean or "google" in ptype_clean:
                detected_provider = "Google Pay"
            else:
                detected_provider = "PayPal"
        elif ptype_clean in ["digitalwallet", "digital_wallet", "wallet"]:
            detected_type = "digital_wallet"
            if "apple" in prov_clean:
                detected_provider = "Apple Pay"
            elif "google" in prov_clean:
                detected_provider = "Google Pay"
            else:
                detected_provider = "PayPal"
                
        if detected_type:
            self.payment_type = detected_type
        if detected_provider:
            self.provider = detected_provider
            
        ptype = self.payment_type
        prov = self.provider

        # Now clean Swagger placeholders for fields NOT relevant or NOT required for the active payment type:
        always_clean = ["nickname", "billing_address", "country_code", "wallet_name"]
        fields_to_clean = list(always_clean)
        
        if ptype == "card":
            fields_to_clean.extend(["account_name", "phone_number", "email", "wallet_token", "device_id"])
        elif ptype == "mobile_money":
            fields_to_clean.extend(["cardholder_name", "card_number", "cvv", "email", "wallet_token", "device_id"])
        elif ptype == "digital_wallet":
            fields_to_clean.extend(["cardholder_name", "card_number", "cvv", "account_name", "phone_number"])
            if prov == "PayPal":
                fields_to_clean.extend(["wallet_token", "device_id"])
            else: # Apple/Google Pay
                fields_to_clean.extend(["email"])
                
        for field in fields_to_clean:
            val = getattr(self, field, None)
            if val is not None:
                val_str = str(val).strip()
                if val_str.lower() == "string" or val_str == "":
                    setattr(self, field, None)
        
        # General validations
        if ptype not in ["card", "mobile_money", "digital_wallet"]:
            raise ValueError(f"Invalid payment_type: {ptype_raw} (Cleaned: {ptype})")
            
        if ptype == "card":
            if prov not in ["Visa", "Mastercard"]:
                raise ValueError("Card provider must be Visa or Mastercard")
            if not self.cardholder_name:
                raise ValueError("cardholder_name is required for card payments")
            if not self.card_number:
                raise ValueError("card_number is required for card payments")
            if self.expiry_month is None:
                raise ValueError("expiry_month is required for card payments")
            if self.expiry_year is None:
                raise ValueError("expiry_year is required for card payments")
                
            from app.utils.validation import validate_card_details
            is_valid, err = validate_card_details(self.card_number, self.expiry_month, self.expiry_year)
            if not is_valid:
                raise ValueError(err)
                
        elif ptype == "mobile_money":
            if prov not in ["MTN MoMo", "Airtel Money"]:
                raise ValueError("Mobile money provider must be MTN MoMo or Airtel Money")
            if not self.account_name:
                raise ValueError("account_name is required for mobile money")
            if not self.phone_number:
                raise ValueError("phone_number is required for mobile money")
                
            from app.utils.validation import validate_mobile_money
            is_valid, err, normalized = validate_mobile_money(self.phone_number, prov, self.country_code)
            if not is_valid:
                raise ValueError(err)
            self.phone_number = normalized
                
        elif ptype == "digital_wallet":
            if prov not in ["PayPal", "Apple Pay", "Google Pay"]:
                raise ValueError("Digital wallet provider must be PayPal, Apple Pay, or Google Pay")
                
            if prov == "PayPal":
                if not self.email:
                    raise ValueError("email is required for PayPal")
                from app.utils.validation import validate_paypal_email
                is_valid, err = validate_paypal_email(self.email)
                if not is_valid:
                    raise ValueError(err)
            else: # Apple Pay or Google Pay
                if not self.wallet_token:
                    raise ValueError("wallet_token is required for digital wallets")
                if not self.device_id:
                    raise ValueError("device_id is required for digital wallets")
                    
        return self


class PaymentMethodUpdate(BaseModel):
    nickname: Optional[str] = None
    is_default: Optional[bool] = None
    
    # Expiry/billing updates for card
    expiry_month: Optional[int] = None
    expiry_year: Optional[int] = None
    billing_address: Optional[str] = None
    cvv: Optional[str] = None
    
    # Mobile money updates
    account_name: Optional[str] = None
    phone_number: Optional[str] = None
    country_code: Optional[str] = None
    
    # Digital wallet updates
    email: Optional[str] = None
    wallet_name: Optional[str] = None
    wallet_token: Optional[str] = None
    device_id: Optional[str] = None

    @model_validator(mode="after")
    def validate_expiry_and_details(self) -> 'PaymentMethodUpdate':
        # Auto-convert Swagger default "string" and empty values to None
        for field in ["nickname", "billing_address", "account_name", "phone_number", "country_code", "email", "wallet_name", "wallet_token", "device_id", "cvv"]:
            val = getattr(self, field, None)
            if val is not None:
                val_str = str(val).strip()
                if val_str.lower() == "string" or val_str == "":
                    setattr(self, field, None)

        # Auto-convert Swagger default 0 values to None
        if self.expiry_month == 0:
            self.expiry_month = None
        if self.expiry_year == 0:
            self.expiry_year = None

        if self.expiry_month is not None or self.expiry_year is not None:
            if self.expiry_month is None or self.expiry_year is None:
                raise ValueError("Both expiry_month and expiry_year must be provided to update expiry")
            if not (1 <= self.expiry_month <= 12):
                raise ValueError("Expiry month must be between 1 and 12")
            now = datetime.now()
            year = self.expiry_year + 2000 if self.expiry_year < 100 else self.expiry_year
            if year < now.year or (year == now.year and self.expiry_month < now.month):
                raise ValueError("New expiry date cannot be in the past")
                
        # Validate/normalize phone if provided
        if self.phone_number:
            from app.utils.validation import validate_mobile_money
            is_valid, err, normalized = validate_mobile_money(self.phone_number, "MTN MoMo", self.country_code)
            if not is_valid:
                raise ValueError(err)
            self.phone_number = normalized
            
        # Validate email if provided
        if self.email:
            from app.utils.validation import validate_paypal_email
            is_valid, err = validate_paypal_email(self.email)
            if not is_valid:
                raise ValueError(err)
                
        return self


class PaymentMethodResponse(BaseModel):
    id: int
    user_id: int
    payment_type: str
    provider: str
    nickname: Optional[str] = None
    is_default: bool
    is_verified: bool
    status: str
    created_at: datetime
    updated_at: datetime
    
    # Card details (optional)
    display_name: Optional[str] = None
    masked_card_number: Optional[str] = None
    expiry_month: Optional[int] = None
    expiry_year: Optional[int] = None
    billing_address: Optional[str] = None
    
    # Mobile money details (optional)
    account_name: Optional[str] = None
    phone_number: Optional[str] = None
    country_code: Optional[str] = None
    
    # PayPal / digital wallet details (optional)
    email: Optional[str] = None
    wallet_name: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def resolve_details(cls, data: Any) -> Any:
        if isinstance(data, dict):
            return data
            
        res = {
            "id": data.id,
            "user_id": data.user_id,
            "payment_type": data.payment_type,
            "provider": data.provider,
            "nickname": data.nickname,
            "is_default": data.is_default,
            "is_verified": data.is_verified,
            "status": data.status,
            "created_at": data.created_at,
            "updated_at": data.updated_at,
        }
        
        # Parse details
        import json
        details_dict = {}
        if data.details:
            try:
                details_dict = json.loads(data.details) if isinstance(data.details, str) else data.details
            except Exception:
                pass
                
        res.update(details_dict)
        return res

    class Config:
        from_attributes = True


# =====================================================================
# REVIEW SCHEMAS
# =====================================================================

class CustomerReviewCreate(BaseModel):
    review_type: str
    reference_id: int
    rating: int = Field(ge=1, le=5)
    comment: Optional[str] = None


class CustomerReviewResponse(BaseModel):
    review_id: int
    customer_id: int
    review_type: str
    reference_id: int
    rating: int
    comment: Optional[str] = None
    management_reply: Optional[str] = None
    is_published: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# =====================================================================
# ERROR RESPONSE SCHEMA
# =====================================================================

class ErrorResponse(BaseModel):
    detail: str
    status_code: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# =====================================================================
# PASSWORD RESET SCHEMAS
# =====================================================================

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordConfirm(BaseModel):
    token: str
    new_password: str


# =====================================================================
# HOTEL DETAILS SCHEMAS & STANDARD RESPONSE
# =====================================================================
import re
from typing import Generic, TypeVar

T = TypeVar("T")

class StandardResponse(BaseModel, Generic[T]):
    success: bool = True
    message: str = ""
    data: Optional[T] = None


class HotelDetailsResponse(BaseModel):
    id: int
    hotel_name: str
    description: Optional[str] = None
    phone_number: str
    alternative_phone_number: Optional[str] = None
    email: str
    website: Optional[str] = None
    physical_address: str
    city: str
    country: str
    postal_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    google_maps_pin: Optional[str] = None
    logo_url: Optional[str] = None
    cover_image_url: Optional[str] = None
    facebook_url: Optional[str] = None
    instagram_url: Optional[str] = None
    x_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    youtube_url: Optional[str] = None
    check_in_time: Optional[str] = None
    check_out_time: Optional[str] = None
    currency: str
    timezone: str
    is_active: bool
    created_at: datetime
    updated_at: datetime
    created_by: Optional[int] = None
    updated_by: Optional[int] = None

    class Config:
        from_attributes = True


class HotelDetailsCreate(BaseModel):
    hotel_name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    phone_number: str = Field(..., min_length=7, max_length=50)
    alternative_phone_number: Optional[str] = None
    email: EmailStr
    website: Optional[str] = None
    physical_address: str = Field(..., min_length=1)
    city: str = Field(..., min_length=1, max_length=100)
    country: str = Field(..., min_length=1, max_length=100)
    postal_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    google_maps_pin: Optional[str] = None
    facebook_url: Optional[str] = None
    instagram_url: Optional[str] = None
    x_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    youtube_url: Optional[str] = None
    check_in_time: Optional[str] = None
    check_out_time: Optional[str] = None
    currency: str = "USD"
    timezone: str = "UTC"
    is_active: bool = True

    @field_validator("latitude")
    @classmethod
    def validate_latitude(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and (v < -90 or v > 90):
            raise ValueError("Latitude must be between -90 and 90")
        return v

    @field_validator("longitude")
    @classmethod
    def validate_longitude(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and (v < -180 or v > 180):
            raise ValueError("Longitude must be between -180 and 180")
        return v

    @field_validator("website", "facebook_url", "instagram_url", "x_url", "linkedin_url", "youtube_url")
    @classmethod
    def validate_urls(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return v
        url_regex = re.compile(
            r'^https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        )
        if not url_regex.match(v):
            raise ValueError("Invalid URL format (must start with http:// or https://)")
        return v

    @field_validator("phone_number", "alternative_phone_number")
    @classmethod
    def validate_phones(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return v
        phone_regex = re.compile(r'^\+?[0-9\s\-\(\)\.]{7,25}$')
        if not phone_regex.match(v):
            raise ValueError("Invalid phone number format")
        return v


class HotelDetailsUpdate(BaseModel):
    hotel_name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    phone_number: Optional[str] = Field(None, min_length=7, max_length=50)
    alternative_phone_number: Optional[str] = None
    email: Optional[EmailStr] = None
    website: Optional[str] = None
    physical_address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    google_maps_pin: Optional[str] = None
    facebook_url: Optional[str] = None
    instagram_url: Optional[str] = None
    x_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    youtube_url: Optional[str] = None
    check_in_time: Optional[str] = None
    check_out_time: Optional[str] = None
    currency: Optional[str] = None
    timezone: Optional[str] = None
    is_active: Optional[bool] = None

    @field_validator("latitude")
    @classmethod
    def validate_latitude(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and (v < -90 or v > 90):
            raise ValueError("Latitude must be between -90 and 90")
        return v

    @field_validator("longitude")
    @classmethod
    def validate_longitude(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and (v < -180 or v > 180):
            raise ValueError("Longitude must be between -180 and 180")
        return v

    @field_validator("website", "facebook_url", "instagram_url", "x_url", "linkedin_url", "youtube_url")
    @classmethod
    def validate_urls(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return v
        url_regex = re.compile(
            r'^https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
        )
        if not url_regex.match(v):
            raise ValueError("Invalid URL format (must start with http:// or https://)")
        return v

    @field_validator("phone_number", "alternative_phone_number")
    @classmethod
    def validate_phones(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return v
        phone_regex = re.compile(r'^\+?[0-9\s\-\(\)\.]{7,25}$')
        if not phone_regex.match(v):
            raise ValueError("Invalid phone number format")
        return v


# =====================================================================
# NOTIFICATION SCHEMAS
# =====================================================================

from uuid import UUID

class NotificationEventResponse(BaseModel):
    id: UUID
    event_type: str
    reference_type: Optional[str] = None
    reference_id: Optional[str] = None
    triggered_by: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationResponse(BaseModel):
    id: UUID
    event_id: Optional[UUID] = None
    recipient_id: int
    title: str
    message: str
    notification_type: Optional[str] = None
    category: str
    priority: str
    channel: str
    status: str
    is_read: Optional[bool] = False
    read_at: Optional[datetime] = None
    action_url: Optional[str] = None
    reference_type: Optional[str] = None
    reference_id: Optional[str] = None
    email_sent: Optional[bool] = False
    email_sent_at: Optional[datetime] = None
    created_at: datetime
    expires_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class NotificationPreferenceResponse(BaseModel):
    id: UUID
    user_id: int
    email_enabled: Optional[bool] = True
    in_app_enabled: Optional[bool] = True
    reservation_notifications: Optional[bool] = True
    order_notifications: Optional[bool] = True
    payment_notifications: Optional[bool] = True
    security_notifications: Optional[bool] = True
    marketing_notifications: Optional[bool] = True
    system_notifications: Optional[bool] = True
    updated_at: datetime

    class Config:
        from_attributes = True


class NotificationPreferenceUpdate(BaseModel):
    email_enabled: Optional[bool] = None
    in_app_enabled: Optional[bool] = None
    reservation_notifications: Optional[bool] = None
    order_notifications: Optional[bool] = None
    payment_notifications: Optional[bool] = None
    security_notifications: Optional[bool] = None
    marketing_notifications: Optional[bool] = None
    system_notifications: Optional[bool] = None


class AdminSendNotificationRequest(BaseModel):
    recipient_id: int
    title: str
    message: str
    notification_type: Optional[str] = "AdminAlert"
    category: Optional[str] = "General"
    priority: Optional[str] = "NORMAL"
    channel: Optional[str] = "IN_APP"  # IN_APP, EMAIL
    action_url: Optional[str] = None


class AdminBroadcastNotificationRequest(BaseModel):
    recipient_group: str  # all_customers, all_managers, all_staff, all_admins, role_name
    role_name: Optional[str] = None
    title: str
    message: str
    category: Optional[str] = "General"
    priority: Optional[str] = "NORMAL"
    channel: Optional[str] = "IN_APP"  # IN_APP, EMAIL
    action_url: Optional[str] = None


class NotificationStatistics(BaseModel):
    total_count: int
    unread_count: int
    read_count: int
    archived_count: int
    deleted_count: int
    category_counts: dict

