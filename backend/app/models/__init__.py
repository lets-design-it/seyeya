"""
SQLAlchemy models for SEYEYA backend
PostgreSQL database schema
"""
from __future__ import annotations
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Date, Time, Boolean, DECIMAL, Float,
    ForeignKey, UniqueConstraint, CheckConstraint, Index, Sequence, Enum, JSON
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime, date, time
import uuid

Base = declarative_base()


# =====================================================================
# SECTION 1: USER MANAGEMENT & DYNAMIC RBAC
# =====================================================================

class User(Base):
    """Simplified User model"""
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True)
    full_name = Column(String(200), nullable=False)
    email = Column(String(150), unique=True)
    phone_number = Column(String(20))
    password_hash = Column(String(500), nullable=False)
    is_staff = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    last_login_at = Column(DateTime)

    # Relationships
    roles = relationship("UserRole", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    password_resets = relationship("PasswordResetToken", back_populates="user", cascade="all, delete-orphan")
    device_tokens = relationship("DeviceToken", back_populates="user", cascade="all, delete-orphan")
    customer = relationship("Customer", back_populates="user", uselist=False)
    payment_methods = relationship("PaymentMethod", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="recipient", cascade="all, delete-orphan")
    notification_preferences = relationship("NotificationPreference", back_populates="user", uselist=False, cascade="all, delete-orphan")

    __table_args__ = (
        Index('ix_users_email', 'email'),
        Index('ix_users_phone_number', 'phone_number'),
    )


# `branch_id` removed from `User` per request.


class PermissionGroup(Base):
    """Permission Group model"""
    __tablename__ = "permission_groups"
    
    group_id = Column(Integer, primary_key=True)
    group_name = Column(String(100), nullable=False, unique=True)
    
    # Relationships
    permissions = relationship("Permission", back_populates="group", cascade="all, delete-orphan")


class Permission(Base):
    """Permission model"""
    __tablename__ = "permissions"
    
    permission_id = Column(Integer, primary_key=True)
    group_id = Column(Integer, ForeignKey("permission_groups.group_id", ondelete="CASCADE"), nullable=True)
    permission_key = Column(String(100), nullable=False, unique=True)
    display_name = Column(String(150), nullable=False)
    description = Column(String(300))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    group = relationship("PermissionGroup", back_populates="permissions")
    roles = relationship("RolePermission", back_populates="permission", cascade="all, delete-orphan")


class Role(Base):
    """Role model"""
    __tablename__ = "roles"
    
    role_id = Column(Integer, primary_key=True)
    role_name = Column(String(100), nullable=False, unique=True)
    description = Column(String(300))
    parent_role_id = Column(Integer, ForeignKey("roles.role_id"))
    is_active = Column(Boolean, default=True)
    is_system_role = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    permissions = relationship("RolePermission", back_populates="role", cascade="all, delete-orphan")
    users = relationship("UserRole", back_populates="role", cascade="all, delete-orphan")


class RolePermission(Base):
    """Role-Permission association"""
    __tablename__ = "role_permissions"
    
    role_permission_id = Column(Integer, primary_key=True)
    role_id = Column(Integer, ForeignKey("roles.role_id", ondelete="CASCADE"), nullable=False)
    permission_id = Column(Integer, ForeignKey("permissions.permission_id", ondelete="CASCADE"), nullable=False)
    granted_at = Column(DateTime, default=datetime.utcnow)
    granted_by = Column(Integer, ForeignKey("users.user_id"))
    
    # Relationships
    role = relationship("Role", back_populates="permissions")
    permission = relationship("Permission", back_populates="roles")
    
    __table_args__ = (
        UniqueConstraint('role_id', 'permission_id', name='uq_role_permission'),
    )


class UserRole(Base):
    """User-Role association"""
    __tablename__ = "user_roles"
    
    user_role_id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.role_id", ondelete="CASCADE"), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    assigned_by = Column(Integer)
    expires_at = Column(DateTime)
    
    # Relationships
    user = relationship("User", back_populates="roles", foreign_keys=[user_id])
    role = relationship("Role", back_populates="users")
    
    __table_args__ = (
        UniqueConstraint('user_id', 'role_id', name='uq_user_role'),
    )


class UserSession(Base):
    """User session management"""
    __tablename__ = "user_sessions"
    
    session_id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    refresh_token = Column(String(500), nullable=False, unique=True)
    device_info = Column(String(300))
    ip_address = Column(String(50))
    user_agent = Column(String(500))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)
    revoked_at = Column(DateTime)
    
    # Relationships
    user = relationship("User", back_populates="sessions")


class PasswordResetToken(Base):
    """Password reset tokens"""
    __tablename__ = "password_reset_tokens"
    
    token_id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    token = Column(String(500), nullable=False, unique=True)
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="password_resets")


class DeviceToken(Base):
    """Device tokens for push notifications"""
    __tablename__ = "device_tokens"
    
    device_token_id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    token = Column(String(500), nullable=False)
    platform = Column(String(20))  # ios | android | web
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="device_tokens")
    
    __table_args__ = (
        UniqueConstraint('user_id', 'token', name='uq_user_device_token'),
    )


# =====================================================================
# SECTION 2: CUSTOMERS
# =====================================================================

