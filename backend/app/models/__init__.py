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
    email = Column(String(150), unique=False)
    gender = Column(String(20))
    date_of_birth = Column(Date)
    nationality = Column(String(100))
    address = Column(String(300))
    is_active = Column(Boolean, default=True)
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
    is_available = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    category = relationship("MenuCategory", back_populates="items")
    order_items = relationship("OrderItem", back_populates="menu_item", cascade="all, delete-orphan")
    extras = relationship("MenuExtra", back_populates="menu_item", cascade="all, delete-orphan")


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
    delivery_charge = Column(DECIMAL(10, 2), default=0)
    preferred_time = Column(DateTime)
    special_instr = Column(String(500))
    allergy_info = Column(String(500))
    sub_total = Column(DECIMAL(10, 2), nullable=False, default=0)
    total_amount = Column(DECIMAL(10, 2), nullable=False, default=0)
    amount_paid = Column(DECIMAL(10, 2), default=0)
    balance_due = Column(DECIMAL(10, 2), default=0)
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
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(DECIMAL(10, 2), nullable=False)
    total_price = Column(DECIMAL(10, 2), nullable=False)
    special_notes = Column(String(300))
    
    # Relationships
    order = relationship("RestaurantOrder", back_populates="items")
    menu_item = relationship("MenuItem", back_populates="order_items")
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


# =====================================================================
# SECTION 4: ACCOMMODATION MODULE
# =====================================================================

class RoomCategory(Base):
    """Room category model"""
    __tablename__ = "room_categories"
    
    room_category_id = Column(Integer, primary_key=True)
    category_name = Column(String(100), nullable=False)
    description = Column(String(500))
    base_rate_usd = Column(DECIMAL(10, 2), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    rooms = relationship("Room", back_populates="category", cascade="all, delete-orphan")


class Room(Base):
    """Room model"""
    __tablename__ = "rooms"
    
    room_id = Column(Integer, primary_key=True)
    room_category_id = Column(Integer, ForeignKey("room_categories.room_category_id"), nullable=False)
    room_number = Column(String(20), nullable=False, unique=True)
    floor = Column(String(10))
    room_status = Column(String(20), default="Available")
    # Available | Reserved | Occupied | Maintenance
    max_occupancy = Column(Integer, default=2)
    description = Column(String(500))
    amenities = Column(String(500))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    category = relationship("RoomCategory", back_populates="rooms")
    photos = relationship("RoomPhoto", back_populates="room", cascade="all, delete-orphan")
    reservations = relationship("AccommodationReservation", back_populates="room", cascade="all, delete-orphan")


class RoomPhoto(Base):
    """Room photo model"""
    __tablename__ = "room_photos"
    
    photo_id = Column(Integer, primary_key=True)
    room_id = Column(Integer, ForeignKey("rooms.room_id", ondelete="CASCADE"), nullable=False)
    photo_url = Column(String(500), nullable=False)
    caption = Column(String(200))
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    room = relationship("Room", back_populates="photos")


class AccommodationReservation(Base):
    """Accommodation reservation model"""
    __tablename__ = "accommodation_reservations"
    
    reservation_id = Column(Integer, primary_key=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id"), nullable=False)
    room_id = Column(Integer, ForeignKey("rooms.room_id"), nullable=False)
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
    guest_details = relationship("GuestCheckInDetail", back_populates="reservation", cascade="all, delete-orphan")
    
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
    guest_name = Column(String(200), nullable=False)
    nationality = Column(String(100))
    phone_number = Column(String(20))
    next_of_kin = Column(String(200))
    next_of_kin_phone = Column(String(20))
    passport_number = Column(String(30))
    nin = Column(String(20))
    is_primary = Column(Boolean, default=False)
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
    hourly_rate = Column(DECIMAL(10, 2))
    full_day_rate = Column(DECIMAL(10, 2))
    half_day_rate = Column(DECIMAL(10, 2))
    description = Column(String(500))
    amenities = Column(String(500))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    photos = relationship("HallPhoto", back_populates="hall", cascade="all, delete-orphan")
    reservations = relationship("ConferenceReservation", back_populates="hall", cascade="all, delete-orphan")


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
    event_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    num_participants = Column(Integer)
    booking_type = Column(String(20))  # Hourly | HalfDay | FullDay
    hall_cost = Column(DECIMAL(10, 2), default=0)
    resource_cost = Column(DECIMAL(10, 2), default=0)
    meal_cost = Column(DECIMAL(10, 2), default=0)
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
    
    __table_args__ = (
        Index('ix_conference_reservations_customer_id', 'customer_id'),
        Index('ix_conference_reservations_hall_id', 'hall_id'),
        Index('ix_conference_reservations_event_date', 'event_date'),
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

class NotificationTemplate(Base):
    """Notification template model"""
    __tablename__ = "notification_templates"
    
    template_id = Column(Integer, primary_key=True)
    template_name = Column(String(100), nullable=False, unique=True)
    subject = Column(String(300))
    body_template = Column(Text, nullable=False)
    channel = Column(String(20))  # Push | SMS | Email
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    notifications = relationship("Notification", back_populates="template", cascade="all, delete-orphan")


class Notification(Base):
    """Notification model"""
    __tablename__ = "notifications"
    
    notification_id = Column(Integer, primary_key=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id"))
    user_id = Column(Integer, ForeignKey("users.user_id"))
    template_id = Column(Integer, ForeignKey("notification_templates.template_id"))
    notification_type = Column(String(50))
    # ReservationConfirmed | ReservationCancelled | PaymentReceived |
    # PaymentApproved | OrderReceived | OrderReady | CheckInReminder | CheckOutReminder
    channel = Column(String(20), nullable=False)  # Push | SMS | Email
    title = Column(String(300))
    body = Column(Text)
    recipient_address = Column(String(300))
    sent_status = Column(String(20), default="Pending")  # Pending | Sent | Failed
    delivery_status = Column(String(20), default="Unknown")  # Unknown | Delivered | Failed
    read_status = Column(Boolean, default=False)
    read_at = Column(DateTime)
    sent_at = Column(DateTime)
    provider_response = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    customer = relationship("Customer", foreign_keys=[customer_id])
    user = relationship("User", foreign_keys=[user_id])
    template = relationship("NotificationTemplate", back_populates="notifications")


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
    currency = Column(String(10), nullable=False, default="USD")
    timezone = Column(String(50), nullable=False, default="UTC")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    
    created_by = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    updated_by = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"), nullable=True)
    
    # Relationships
    creator = relationship("User", foreign_keys=[created_by])
    updater = relationship("User", foreign_keys=[updated_by])
