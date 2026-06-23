"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, Field, EmailStr, field_validator
from datetime import datetime, date, time
from typing import Optional, List
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


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# =====================================================================
# USER SCHEMAS
# =====================================================================

class UserBase(BaseModel):
    full_name: str
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    nationality: Optional[str] = None
    address: Optional[str] = None
    user_type: Optional[str] = "Customer"


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    nationality: Optional[str] = None
    address: Optional[str] = None


class UserResponse(UserBase):
    user_id: int
    is_staff: bool
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    
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
    customer_type: str = "Registered"


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None


class CustomerResponse(CustomerBase):
    customer_id: int
    customer_code: str
    total_spent: Decimal
    visit_count: int
    loyalty_points: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


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
    event_date: date
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
    event_date: date
    start_time: time
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