class Customer(Base):
    """Simplified Customer model"""
    __tablename__ = "customers"

    customer_id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    customer_code = Column(String(100), nullable=False, unique=True)
    full_name = Column(String(200), nullable=False)
    nin = Column(String(20))
    passport_number = Column(String(30))
    phone_number = Column(String(20))
    customer_type = Column(String(20), default="Registered")
    company_name = Column(String(200), nullable=True)
    email = Column(String(150), unique=False)
    gender = Column(String(20))
    date_of_birth = Column(Date)
    nationality = Column(String(100))
    address = Column(String(300))
    is_active = Column(Boolean, default=True)
    is_child = Column(Boolean, default=False)
    parent_id = Column(Integer, ForeignKey("customers.customer_id"), nullable=True)
    is_contract_client = Column(Boolean, default=False)
    total_spent = Column(DECIMAL(18, 2), default=0)
    loyalty_points = Column(Integer, default=0)
    visit_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="customer", foreign_keys=[user_id])
    orders = relationship("RestaurantOrder", back_populates="customer", cascade="all, delete-orphan")
    reservations = relationship("AccommodationReservation", back_populates="customer", cascade="all, delete-orphan")
    conference_reservations = relationship("ConferenceReservation", back_populates="customer", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="customer", cascade="all, delete-orphan")
    reviews = relationship("CustomerReview", back_populates="customer", cascade="all, delete-orphan")

    @property
    def phone(self) -> Optional[str]:
        return self.phone_number

    @phone.setter
    def phone(self, value: Optional[str]):
        self.phone_number = value

    @property
    def id_number(self) -> Optional[str]:
        return self.passport_number or self.nin

    @id_number.setter
    def id_number(self, value: Optional[str]):
        self.passport_number = value

    __table_args__ = (
        Index('ix_customers_email', 'email'),
        Index('ix_customers_phone_number', 'phone_number'),
        Index('ix_customers_nin', 'nin'),
        Index('ix_customers_passport_number', 'passport_number'),
    )


# =====================================================================
# SECTION 3: RESTAURANT MODULE
# =====================================================================

class MenuCategory(Base):
    """Menu category model"""
    __tablename__ = "menu_categories"
    
    category_id = Column(Integer, primary_key=True)
    category_name = Column(String(150), nullable=False)
    description = Column(String(300))
    image_url = Column(String(500))
    sort_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    items = relationship("MenuItem", back_populates="category", cascade="all, delete-orphan")


class MenuItem(Base):
    """Menu item model"""
    __tablename__ = "menu_items"
    
    menu_item_id = Column(Integer, primary_key=True)
    category_id = Column(Integer, ForeignKey("menu_categories.category_id"), nullable=False)
    item_name = Column(String(200), nullable=False)
    description = Column(String(500))
    price = Column(DECIMAL(10, 2), nullable=False)
    quantity = Column(Integer, default=0)
    image_url = Column(String(500))
    allergen_info = Column(String(500))
    preparation_time = Column(Integer)  # minutes
    is_vat_inclusive = Column(Boolean, default=True)
    is_available = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    category = relationship("MenuCategory", back_populates="items")
    order_items = relationship("OrderItem", back_populates="menu_item", cascade="all, delete-orphan")
    extras = relationship("MenuExtra", back_populates="menu_item", cascade="all, delete-orphan")
    choices = relationship("MenuChoice", back_populates="menu_item", cascade="all, delete-orphan")
    accompaniments = relationship("MenuAccompaniment", back_populates="menu_item", cascade="all, delete-orphan")

    @property
    def name(self):
        return self.item_name


class MenuExtra(Base):
    """Menu extra/addon model"""
    __tablename__ = "menu_extras"
    
    extra_id = Column(Integer, primary_key=True)
    extra_name = Column(String(100), nullable=False)
    price = Column(DECIMAL(10, 2), default=0)
    image_url = Column(String(500))
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    menu_item_id = Column(Integer, ForeignKey("menu_items.menu_item_id"), nullable=False)
    
    # Relationships
    order_extras = relationship("OrderItemExtra", back_populates="extra", cascade="all, delete-orphan")
    menu_item = relationship("MenuItem", back_populates="extras")


class MenuChoice(Base):
    """Menu choice/option model"""
    __tablename__ = "menu_choices"
    
    choice_id = Column(Integer, primary_key=True)
    choice_name = Column(String(100), nullable=False)
    price = Column(DECIMAL(10, 2), nullable=True)
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    menu_item_id = Column(Integer, ForeignKey("menu_items.menu_item_id"), nullable=False)
    
    # Relationships
    menu_item = relationship("MenuItem", back_populates="choices")
    order_items = relationship("OrderItem", back_populates="choice")

    @property
    def name(self):
        return self.choice_name


class MenuAccompaniment(Base):
    """Menu accompaniment model"""
    __tablename__ = "menu_accompaniments"
    
    accompaniment_id = Column(Integer, primary_key=True)
    accompaniment_name = Column(String(100), nullable=False)
    price = Column(DECIMAL(10, 2), nullable=True)
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    menu_item_id = Column(Integer, ForeignKey("menu_items.menu_item_id"), nullable=False)
    
    # Relationships
    menu_item = relationship("MenuItem", back_populates="accompaniments")
    order_items = relationship("OrderItem", back_populates="accompaniment")

    @property
    def name(self):
        return self.accompaniment_name


