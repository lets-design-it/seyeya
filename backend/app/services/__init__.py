"""
Service layer for business logic
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Optional, Tuple, List
import uuid
from app.repositories import (
    UserRepository, CustomerRepository, MenuRepository,
    RestaurantOrderRepository, AccommodationRepository,
    ConferenceRepository, PaymentRepository, ReviewRepository
)
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token
from app.models import (
    User, Customer, RestaurantOrder, OrderItem, MenuExtra, AccommodationReservation,
    ConferenceReservation, ConferenceResourceBooking, ConferenceMealBooking, Payment,
    UserSession, ActivityLog, LoginLog
)


class AuthService:
    """Authentication service"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
    
    async def register_user(self, full_name: str, email: str, password: str, phone_number: Optional[str] = None) -> Tuple[User, str, str]:
        """Register a new user"""
        # Check if user already exists
        existing_user = await self.user_repo.get_by_email(email)
        if existing_user:
            raise ValueError("User with this email already exists")
        
        # Hash password
        password_hash = hash_password(password)
        
        # Create user
        user = await self.user_repo.create_user(full_name, email, password_hash, phone_number)
        
        # Generate tokens
        access_token = create_access_token({
            "sub": str(user.user_id),
            "email": user.email,
            "is_admin": user.is_staff
        })
        refresh_token = create_refresh_token({
            "sub": str(user.user_id),
            "email": user.email
        })
        
        # Create session
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        session = UserSession(
            user_id=user.user_id,
            refresh_token=refresh_token,
            expires_at=expires_at,
            is_active=True
        )
        self.db.add(session)
        await self.db.commit()
        
        return user, access_token, refresh_token
    
    async def login_user(self, email: str, password: str, ip_address: Optional[str] = None, user_agent: Optional[str] = None) -> Tuple[User, str, str]:
        """Login user"""
        user = await self.user_repo.get_by_email(email)
        
        # Log login attempt
        login_log = LoginLog(
            email=email,
            ip_address=ip_address,
            user_agent=user_agent,
            login_status="Failed" if not user else ("Failed" if not verify_password(password, user.password_hash) else "Success")
        )
        
        if not user:
            self.db.add(login_log)
            await self.db.commit()
            raise ValueError("Invalid email or password")
        
        if not verify_password(password, user.password_hash):
            login_log.user_id = user.user_id
            self.db.add(login_log)
            await self.db.commit()
            raise ValueError("Invalid email or password")
        
        # Update login log
        login_log.user_id = user.user_id
        login_log.login_status = "Success"
        
        # Update last login
        user.last_login_at = datetime.utcnow()
        
        # Generate tokens
        access_token = create_access_token({
            "sub": str(user.user_id),
            "email": user.email,
            "is_admin": user.is_staff
        })
        refresh_token = create_refresh_token({
            "sub": str(user.user_id),
            "email": user.email
        })
        
        # Create session
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        session = UserSession(
            user_id=user.user_id,
            refresh_token=refresh_token,
            expires_at=expires_at,
            is_active=True,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        self.db.add(login_log)
        self.db.add(session)
        self.db.commit()
        await self.db.refresh(user)
        
        return user, access_token, refresh_token


class CustomerService:
    """Customer service"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = CustomerRepository(db)
    
    async def create_customer(self, full_name: str, phone_number: Optional[str] = None, email: Optional[str] = None, customer_type: str = "Registered") -> Customer:
        """Create a new customer"""
        # Generate unique customer code
        customer_code = f"CUST-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{str(uuid.uuid4())[:8].upper()}"
        
        customer = await self.repo.create_customer(customer_code, full_name, phone_number, email)
        customer.customer_type = customer_type
        self.db.add(customer)
        await self.db.commit()
        await self.db.refresh(customer)
        return customer
    
    async def get_customer(self, customer_id: int) -> Optional[Customer]:
        """Get customer details"""
        return await self.repo.get_by_id(customer_id)
    
    async def lookup_customer(self, identifier: str) -> Optional[Customer]:
        """Lookup customer by NIN, Passport, or Phone"""
        return await self.repo.get_by_identifier(identifier)

    async def list_customers(self, skip: int = 0, limit: int = 50):
        return await self.repo.get_all_customers(skip=skip, limit=limit)

    async def search_customers(self, query: str, skip: int = 0, limit: int = 50):
        return await self.repo.search_customers(query, skip=skip, limit=limit)

    async def update_customer(self, customer_id: int, updates: dict) -> Optional[Customer]:
        customer = await self.repo.get_by_id(customer_id)
        if not customer:
            return None
        for k, v in updates.items():
            if hasattr(customer, k) and v is not None:
                setattr(customer, k, v)
        return await self.repo.update_customer(customer)

    async def deactivate_customer(self, customer_id: int) -> bool:
        return await self.repo.deactivate_customer(customer_id)

    async def get_customer_profile(self, customer_id: int):
        cust = await self.repo.get_by_id(customer_id)
        if not cust:
            return None

        # counts
        orders_count = await self.db.execute(select(func.count(RestaurantOrder.order_id)).where(RestaurantOrder.customer_id == customer_id))
        orders_count = int(orders_count.scalar_one())

        acc_count = await self.db.execute(select(func.count(AccommodationReservation.reservation_id)).where(AccommodationReservation.customer_id == customer_id))
        acc_count = int(acc_count.scalar_one())

        conf_count = await self.db.execute(select(func.count(ConferenceReservation.conference_res_id)).where(ConferenceReservation.customer_id == customer_id))
        conf_count = int(conf_count.scalar_one())

        recent_txs = await self.repo.get_customer_transactions(customer_id, limit=10)

        profile = {
            "customer_id": cust.customer_id,
            "customer_code": cust.customer_code,
            "full_name": cust.full_name,
            "total_spent": cust.total_spent,
            "visit_count": cust.visit_count,
            "loyalty_points": cust.loyalty_points,
            "num_restaurant_orders": orders_count,
            "num_accommodation_reservations": acc_count,
            "num_conference_reservations": conf_count,
            "recent_transactions": recent_txs,
            "reviews": [],
            "customer_tier": None
        }
        return profile

    async def get_customer_transactions(self, customer_id: int, limit: int = 50):
        return await self.repo.get_customer_transactions(customer_id, limit=limit)

    async def get_top_customers(self, limit: int = 10):
        return await self.repo.get_top_customers(limit=limit)

    async def get_vip_customers(self, min_spent: float = 1000000.0):
        return await self.repo.get_vip_customers(min_spent=min_spent)


class RestaurantOrderService:
    """Restaurant order service"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.order_repo = RestaurantOrderRepository(db)
        self.menu_repo = MenuRepository(db)
    
    async def create_order(self, customer_id: Optional[int] = None, items_data: Optional[list] = None, delivery_option: str = "Premises") -> RestaurantOrder:
        """Create a new restaurant order"""
        # Generate unique order number
        order_number = f"ORD-{datetime.utcnow().strftime('%Y')}-{str(uuid.uuid4())[:8].upper()}"
        
        order = await self.order_repo.create_order(order_number, customer_id)
        order.delivery_option = delivery_option
        
        # Add items to order
        if items_data:
            total = Decimal(0)
            for item_data in items_data:
                menu_item = await self.menu_repo.get_menu_item(item_data["menu_item_id"])
                if not menu_item:
                    raise ValueError(f"Menu item {item_data['menu_item_id']} not found")
                
                quantity = item_data.get("quantity", 1)
                unit_price = menu_item.price
                total_price = unit_price * quantity
                
                order_item = OrderItem(
                    order_id=order.order_id,
                    menu_item_id=menu_item.menu_item_id,
                    quantity=quantity,
                    unit_price=unit_price,
                    total_price=total_price,
                    special_notes=item_data.get("special_notes")
                )
                
                # Add extras if provided
                if "extras" in item_data:
                    for extra_data in item_data["extras"]:
                        # Fetch extra price from database
                        result = await self.db.execute(
                            select(MenuExtra).where(MenuExtra.extra_id == extra_data["extra_id"])
                        )
                        extra = result.scalar_one_or_none()
                        if extra:
                            extra_qty = extra_data.get("quantity", 1)
                            extra_total = extra.price * extra_qty
                            total_price += extra_total
                
                self.db.add(order_item)
                total += total_price
            
            order.sub_total = total
            order.total_amount = total
        
        self.db.add(order)
        await self.db.commit()
        await self.db.refresh(order)
        return order
    
    async def get_order(self, order_id: int) -> Optional[RestaurantOrder]:
        """Get order details"""
        return await self.order_repo.get_by_id(order_id)
    
    async def update_order_status(self, order_id: int, new_status: str) -> Optional[RestaurantOrder]:
        """Update order status"""
        order = await self.order_repo.get_by_id(order_id)
        if not order:
            return None
        
        order.order_status = new_status
        self.db.add(order)
        await self.db.commit()
        await self.db.refresh(order)
        return order


class AccommodationService:
    """Accommodation service"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = AccommodationRepository(db)
    
    async def create_reservation(self, customer_id: int, room_id: int, check_in_date, check_out_date, num_nights: int, rate_per_night, total_amount: Decimal) -> AccommodationReservation:
        """Create accommodation reservation"""
        # Generate reservation code
        reservation_code = f"ACC-{datetime.utcnow().strftime('%Y')}-{str(uuid.uuid4())[:8].upper()}"
        
        reservation = await self.repo.create_reservation(
            customer_id, room_id, check_in_date, check_out_date,
            num_nights, rate_per_night, total_amount, reservation_code
        )
        
        return reservation
    
    async def get_reservation(self, reservation_id: int) -> Optional[AccommodationReservation]:
        """Get reservation details"""
        return await self.repo.get_reservation_by_id(reservation_id)
    
    async def check_in(self, reservation_id: int, checked_in_by: int) -> Optional[AccommodationReservation]:
        """Check in guest"""
        reservation = await self.repo.get_reservation_by_id(reservation_id)
        if not reservation:
            return None
        
        reservation.reservation_status = "CheckedIn"
        reservation.check_in_actual = datetime.utcnow()
        reservation.checked_in_by = checked_in_by
        
        # Update room status
        room = await self.repo.db.execute(select(RestaurantOrder).where(RestaurantOrder.room_id == reservation.room_id))
        
        self.db.add(reservation)
        await self.db.commit()
        await self.db.refresh(reservation)
        return reservation


class PaymentService:
    """Payment service"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = PaymentRepository(db)
    
    async def create_payment(self, customer_id: Optional[int], payment_type: str, reference_type: str, reference_id: int, payment_method: str, amount_paid: Decimal, is_deposit: bool = False) -> Payment:
        """Create a payment"""
        payment_reference = f"PAY-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{str(uuid.uuid4())[:8].upper()}"
        
        payment = await self.repo.create_payment(
            customer_id, payment_type, reference_type, reference_id, payment_method, amount_paid, payment_reference
        )
        payment.is_deposit = is_deposit
        payment.payment_status = "Pending"
        
        self.db.add(payment)
        await self.db.commit()
        await self.db.refresh(payment)
        return payment
    
    async def verify_payment(self, payment_id: int, verified_by: int) -> Optional[Payment]:
        """Verify a payment"""
        payment = await self.repo.get_by_id(payment_id)
        if not payment:
            return None
        
        payment.payment_status = "Paid"
        payment.verified_by = verified_by
        payment.verified_at = datetime.utcnow()
        
        self.db.add(payment)
        await self.db.commit()
        await self.db.refresh(payment)
        return payment