class RestaurantOrder(Base):
    """Restaurant order model"""
    __tablename__ = "restaurant_orders"
    
    order_id = Column(Integer, primary_key=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id"))
    order_number = Column(String(20), nullable=False, unique=True)
    seating_location = Column(String(20))  # Indoor | Garden
    delivery_option = Column(String(20))  # Premises | Remote
    delivery_address = Column(String(300))
    delivery_lat = Column(DECIMAL(9, 6))
    delivery_lng = Column(DECIMAL(9, 6))
    delivery_distance_km = Column(DECIMAL(10, 2), default=0)
    price_per_km_used = Column(DECIMAL(10, 2), default=0)
    delivery_charge = Column(DECIMAL(10, 2), default=0)
    preferred_time = Column(DateTime)
    special_instr = Column(String(500))
    allergy_info = Column(String(500))
    sub_total = Column(DECIMAL(10, 2), nullable=False, default=0)
    total_amount = Column(DECIMAL(10, 2), nullable=False, default=0)
    amount_paid = Column(DECIMAL(10, 2), default=0)
    balance_due = Column(DECIMAL(10, 2), default=0)
    tax_amount = Column(DECIMAL(10, 2), default=0)
    order_status = Column(String(20), default="Pending")
    # Pending | Confirmed | Preparing | Ready | Delivered | Cancelled
    payment_status = Column(String(20), default="Pending")
    # Pending | Partial | Paid | Failed | Refunded
    assigned_waiter = Column(Integer, ForeignKey("users.user_id"))
    tracking_number = Column(String(50), unique=True)
    cancelled_at = Column(DateTime)
    cancel_reason = Column(String(300))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    customer = relationship("Customer", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    status_history = relationship("OrderStatusHistory", back_populates="order", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('ix_restaurant_orders_customer_id', 'customer_id'),
        Index('ix_restaurant_orders_order_status', 'order_status'),
        Index('ix_restaurant_orders_created_at', 'created_at'),
    )


class OrderItem(Base):
    """Order line item model"""
    __tablename__ = "order_items"
    
    order_item_id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("restaurant_orders.order_id", ondelete="CASCADE"), nullable=False)
    menu_item_id = Column(Integer, ForeignKey("menu_items.menu_item_id"), nullable=False)
    choice_id = Column(Integer, ForeignKey("menu_choices.choice_id"), nullable=True)
    accompaniment_id = Column(Integer, ForeignKey("menu_accompaniments.accompaniment_id"), nullable=True)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(DECIMAL(10, 2), nullable=False)
    total_price = Column(DECIMAL(10, 2), nullable=False)
    special_notes = Column(String(300))
    
    # Relationships
    order = relationship("RestaurantOrder", back_populates="items")
    menu_item = relationship("MenuItem", back_populates="order_items")
    choice = relationship("MenuChoice", back_populates="order_items")
    accompaniment = relationship("MenuAccompaniment", back_populates="order_items")
    extras = relationship("OrderItemExtra", back_populates="order_item", cascade="all, delete-orphan")


class OrderItemExtra(Base):
    """Order item extra/addon model"""
    __tablename__ = "order_item_extras"
    
    order_item_extra_id = Column(Integer, primary_key=True)
    order_item_id = Column(Integer, ForeignKey("order_items.order_item_id", ondelete="CASCADE"), nullable=False)
    extra_id = Column(Integer, ForeignKey("menu_extras.extra_id"), nullable=False)
    quantity = Column(Integer, default=1)
    unit_price = Column(DECIMAL(10, 2), nullable=False)
    total_price = Column(DECIMAL(10, 2), nullable=False)
    
    # Relationships
    order_item = relationship("OrderItem", back_populates="extras")
    extra = relationship("MenuExtra", back_populates="order_extras")


class OrderStatusHistory(Base):
    """Order status change history"""
    __tablename__ = "order_status_history"
    
    status_hist_id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey("restaurant_orders.order_id"), nullable=False)
    old_status = Column(String(20))
    new_status = Column(String(20), nullable=False)
    changed_by = Column(Integer, ForeignKey("users.user_id"))
    note = Column(String(300))
    changed_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    order = relationship("RestaurantOrder", back_populates="status_history")


class DeliveryPricing(Base):
    """Delivery pricing configuration"""
    __tablename__ = "delivery_pricing"
    
    pricing_id = Column(Integer, primary_key=True)
    restaurant_lat = Column(DECIMAL(9, 6), nullable=False)
    restaurant_lng = Column(DECIMAL(9, 6), nullable=False)
    price_per_km = Column(DECIMAL(10, 2), nullable=False)
    minimum_delivery_fee = Column(DECIMAL(10, 2))
    maximum_delivery_distance_km = Column(DECIMAL(10, 2))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index('ix_delivery_pricing_is_active', 'is_active'),
    )


# =====================================================================
# SECTION 4: ACCOMMODATION MODULE
# =====================================================================

class RoomCategory(Base):
    """Room category model"""
    __tablename__ = "room_categories"
    
    room_category_id = Column(Integer, primary_key=True)
    category_name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    base_rate = Column(DECIMAL(10, 2), nullable=False)
    room_size = Column(Float, nullable=True)
    room_size_unit = Column(String(20), default="m²")
    max_occupancy = Column(Integer, default=2)
    is_vat_inclusive = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    rooms = relationship("Room", back_populates="category", cascade="all, delete-orphan")
    photos = relationship("RoomCategoryPhoto", back_populates="category", cascade="all, delete-orphan")
    beds = relationship("RoomBed", back_populates="category", cascade="all, delete-orphan")
    views = relationship("RoomView", back_populates="category", cascade="all, delete-orphan")
    bathroom_features = relationship("RoomBathroomFeature", back_populates="category", cascade="all, delete-orphan")
    room_facilities = relationship("RoomFacility", back_populates="category", cascade="all, delete-orphan")
    images = relationship("RoomImage", back_populates="category", cascade="all, delete-orphan")
    amenity_assignments = relationship("RoomAmenity", back_populates="category", cascade="all, delete-orphan")
    available_rates = relationship("RoomRatePlan", back_populates="category", cascade="all, delete-orphan")
    policies = relationship("RoomPolicy", back_populates="category", cascade="all, delete-orphan")


class RoomCategoryPhoto(Base):
    """Room category photo model"""
    __tablename__ = "room_category_photos"
    
    photo_id = Column(Integer, primary_key=True)
    room_category_id = Column(Integer, ForeignKey("room_categories.room_category_id", ondelete="CASCADE"), nullable=False)
    photo_url = Column(String(500), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    category = relationship("RoomCategory", back_populates="photos")


class Room(Base):
    """Room model"""
    __tablename__ = "rooms"
    
    room_id = Column(Integer, primary_key=True)
    room_category_id = Column(Integer, ForeignKey("room_categories.room_category_id"), nullable=False)
    room_number = Column(String(20), nullable=False, unique=True)
    room_name = Column(String(150), nullable=True)
    building = Column(String(100), nullable=True)
    wing = Column(String(100), nullable=True)
    floor = Column(String(50), nullable=True)
    room_status = Column(String(30), default="Available")
    # Available | Reserved | Occupied | Maintenance | Out of Service
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    category = relationship("RoomCategory", back_populates="rooms")
    reservations = relationship("AccommodationReservation", back_populates="room", cascade="all, delete-orphan")


class RoomBed(Base):
    """Room bed model"""
    __tablename__ = "room_beds"

    id = Column(Integer, primary_key=True)
    room_category_id = Column(Integer, ForeignKey("room_categories.room_category_id", ondelete="CASCADE"), nullable=False)
    bed_type = Column(String(100), nullable=False)
    quantity = Column(Integer, default=1)

    category = relationship("RoomCategory", back_populates="beds")


class RoomView(Base):
    """Room view model"""
    __tablename__ = "room_views"

    id = Column(Integer, primary_key=True)
    room_category_id = Column(Integer, ForeignKey("room_categories.room_category_id", ondelete="CASCADE"), nullable=False)
    view_name = Column(String(100), nullable=False)

    category = relationship("RoomCategory", back_populates="views")


class RoomBathroomFeature(Base):
    """Room bathroom feature model"""
    __tablename__ = "room_bathroom_features"

    id = Column(Integer, primary_key=True)
    room_category_id = Column(Integer, ForeignKey("room_categories.room_category_id", ondelete="CASCADE"), nullable=False)
    feature_name = Column(String(100), nullable=False)

    category = relationship("RoomCategory", back_populates="bathroom_features")


class RoomFacility(Base):
    """Room facility model"""
    __tablename__ = "room_facilities"

    id = Column(Integer, primary_key=True)
    room_category_id = Column(Integer, ForeignKey("room_categories.room_category_id", ondelete="CASCADE"), nullable=False)
    facility_name = Column(String(100), nullable=False)

    category = relationship("RoomCategory", back_populates="room_facilities")


class RoomImage(Base):
    """Room image model (renamed from room_photos)"""
    __tablename__ = "room_images"
    
    id = Column(Integer, primary_key=True)
    room_category_id = Column(Integer, ForeignKey("room_categories.room_category_id", ondelete="CASCADE"), nullable=False)
    image_url = Column(String(500), nullable=False)
    display_order = Column(Integer, default=0)
    is_primary = Column(Boolean, default=False)
    caption = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    category = relationship("RoomCategory", back_populates="images")


# Alias for backward compatibility if code imports RoomPhoto
RoomPhoto = RoomImage


class AccommodationReservation(Base):
    """Accommodation reservation model"""
    __tablename__ = "accommodation_reservations"
    
    reservation_id = Column(Integer, primary_key=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.room_id"), nullable=True)
    room_category_id = Column(Integer, ForeignKey("room_categories.room_category_id"), nullable=True)
    reservation_code = Column(String(20), nullable=False, unique=True)
    check_in_date = Column(Date, nullable=False)
    check_out_date = Column(Date, nullable=False)
    num_nights = Column(Integer, nullable=False)
    rate_per_night = Column(DECIMAL(10, 2), nullable=False)
    total_amount = Column(DECIMAL(10, 2), nullable=False)
    amount_paid = Column(DECIMAL(10, 2), default=0)
    balance_due = Column(DECIMAL(10, 2), default=0)
    reservation_status = Column(String(20), default="Pending")
    # Pending | Confirmed | CheckedIn | CheckedOut | Cancelled | NoShow
    payment_status = Column(String(20), default="Pending")
    is_contract_booking = Column(Boolean, default=False)
    num_adults = Column(Integer, default=1)
    num_children = Column(Integer, default=0)
    special_requests = Column(String(500))
    check_in_actual = Column(DateTime)
    check_out_actual = Column(DateTime)
    checked_in_by = Column(Integer, ForeignKey("users.user_id"))
    checked_out_by = Column(Integer, ForeignKey("users.user_id"))
    cancelled_at = Column(DateTime)
    cancel_reason = Column(String(300))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    customer = relationship("Customer", back_populates="reservations")
    room = relationship("Room", back_populates="reservations")
    category = relationship("RoomCategory")
    guest_details = relationship("GuestCheckInDetail", back_populates="reservation", cascade="all, delete-orphan")
    
    @property
    def category_id(self) -> Optional[int]:
        return self.room_category_id

    @category_id.setter
    def category_id(self, value: Optional[int]):
        self.room_category_id = value

    
    __table_args__ = (
        Index('ix_accommodation_reservations_customer_id', 'customer_id'),
        Index('ix_accommodation_reservations_room_id', 'room_id'),
        Index('ix_accommodation_reservations_check_in_date', 'check_in_date'),
        Index('ix_accommodation_reservations_check_out_date', 'check_out_date'),
        Index('ix_accommodation_reservations_status', 'reservation_status'),
    )


class GuestCheckInDetail(Base):
    """Guest check-in details"""
    __tablename__ = "guest_checkin_details"
    
    checkin_detail_id = Column(Integer, primary_key=True)
    reservation_id = Column(Integer, ForeignKey("accommodation_reservations.reservation_id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.customer_id"), nullable=True)
    guest_name = Column(String(200), nullable=False)
    nationality = Column(String(100))
    phone_number = Column(String(20))
    next_of_kin = Column(String(200))
    next_of_kin_phone = Column(String(20))
    passport_number = Column(String(30))
    nin = Column(String(20))
    is_primary = Column(Boolean, default=False)
    is_child = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    reservation = relationship("AccommodationReservation", back_populates="guest_details")


# =====================================================================
# SECTION 5: CONFERENCE HALL MODULE
# =====================================================================

class ConferenceHall(Base):
    """Conference hall model"""
    __tablename__ = "conference_halls"
    
    hall_id = Column(Integer, primary_key=True)
    hall_name = Column(String(150), nullable=False)
    capacity = Column(Integer, nullable=False)
    standard_price = Column(DECIMAL(10, 2))
    hourly_rate = Column(DECIMAL(10, 2))
    full_day_rate = Column(DECIMAL(10, 2))
    half_day_rate = Column(DECIMAL(10, 2))
    description = Column(String(500))
<<<<<<< HEAD
    amenities = Column(String(500))
    is_vat_inclusive = Column(Boolean, default=True)
=======
>>>>>>> main
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    photos = relationship("HallPhoto", back_populates="hall", cascade="all, delete-orphan")
    reservations = relationship("ConferenceReservation", back_populates="hall", cascade="all, delete-orphan")
    facilities = relationship("ConferenceHallFacility", back_populates="hall", cascade="all, delete-orphan")


class HallPhoto(Base):
    """Conference hall photo model"""
    __tablename__ = "hall_photos"
    
    photo_id = Column(Integer, primary_key=True)
    hall_id = Column(Integer, ForeignKey("conference_halls.hall_id", ondelete="CASCADE"), nullable=False)
    photo_url = Column(String(500), nullable=False)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    hall = relationship("ConferenceHall", back_populates="photos")


class ConferenceResource(Base):
    """Conference resource/equipment model"""
    __tablename__ = "conference_resources"
    
    resource_id = Column(Integer, primary_key=True)
    resource_name = Column(String(100), nullable=False)
    daily_rate = Column(DECIMAL(10, 2), default=0)
    quantity = Column(Integer, default=1)
    is_available = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    bookings = relationship("ConferenceResourceBooking", back_populates="resource", cascade="all, delete-orphan")


class ConferenceMealPackage(Base):
    """Conference meal package model"""
    __tablename__ = "conference_meal_packages"
    
    package_id = Column(Integer, primary_key=True)
    package_name = Column(String(150), nullable=False)
    description = Column(String(500))
    price_per_person = Column(DECIMAL(10, 2), nullable=False)
    min_participants = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    bookings = relationship("ConferenceMealBooking", back_populates="package", cascade="all, delete-orphan")


class ConferenceReservation(Base):
    """Conference reservation model"""
    __tablename__ = "conference_reservations"
    
    conference_res_id = Column(Integer, primary_key=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id"), nullable=False)
    hall_id = Column(Integer, ForeignKey("conference_halls.hall_id"), nullable=False)
    reservation_code = Column(String(20), nullable=False, unique=True)
    event_name = Column(String(200))
    event_start_date = Column(Date, nullable=False)
    event_end_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    num_participants = Column(Integer)
    booking_type = Column(String(20))  # Hourly | HalfDay | FullDay
    payment_responsibility = Column(String(50), default="Individual") # Individual | Organisation
    hall_unit_price = Column(DECIMAL(10, 2), default=0)
    hall_cost = Column(DECIMAL(10, 2), default=0)
    resource_cost = Column(DECIMAL(10, 2), default=0)
    meal_cost = Column(DECIMAL(10, 2), default=0)
    subtotal = Column(DECIMAL(10, 2), nullable=False, default=0)
    total_amount = Column(DECIMAL(10, 2), nullable=False, default=0)
    amount_paid = Column(DECIMAL(10, 2), default=0)
    balance_due = Column(DECIMAL(10, 2), default=0)
    reservation_status = Column(String(20), default="Pending")
    payment_status = Column(String(20), default="Pending")
    special_requests = Column(String(500))
    cancelled_at = Column(DateTime)
    cancel_reason = Column(String(300))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    customer = relationship("Customer", back_populates="conference_reservations")
    hall = relationship("ConferenceHall", back_populates="reservations")
    resource_bookings = relationship("ConferenceResourceBooking", back_populates="conference_reservation", cascade="all, delete-orphan")
    meal_bookings = relationship("ConferenceMealBooking", back_populates="conference_reservation", cascade="all, delete-orphan")
    facility_bookings = relationship("ConferenceBookingFacility", back_populates="conference_reservation", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('ix_conference_reservations_customer_id', 'customer_id'),
        Index('ix_conference_reservations_hall_id', 'hall_id'),
        Index('ix_conference_reservations_event_start_date', 'event_start_date'),
        Index('ix_conference_reservations_event_end_date', 'event_end_date'),
    )


class ConferenceResourceBooking(Base):
    """Conference resource booking model"""
    __tablename__ = "conference_resource_bookings"
    
    resource_booking_id = Column(Integer, primary_key=True)
    conference_res_id = Column(Integer, ForeignKey("conference_reservations.conference_res_id", ondelete="CASCADE"), nullable=False)
    resource_id = Column(Integer, ForeignKey("conference_resources.resource_id"), nullable=False)
    quantity = Column(Integer, default=1)
    rate = Column(DECIMAL(10, 2))
    total_cost = Column(DECIMAL(10, 2))
    
    # Relationships
    conference_reservation = relationship("ConferenceReservation", back_populates="resource_bookings")
    resource = relationship("ConferenceResource", back_populates="bookings")


class ConferenceMealBooking(Base):
    """Conference meal booking model"""
    __tablename__ = "conference_meal_bookings"
    
    meal_booking_id = Column(Integer, primary_key=True)
    conference_res_id = Column(Integer, ForeignKey("conference_reservations.conference_res_id", ondelete="CASCADE"), nullable=False)
    package_id = Column(Integer, ForeignKey("conference_meal_packages.package_id"), nullable=False)
    num_participants = Column(Integer, nullable=False)
    price_per_person = Column(DECIMAL(10, 2), nullable=False)
    total_cost = Column(DECIMAL(10, 2), nullable=False)
    
    # Relationships
    conference_reservation = relationship("ConferenceReservation", back_populates="meal_bookings")
    package = relationship("ConferenceMealPackage", back_populates="bookings")


class ConferenceEvent(Base):
    """Conference / Lodge Event model"""
    __tablename__ = "conference_events"
    
    event_id = Column(Integer, primary_key=True)
    event_name = Column(String(200), nullable=False)
    description = Column(String(1000), nullable=True)
    photo_url = Column(String(500), nullable=True)
    price = Column(DECIMAL(10, 2), nullable=False, default=0.00)
    discount = Column(DECIMAL(10, 2), nullable=False, default=0.00)
    event_date = Column(DateTime, nullable=True)
    location = Column(String(200), nullable=True)
    capacity = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        Index('ix_conference_events_is_active', 'is_active'),
    )


class ConferenceFacility(Base):
    """Conference / Event Facility model (e.g. Catering, PA System, Projector)"""
    __tablename__ = "conference_facilities"
    
    facility_id = Column(Integer, primary_key=True)
    name = Column(String(150), nullable=False, unique=True)
    category = Column(String(100), default="General Services")
    description = Column(String(500), nullable=True)
    price = Column(DECIMAL(10, 2), nullable=False, default=0.00)
    pricing_type = Column(String(20), default="FIXED")
    icon_name = Column(String(50), default="Sparkles")
    is_active = Column(Boolean, default=True)
    price = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    hall_associations = relationship("ConferenceHallFacility", back_populates="facility", cascade="all, delete-orphan")
    booking_line_items = relationship("ConferenceBookingFacility", back_populates="facility", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('ix_conference_facilities_is_active', 'is_active'),
    )


class ConferenceHallFacility(Base):
    """Junction table for Conference Halls and Facilities"""
    __tablename__ = "conference_hall_facilities"
    
    id = Column(Integer, primary_key=True)
    hall_id = Column(Integer, ForeignKey("conference_halls.hall_id", ondelete="CASCADE"), nullable=False)
    facility_id = Column(Integer, ForeignKey("conference_facilities.facility_id", ondelete="CASCADE"), nullable=False)
    status = Column(String(20), default="Available")
    
    # Relationships
    hall = relationship("ConferenceHall", back_populates="facilities")
    facility = relationship("ConferenceFacility", back_populates="hall_associations")
    
    __table_args__ = (
        UniqueConstraint('hall_id', 'facility_id', name='uq_hall_facility'),
    )


class ConferenceBookingFacility(Base):
    """Line items for facilities booked in a conference reservation"""
    __tablename__ = "conference_booking_facilities"
    
    id = Column(Integer, primary_key=True)
    booking_id = Column(Integer, ForeignKey("conference_reservations.conference_res_id", ondelete="CASCADE"), nullable=False)
    facility_id = Column(Integer, ForeignKey("conference_facilities.facility_id"), nullable=False)
    quantity = Column(Integer, default=1)
    unit_price = Column(DECIMAL(10, 2), nullable=False)
    total_price = Column(DECIMAL(10, 2), nullable=False)
    
    # Relationships
    conference_reservation = relationship("ConferenceReservation", back_populates="facility_bookings")
    facility = relationship("ConferenceFacility", back_populates="booking_line_items")


# =====================================================================
# SECTION 6: PAYMENT MANAGEMENT
# =====================================================================

class Payment(Base):
    """Payment model"""
    __tablename__ = "payments"
    
    payment_id = Column(Integer, primary_key=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id"))
    payment_type = Column(String(30), nullable=False)
    # RestaurantOrder | AccommodationReservation | ConferenceReservation
    reference_type = Column(String(30), default="Unknown")
    reference_id = Column(Integer, nullable=False)
    payment_method = Column(String(30), nullable=False)
    # MobileMoney | VISA | FlexPay | BankTransfer
    transaction_id = Column(String(100))
    payment_reference = Column(String(100), nullable=False, unique=True)
    amount_paid = Column(DECIMAL(10, 2), nullable=False)
    currency = Column(String(5), default="UGX")
    payment_status = Column(String(20), default="Pending")
    # Pending | Partial | Paid | Failed | Refunded
    payment_date = Column(DateTime, default=datetime.utcnow)
    is_deposit = Column(Boolean, default=False)
    deposit_percent = Column(DECIMAL(5, 2))
    bank_slip_url = Column(String(500))
    verified_by = Column(Integer, ForeignKey("users.user_id"))
    verified_at = Column(DateTime)
    verification_note = Column(String(300))
    gateway_response = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    customer = relationship("Customer", back_populates="payments")
    refunds = relationship("PaymentRefund", back_populates="payment", cascade="all, delete-orphan")
    
    __table_args__ = (
        Index('ix_payments_customer_id', 'customer_id'),
        Index('ix_payments_reference_id', 'reference_id'),
        Index('ix_payments_payment_date', 'payment_date'),
        Index('ix_payments_payment_status', 'payment_status'),
    )


class PaymentRefund(Base):
    """Payment refund model"""
    __tablename__ = "payment_refunds"
    
    refund_id = Column(Integer, primary_key=True)
    payment_id = Column(Integer, ForeignKey("payments.payment_id"), nullable=False)
    refund_amount = Column(DECIMAL(10, 2), nullable=False)
    reason = Column(String(300))
    processed_by = Column(Integer, ForeignKey("users.user_id"))
    processed_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(20), default="Pending")
    
    # Relationships
    payment = relationship("Payment", back_populates="refunds")


class PaymentMethod(Base):
    """PaymentMethod model for secure card, mobile money, and digital wallet info"""
    __tablename__ = "payment_methods"
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    payment_type = Column(String(50), nullable=False)  # card | mobile_money | digital_wallet
    provider = Column(String(50), nullable=False)      # Visa, Mastercard, MTN MoMo, Airtel Money, PayPal, Apple Pay, Google Pay
    nickname = Column(String(100))
    is_default = Column(Boolean, default=False, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    status = Column(String(20), default="active", nullable=False)  # active | inactive
    
    # Store masked safe details for quick retrieval as a JSON dictionary
    details = Column(JSON, nullable=False, default=dict)
    
    # Store encrypted sensitive details (full card number, auth tokens, device secrets, wallet references, etc.)
    encrypted_details = Column(Text, nullable=False)
    
    # Secure SHA-256 fingerprint hash of the unique identifier to prevent duplicates
    unique_hash = Column(String(64), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="payment_methods")
    
    __table_args__ = (
        Index('ix_payment_methods_user_id', 'user_id'),
        Index('ix_payment_methods_payment_type', 'payment_type'),
        Index('ix_payment_methods_unique_hash', 'unique_hash'),
    )


# =====================================================================
# SECTION 7: NOTIFICATIONS
# =====================================================================

class NotificationEvent(Base):
    """Notification event tracker"""
    __tablename__ = "notification_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_type = Column(String(100), nullable=False)
    reference_type = Column(String(50))
    reference_id = Column(String(50))
    triggered_by = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    triggering_user = relationship("User", foreign_keys=[triggered_by])


class Notification(Base):
    """Notification model"""
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), ForeignKey("notification_events.id", ondelete="SET NULL"), nullable=True)
    recipient_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    title = Column(String(300), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50))
    category = Column(String(50), nullable=False)  # Reservation, Orders, Payments, Account, Security, Promotions, Reports, Administration, System, General
    priority = Column(String(20), default="NORMAL")  # LOW, NORMAL, HIGH, URGENT
    channel = Column(String(20), nullable=False)  # IN_APP, EMAIL
    status = Column(String(20), default="UNREAD")  # UNREAD, READ, ARCHIVED, DELETED
    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime, nullable=True)
    action_url = Column(String(300), nullable=True)
    reference_type = Column(String(50), nullable=True)
    reference_id = Column(String(50), nullable=True)
    email_sent = Column(Boolean, default=False)
    email_sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)

    # Relationships
    event = relationship("NotificationEvent")
    recipient = relationship("User", back_populates="notifications", foreign_keys=[recipient_id])

    __table_args__ = (
        Index('ix_notifications_recipient_id', 'recipient_id'),
        Index('ix_notifications_event_id', 'event_id'),
        Index('ix_notifications_status', 'status'),
        Index('ix_notifications_is_read', 'is_read'),
        Index('ix_notifications_created_at', 'created_at'),
    )


class EmailQueue(Base):
    """Email sending queue"""
    __tablename__ = "email_queue"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    notification_id = Column(UUID(as_uuid=True), ForeignKey("notifications.id", ondelete="SET NULL"), nullable=True)
    recipient_email = Column(String(255), nullable=False)
    recipient_name = Column(String(255), nullable=True)
    subject = Column(String(300), nullable=False)
    body = Column(Text, nullable=False)
    status = Column(String(20), default="Pending")  # Pending, Processing, Sent, Failed
    retry_count = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    notification = relationship("Notification")


class NotificationPreference(Base):
    """User notification preferences"""
    __tablename__ = "notification_preferences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, unique=True)
    email_enabled = Column(Boolean, default=True)
    in_app_enabled = Column(Boolean, default=True)
    reservation_notifications = Column(Boolean, default=True)
    order_notifications = Column(Boolean, default=True)
    payment_notifications = Column(Boolean, default=True)
    security_notifications = Column(Boolean, default=True)
    marketing_notifications = Column(Boolean, default=True)
    system_notifications = Column(Boolean, default=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="notification_preferences", foreign_keys=[user_id])


# =====================================================================
# SECTION 8: AUDIT & SECURITY
# =====================================================================

class AuditLog(Base):
    """Audit log model"""
    __tablename__ = "audit_logs"
    
    audit_id = Column(Integer, primary_key=True)
    table_name = Column(String(100), nullable=False)
    record_id = Column(Integer)
    action = Column(String(10), nullable=False)  # INSERT | UPDATE | DELETE
    old_values = Column(Text)  # JSON
    new_values = Column(Text)  # JSON
    changed_by = Column(Integer, ForeignKey("users.user_id"))
    ip_address = Column(String(50))
    changed_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        Index('ix_audit_logs_table_name', 'table_name', 'record_id'),
        Index('ix_audit_logs_changed_at', 'changed_at'),
    )


class ActivityLog(Base):
    """Activity log model"""
    __tablename__ = "activity_logs"
    
    activity_id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    activity_type = Column(String(100), nullable=False)
    description = Column(String(500))
    reference_table = Column(String(100))
    reference_id = Column(Integer)
    ip_address = Column(String(50))
    user_agent = Column(String(500))
    created_at = Column(DateTime, default=datetime.utcnow)


class LoginLog(Base):
    """Login log model"""
    __tablename__ = "login_logs"
    
    login_log_id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    email = Column(String(150))
    ip_address = Column(String(50))
    user_agent = Column(String(500))
    device_info = Column(String(300))
    login_status = Column(String(20), nullable=False)  # Success | Failed | Blocked
    failure_reason = Column(String(200))
    attempted_at = Column(DateTime, default=datetime.utcnow)
    
    __table_args__ = (
        Index('ix_login_logs_user_id', 'user_id'),
        Index('ix_login_logs_attempted_at', 'attempted_at'),
    )


class CustomerReview(Base):
    """Customer review model"""
    __tablename__ = "customer_reviews"
    
    review_id = Column(Integer, primary_key=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id"), nullable=False)
    review_type = Column(String(20))  # Restaurant | Room | Conference
    reference_id = Column(Integer)
    rating = Column(Integer, nullable=False)  # 1-5
    comment = Column(String(1000))
    management_reply = Column(String(1000))
    replied_by = Column(Integer, ForeignKey("users.user_id"))
    replied_at = Column(DateTime)
    is_published = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    customer = relationship("Customer", back_populates="reviews")


class HotelDetails(Base):
    """HotelDetails model for dynamic hotel information management"""
    __tablename__ = "hotel_details"
    
    id = Column(Integer, primary_key=True)
    hotel_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    phone_number = Column(String(50), nullable=False)
    alternative_phone_number = Column(String(50), nullable=True)
    email = Column(String(100), nullable=False)
    website = Column(String(255), nullable=True)
    physical_address = Column(Text, nullable=False)
    city = Column(String(100), nullable=False)
    country = Column(String(100), nullable=False)
    postal_code = Column(String(20), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    google_maps_pin = Column(Text, nullable=True)
    logo_url = Column(String(500), nullable=True)
    cover_image_url = Column(String(500), nullable=True)
    facebook_url = Column(String(255), nullable=True)
    instagram_url = Column(String(255), nullable=True)
    x_url = Column(String(255), nullable=True)
    linkedin_url = Column(String(255), nullable=True)
    youtube_url = Column(String(255), nullable=True)
    check_in_time = Column(String(50), nullable=True)
    check_out_time = Column(String(50), nullable=True)
    currency = Column(String(10), nullable=True)
    timezone = Column(String(50), nullable=False, default="UTC")
    vat_rate = Column(DECIMAL(5, 2), nullable=False, default=18.00)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    created_by = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    updated_by = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    
    # Relationships
    creator = relationship("User", foreign_keys=[created_by])
    updater = relationship("User", foreign_keys=[updated_by])


# =====================================================================
# SECTION 7: ROOM AMENITIES, RATES, AND POLICIES
# =====================================================================

class AmenityCategory(Base):
    """Category for room amenities"""
    __tablename__ = "amenity_categories"
    
    category_id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    amenities = relationship("Amenity", back_populates="category", cascade="all, delete-orphan")


class Amenity(Base):
    """Specific room amenity"""
    __tablename__ = "amenities"
    
    amenity_id = Column(Integer, primary_key=True)
    category_id = Column(Integer, ForeignKey("amenity_categories.category_id", ondelete="SET NULL"), nullable=True)
    name = Column(String(150), nullable=False)
    description = Column(String(500), nullable=True)
    icon = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    category = relationship("AmenityCategory", back_populates="amenities")
    room_assignments = relationship("RoomAmenity", back_populates="amenity", cascade="all, delete-orphan")


class RoomAmenity(Base):
    """Join table for rooms and amenities"""
    __tablename__ = "room_amenities"
    __table_args__ = (UniqueConstraint('room_category_id', 'amenity_id', name='uq_room_category_amenity'),)
    
    id = Column(Integer, primary_key=True)
    room_category_id = Column(Integer, ForeignKey("room_categories.room_category_id", ondelete="CASCADE"), nullable=False)
    amenity_id = Column(Integer, ForeignKey("amenities.amenity_id", ondelete="CASCADE"), nullable=False)
    value = Column(String(200), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    category = relationship("RoomCategory", back_populates="amenity_assignments")
    amenity = relationship("Amenity", back_populates="room_assignments")


class RoomRatePlan(Base):
    """Available rate plans for a specific room"""
    __tablename__ = "room_rate_plans"
    
    rate_id = Column(Integer, primary_key=True)
    room_category_id = Column(Integer, ForeignKey("room_categories.room_category_id", ondelete="CASCADE"), nullable=False)
    rate_name = Column(String(150), nullable=False)
    rate_code = Column(String(50), nullable=True)
    description = Column(String(500), nullable=True)
    price = Column(DECIMAL(10, 2), nullable=False)
    pricing_basis = Column(String(50), default="PER_NIGHT")
    meal_plan = Column(String(100), nullable=True)
    cancellation_policy = Column(String(500), nullable=True)
    
    # Inclusions
    includes_breakfast = Column(Boolean, default=False)
    includes_wifi = Column(Boolean, default=False)
    includes_gym = Column(Boolean, default=False)
    includes_spa = Column(Boolean, default=False)
    includes_parking = Column(Boolean, default=False)
    taxes_included = Column(Boolean, default=False)
    fees_included = Column(Boolean, default=False)
    refundable = Column(Boolean, default=False)
    
    minimum_nights = Column(Integer, default=1)
    maximum_nights = Column(Integer, nullable=True)
    valid_from = Column(Date, nullable=True)
    valid_to = Column(Date, nullable=True)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    category = relationship("RoomCategory", back_populates="available_rates")


class Policy(Base):
    """Standalone policies that can be assigned to room categories"""
    __tablename__ = "policies"
    
    policy_id = Column(Integer, primary_key=True, index=True)
    policy_type = Column(String(100), nullable=False) # e.g. "Cancellation", "Check-in", "Pets"
    title = Column(String(150), nullable=False)
    description = Column(String(1000), nullable=True)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    assignments = relationship("RoomPolicy", back_populates="policy")


class RoomPolicy(Base):
    """Policies applicable to a specific room category"""
    __tablename__ = "room_policies"
    
    id = Column(Integer, primary_key=True, index=True)
    room_category_id = Column(Integer, ForeignKey("room_categories.room_category_id", ondelete="CASCADE"), nullable=False)
    policy_id = Column(Integer, ForeignKey("policies.policy_id", ondelete="CASCADE"), nullable=False)
    
    value = Column(String(200), nullable=True)
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    category = relationship("RoomCategory", back_populates="policies")
    policy = relationship("Policy", back_populates="assignments")
