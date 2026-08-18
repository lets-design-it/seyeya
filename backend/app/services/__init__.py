"""
Service layer for business logic
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from datetime import datetime, date, timedelta, timezone
from decimal import Decimal
from typing import Optional, Tuple, List
import uuid
import secrets
from app.repositories import (
    UserRepository, CustomerRepository, MenuRepository,
    RestaurantOrderRepository, AccommodationRepository,
    ConferenceRepository, PaymentRepository, ReviewRepository,
    RoleRepository, PasswordResetRepository
)
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token
from app.models import (
    User, Customer, RestaurantOrder, OrderItem, OrderItemExtra, MenuExtra, MenuChoice, MenuAccompaniment, AccommodationReservation,
    ConferenceReservation, ConferenceResourceBooking, ConferenceMealBooking, Payment,
    UserSession, ActivityLog, LoginLog, PasswordResetToken,
    Role, Permission, PermissionGroup, UserRole, RolePermission
)
from app.utils.email import send_immediate_welcome_email, send_password_reset_email


class AuthService:
    """Authentication service"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
    
    async def register_user(
        self,
        full_name: str,
        email: str,
        password: str,
        phone_number: Optional[str] = None,
        role_ids: Optional[List[int]] = None,
        is_staff: bool = False
    ) -> Tuple[User, str, str]:
        """Register a new user"""
        # Check if user already exists
        existing_user = await self.user_repo.get_by_email(email)
        if existing_user:
            raise ValueError("User with this email already exists")
        
        # Hash password
        password_hash = hash_password(password)
        
        # Create user
        user = await self.user_repo.create_user(
            full_name=full_name,
            email=email,
            password_hash=password_hash,
            phone_number=phone_number,
            is_staff=is_staff
        )
        
        # Assign roles if provided
        if role_ids:
            role_repo = RoleRepository(self.db)
            for role_id in role_ids:
                await role_repo.assign_role_to_user(user.user_id, role_id)
        
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
        expires_at = datetime.utcnow() + timedelta(days=7)
        session = UserSession(
            user_id=user.user_id,
            refresh_token=refresh_token,
            expires_at=expires_at,
            is_active=True
        )
        self.db.add(session)
        await self.db.commit()
        
        # Trigger notification event
        try:
            from app.services.notifications import NotificationService
            notif_service = NotificationService(self.db)
            await notif_service.create_event(
                event_type="Account Created",
                reference_type="User",
                reference_id=str(user.user_id),
                triggered_by=user.user_id
            )
        except Exception as e:
            pass
            
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
        expires_at = datetime.utcnow() + timedelta(days=7)
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
        await self.db.commit()
        await self.db.refresh(user)
        
        return user, access_token, refresh_token

    async def refresh_user_token(self, refresh_token: str) -> Tuple[User, str, str]:
        """Refresh user tokens using a refresh token"""
        from app.core.security import decode_token
        
        # Decode token
        try:
            payload = decode_token(refresh_token)
        except Exception:
            raise ValueError("Invalid refresh token")
            
        if payload.get("type") != "refresh":
            raise ValueError("Invalid token type")
            
        user_id = payload.get("sub")
        if not user_id:
            raise ValueError("Invalid token subject")
            
        user = await self.user_repo.get_by_id(int(user_id))
        if not user or not user.is_active:
            raise ValueError("User not found or inactive")
            
        # Verify user session
        result = await self.db.execute(
            select(UserSession).where(and_(
                UserSession.user_id == user.user_id,
                UserSession.refresh_token == refresh_token,
                UserSession.is_active == True,
                UserSession.expires_at > datetime.utcnow()
            ))
        )
        session = result.scalar_one_or_none()
        if not session:
            raise ValueError("Session expired or invalid")
            
        # Generate new tokens
        access_token = create_access_token({
            "sub": str(user.user_id),
            "email": user.email,
            "is_admin": user.is_staff
        })
        new_refresh_token = create_refresh_token({
            "sub": str(user.user_id),
            "email": user.email
        })
        
        # Deactivate old session and create a new one
        session.is_active = False
        self.db.add(session)
        
        expires_at = datetime.utcnow() + timedelta(days=7)
        new_session = UserSession(
            user_id=user.user_id,
            refresh_token=new_refresh_token,
            expires_at=expires_at,
            is_active=True,
            ip_address=session.ip_address,
            user_agent=session.user_agent
        )
        self.db.add(new_session)
        await self.db.commit()
        await self.db.refresh(user)
        
        return user, access_token, new_refresh_token

    async def logout_user(self, refresh_token: str) -> bool:
        """Logout user by deactivating their session"""
        result = await self.db.execute(
            select(UserSession).where(
                and_(
                    UserSession.refresh_token == refresh_token,
                    UserSession.is_active == True
                )
            )
        )
        session = result.scalar_one_or_none()
        if not session:
            return False
        
        session.is_active = False
        session.revoked_at = datetime.utcnow()
        self.db.add(session)
        await self.db.commit()
        return True

    async def request_password_reset(self, email: str) -> bool:
        """Request a password reset"""
        user = await self.user_repo.get_by_email(email)
        if not user:
            return True
            
        token = uuid.uuid4().hex
        expires_at = datetime.utcnow() + timedelta(hours=24)
        
        pwd_reset_repo = PasswordResetRepository(self.db)
        await pwd_reset_repo.create_token(user_id=user.user_id, token=token, expires_at=expires_at)
        
        # Trigger notification event
        try:
            from app.services.notifications import NotificationService
            notif_service = NotificationService(self.db)
            await notif_service.create_event(
                event_type="Password Reset Request",
                reference_type="User",
                reference_id=str(user.user_id),
                triggered_by=user.user_id
            )
        except Exception as e:
            # Fallback to old email send if notif service fails
            send_password_reset_email(email=user.email, full_name=user.full_name, reset_token=token)
            
        return True

    async def confirm_password_reset(self, token: str, new_password: str) -> bool:
        """Confirm password reset with token"""
        pwd_reset_repo = PasswordResetRepository(self.db)
        token_obj = await pwd_reset_repo.get_token(token)
        
        if not token_obj or token_obj.used_at is not None:
            return False
            
        if token_obj.expires_at < datetime.utcnow():
            return False
            
        user = token_obj.user
        if not user:
            return False
            
        user.password_hash = hash_password(new_password)
        self.db.add(user)
        
        await pwd_reset_repo.mark_used(token_obj)
        
        # Trigger notification event
        try:
            from app.services.notifications import NotificationService
            notif_service = NotificationService(self.db)
            await notif_service.create_event(
                event_type="Password Changed",
                reference_type="User",
                reference_id=str(user.user_id),
                triggered_by=user.user_id
            )
        except Exception as e:
            pass
            
        return True


class CustomerService:
    """Customer service"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = CustomerRepository(db)
        self.user_repo = UserRepository(db)
    
    async def create_customer(
        self,
        full_name: str,
        phone_number: Optional[str] = None,
        email: Optional[str] = None,
        gender: Optional[str] = None,
        date_of_birth: Optional[date] = None,
        nationality: Optional[str] = None,
        address: Optional[str] = None,
        customer_type: str = "Registered",
        nin: Optional[str] = None,
        passport_number: Optional[str] = None,
        is_contract_client: bool = False,
        total_spent: Decimal = Decimal(0),
        visit_count: int = 0,
        loyalty_points: int = 0,
        is_active: bool = True,
        is_child: bool = False,
        parent_id: Optional[int] = None
    ) -> Customer:
        """Create a new customer"""
        existing_customer = await self.repo.get_by_email_or_phone(email=email, phone_number=phone_number)
        if existing_customer:
            raise ValueError("Customer with this email or phone number already exists")

        user_id: Optional[int] = None
        temp_password: Optional[str] = None
        reset_token: Optional[str] = None

        if email:
            existing_user = await self.user_repo.get_by_email(email)
            if existing_user:
                user_id = existing_user.user_id
            else:
                temp_password = secrets.token_urlsafe(12)
                password_hash = hash_password(temp_password)
                new_user = await self.user_repo.create_user(
                    full_name=full_name,
                    email=email,
                    password_hash=password_hash,
                    phone_number=phone_number,
                    is_staff=False,
                    is_active=is_active
                )
                user_id = new_user.user_id

            reset_token = uuid.uuid4().hex
            expires_at = datetime.utcnow() + timedelta(days=1)
            password_reset = PasswordResetToken(
                user_id=user_id,
                token=reset_token,
                expires_at=expires_at
            )
            self.db.add(password_reset)
            await self.db.commit()
            await self.db.refresh(password_reset)

            # Send the welcome credentials email immediately
            send_immediate_welcome_email(
                email=email,
                full_name=full_name,
                temp_password=temp_password,
                reset_token=reset_token
            )

        customer_code = f"CUST-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{str(uuid.uuid4())[:8].upper()}"
        customer = await self.repo.create_customer(
            customer_code=customer_code,
            full_name=full_name,
            phone_number=phone_number,
            email=email,
            gender=gender,
            date_of_birth=date_of_birth,
            nationality=nationality,
            address=address,
            customer_type=customer_type,
            user_id=user_id,
            nin=nin,
            passport_number=passport_number,
            is_contract_client=is_contract_client,
            total_spent=total_spent,
            visit_count=visit_count,
            loyalty_points=loyalty_points,
            is_active=is_active,
            is_child=is_child,
            parent_id=parent_id
        )
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
            "email": cust.email,
            "phone_number": cust.phone_number,
            "gender": cust.gender,
            "date_of_birth": cust.date_of_birth,
            "nationality": cust.nationality,
            "address": cust.address,
            "nin": cust.nin,
            "passport_number": cust.passport_number,
            "customer_type": cust.customer_type,
            "is_contract_client": cust.is_contract_client,
            "is_active": cust.is_active,
            "is_child": cust.is_child,
            "parent_id": cust.parent_id,
            "total_spent": cust.total_spent,
            "visit_count": cust.visit_count,
            "loyalty_points": cust.loyalty_points,
            "user_id": cust.user_id,
            "created_at": cust.created_at,
            "updated_at": cust.updated_at,
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
    
    async def create_order(self, customer_id: Optional[int] = None, items_data: Optional[list] = None, delivery_option: str = "Premises", delivery_lat: Optional[Decimal] = None, delivery_lng: Optional[Decimal] = None, delivery_charge: Optional[Decimal] = None, delivery_address: Optional[str] = None, preferred_time: Optional[datetime] = None, special_instr: Optional[str] = None) -> RestaurantOrder:
        """Create a new restaurant order"""
        # Generate unique order number
        order_number = f"ORD-{datetime.utcnow().strftime('%Y')}-{str(uuid.uuid4())[:8].upper()}"
        
        order = await self.order_repo.create_order(order_number, customer_id)
        order.delivery_option = delivery_option
        order.delivery_address = delivery_address
        order.delivery_lat = delivery_lat
        order.delivery_lng = delivery_lng
        order.preferred_time = preferred_time
        order.special_instr = special_instr
        
        # Add items to order
        if items_data:
            total = Decimal(0)
            for item_data in items_data:
                menu_item = await self.menu_repo.get_menu_item(item_data["menu_item_id"])
                if not menu_item:
                    raise ValueError(f"Menu item {item_data['menu_item_id']} not found")
                
                choice_id = item_data.get("choice_id")
                choice_price = Decimal(0)
                if choice_id:
                    result = await self.db.execute(
                        select(MenuChoice).where(
                            and_(
                                MenuChoice.choice_id == choice_id,
                                MenuChoice.menu_item_id == menu_item.menu_item_id
                            )
                        )
                    )
                    choice = result.scalar_one_or_none()
                    if not choice:
                        raise ValueError(f"Choice {choice_id} not found or does not belong to menu item {menu_item.menu_item_id}")
                    if choice.price:
                        choice_price = choice.price

                accompaniment_id = item_data.get("accompaniment_id")
                accompaniment_price = Decimal(0)
                if accompaniment_id:
                    result = await self.db.execute(
                        select(MenuAccompaniment).where(
                            and_(
                                MenuAccompaniment.accompaniment_id == accompaniment_id,
                                MenuAccompaniment.menu_item_id == menu_item.menu_item_id
                            )
                        )
                    )
                    accompaniment = result.scalar_one_or_none()
                    if not accompaniment:
                        raise ValueError(f"Accompaniment {accompaniment_id} not found or does not belong to menu item {menu_item.menu_item_id}")
                    if accompaniment.price:
                        accompaniment_price = accompaniment.price

                quantity = item_data.get("quantity", 1)
                unit_price = menu_item.price + accompaniment_price + choice_price
                total_price = unit_price * quantity
                
                order_item = OrderItem(
                    order_id=order.order_id,
                    menu_item_id=menu_item.menu_item_id,
                    choice_id=choice_id,
                    accompaniment_id=accompaniment_id,
                    quantity=quantity,
                    unit_price=unit_price,
                    total_price=total_price,
                    special_notes=item_data.get("special_notes")
                )
                
                # Add extras if provided
                if item_data.get("extras") is not None:
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
                            
                            # Also link to the order item
                            from app.models import OrderItemExtra
                            order_item_extra = OrderItemExtra(
                                extra_id=extra.extra_id,
                                quantity=extra_qty,
                                unit_price=extra.price,
                                total_price=extra_total
                            )
                            order_item.extras.append(order_item_extra)
                
                # Update total price of order item after adding extras
                order_item.total_price = total_price
                
                self.db.add(order_item)
                total += total_price
            
            # Delivery fee is handled directly from the request payload
            charge = Decimal(0)
            if delivery_option == "Delivery":
                if delivery_charge is not None:
                    charge = delivery_charge
                
                order.delivery_charge = charge
                
            # Get configured VAT rate from hotel details (fallback to 18.00% if missing or error)
            vat_percent = Decimal("18.00")
            try:
                from app.services.hotel_details import HotelDetailsService
                hotel_service = HotelDetailsService(self.db)
                active_hotel = await hotel_service.get_active_profile()
                if active_hotel and active_hotel.vat_rate is not None:
                    vat_percent = Decimal(str(active_hotel.vat_rate))
            except Exception:
                pass
            
            tax_rate = vat_percent / Decimal("100.00")
            tax = total * tax_rate
            
            order.tax_amount = tax
            order.sub_total = total
            order.total_amount = total + charge + tax
            order.balance_due = order.total_amount - (order.amount_paid or Decimal(0))
        
        self.db.add(order)
        await self.db.commit()
        
        # Trigger notification event
        try:
            from app.services.notifications import NotificationService
            notif_service = NotificationService(self.db)
            await notif_service.create_event(
                event_type="Order Placed",
                reference_type="RestaurantOrder",
                reference_id=str(order.order_id)
            )
        except Exception as e:
            pass
            
        return await self.get_order(order.order_id)
    
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
        
        # Trigger notification event
        try:
            from app.services.notifications import NotificationService
            notif_service = NotificationService(self.db)
            event_type = f"Order {new_status}"
            if new_status == "Processing":
                event_type = "Order Being Prepared"
            elif new_status == "Ready":
                event_type = "Order Ready"
            elif new_status in ["Completed", "Delivered"]:
                event_type = "Order Delivered"
            elif new_status == "Cancelled":
                event_type = "Order Cancelled"
                
            await notif_service.create_event(
                event_type=event_type,
                reference_type="RestaurantOrder",
                reference_id=str(order_id)
            )
        except Exception as e:
            pass
            
        return await self.get_order(order_id)

    async def cancel_order(self, order_id: int, reason: Optional[str] = None) -> Optional[RestaurantOrder]:
        """Cancel (soft delete) a restaurant order"""
        order = await self.order_repo.get_by_id(order_id)
        if not order:
            return None
            
        order.order_status = "Cancelled"
        order.cancelled_at = datetime.utcnow()
        if reason:
            order.cancel_reason = reason
            
        self.db.add(order)
        await self.db.commit()
        return await self.get_order(order_id)

    async def get_customer_orders(self, customer_id: int, skip: int = 0, limit: int = 50) -> List[RestaurantOrder]:
        """Get orders for a customer"""
        return await self.order_repo.get_customer_orders(customer_id, skip=skip, limit=limit)

    async def get_all_orders(self, skip: int = 0, limit: int = 50) -> List[RestaurantOrder]:
        """Get all restaurant orders"""
        result = await self.db.execute(
            select(RestaurantOrder)
            .options(
                selectinload(RestaurantOrder.items).selectinload(OrderItem.extras).selectinload(OrderItemExtra.extra),
                selectinload(RestaurantOrder.items).selectinload(OrderItem.choice),
                selectinload(RestaurantOrder.items).selectinload(OrderItem.accompaniment),
                selectinload(RestaurantOrder.items).selectinload(OrderItem.menu_item)
            )
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()


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
        
        # Trigger notification event
        try:
            from app.services.notifications import NotificationService
            notif_service = NotificationService(self.db)
            await notif_service.create_event(
                event_type="Reservation Created",
                reference_type="AccommodationReservation",
                reference_id=str(reservation.reservation_id)
            )
        except Exception as e:
            pass
            
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
        
        # Update room status to Occupied
        from app.models import Room
        result = await self.db.execute(select(Room).where(Room.room_id == reservation.room_id))
        room = result.scalar_one_or_none()
        if room:
            room.room_status = "Occupied"
            self.db.add(room)
        
        self.db.add(reservation)
        await self.db.commit()
        await self.db.refresh(reservation)
        return reservation

    async def check_out(self, reservation_id: int, checked_out_by: int) -> Optional[AccommodationReservation]:
        """Check out guest"""
        reservation = await self.repo.get_reservation_by_id(reservation_id)
        if not reservation:
            return None
        
        reservation.reservation_status = "CheckedOut"
        reservation.check_out_actual = datetime.utcnow()
        reservation.checked_out_by = checked_out_by
        
        # Update room status to Available
        from app.models import Room
        result = await self.db.execute(select(Room).where(Room.room_id == reservation.room_id))
        room = result.scalar_one_or_none()
        if room:
            room.room_status = "Available"
            self.db.add(room)
        
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
        
        # Auto-lookup customer_id if not explicitly passed
        if not customer_id:
            if reference_type == "RestaurantOrder":
                from app.models import RestaurantOrder
                res = await self.db.execute(select(RestaurantOrder).where(RestaurantOrder.order_id == reference_id))
                order = res.scalar_one_or_none()
                if order:
                    customer_id = order.customer_id
            elif reference_type == "AccommodationReservation":
                from app.models import AccommodationReservation
                res = await self.db.execute(select(AccommodationReservation).where(AccommodationReservation.reservation_id == reference_id))
                reservation = res.scalar_one_or_none()
                if reservation:
                    customer_id = reservation.customer_id
            elif reference_type == "ConferenceReservation":
                from app.models import ConferenceReservation
                res = await self.db.execute(select(ConferenceReservation).where(ConferenceReservation.conference_res_id == reference_id))
                reservation = res.scalar_one_or_none()
                if reservation:
                    customer_id = reservation.customer_id

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

        # Update linked reservation/order
        if payment.reference_type == "RestaurantOrder":
            from app.models import RestaurantOrder
            res = await self.db.execute(select(RestaurantOrder).where(RestaurantOrder.order_id == payment.reference_id))
            order = res.scalar_one_or_none()
            if order:
                order.amount_paid += payment.amount_paid
                order.balance_due = order.total_amount - order.amount_paid
                if order.balance_due <= 0:
                    order.payment_status = "Paid"
                else:
                    order.payment_status = "PartiallyPaid"
                self.db.add(order)
                
        elif payment.reference_type == "AccommodationReservation":
            from app.models import AccommodationReservation
            res = await self.db.execute(select(AccommodationReservation).where(AccommodationReservation.reservation_id == payment.reference_id))
            reservation = res.scalar_one_or_none()
            if reservation:
                reservation.amount_paid += payment.amount_paid
                reservation.balance_due = reservation.total_amount - reservation.amount_paid
                if reservation.balance_due <= 0:
                    reservation.payment_status = "Paid"
                else:
                    reservation.payment_status = "PartiallyPaid"
                self.db.add(reservation)
                
        elif payment.reference_type == "ConferenceReservation":
            from app.models import ConferenceReservation
            res = await self.db.execute(select(ConferenceReservation).where(ConferenceReservation.conference_res_id == payment.reference_id))
            reservation = res.scalar_one_or_none()
            if reservation:
                reservation.amount_paid += payment.amount_paid
                reservation.balance_due = reservation.total_amount - reservation.amount_paid
                if reservation.balance_due <= 0:
                    reservation.payment_status = "Paid"
                else:
                    reservation.payment_status = "PartiallyPaid"
                self.db.add(reservation)
        
        self.db.add(payment)
        await self.db.commit()
        await self.db.refresh(payment)
        
        # Trigger notification event
        try:
            from app.services.notifications import NotificationService
            notif_service = NotificationService(self.db)
            await notif_service.create_event(
                event_type="Payment Successful",
                reference_type="Payment",
                reference_id=str(payment.payment_id),
                triggered_by=verified_by
            )
        except Exception as e:
            pass
            
        return payment


class UserService:
    """User service for CRUD operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)
        
    async def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get user details"""
        return await self.user_repo.get_by_id(user_id)
        
    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        return await self.user_repo.get_by_email(email)
        
    async def list_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        """List users"""
        return await self.user_repo.get_all_users(skip=skip, limit=limit)
        
    async def create_user(
        self,
        full_name: str,
        email: str,
        password: str,
        phone_number: Optional[str] = None,
        is_staff: bool = False,
        is_active: bool = True
    ) -> User:
        """Create a new user"""
        existing = await self.user_repo.get_by_email(email)
        if existing:
            raise ValueError("User with this email already exists")
            
        password_hash = hash_password(password)
        return await self.user_repo.create_user(
            full_name=full_name,
            email=email,
            password_hash=password_hash,
            phone_number=phone_number,
            is_staff=is_staff,
            is_active=is_active
        )
        
    async def update_user(self, user_id: int, updates: dict) -> Optional[User]:
        """Update an existing user"""
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            return None
            
        if "email" in updates and updates["email"] != user.email:
            existing = await self.user_repo.get_by_email(updates["email"])
            if existing:
                raise ValueError("User with this email already exists")
                
        # Update roles if role_ids are supplied
        if "role_ids" in updates:
            role_ids = updates.pop("role_ids")
            if role_ids is not None:
                current_role_ids = [r.role_id for r in user.roles]
                if set(current_role_ids) != set(role_ids):
                    # Clear roles and flush to avoid unique constraint conflict on insert
                    user.roles = []
                    await self.db.flush()
                    # Re-assign new roles
                    for role_id in role_ids:
                        user_role = UserRole(user_id=user_id, role_id=role_id)
                        user.roles.append(user_role)

        for field, value in updates.items():
            if value is not None:
                if field == "password":
                    user.password_hash = hash_password(value)
                elif hasattr(user, field):
                    setattr(user, field, value)
                    
        return await self.user_repo.update_user(user)
        
    async def delete_user(self, user_id: int) -> bool:
        """Soft delete a user"""
        return await self.user_repo.delete_user(user_id)


class RoleService:
    """Role and permission service"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        self.role_repo = RoleRepository(db)
        
    async def list_roles(self) -> List[Role]:
        """List all roles"""
        return await self.role_repo.get_all_roles()
        
    async def get_role_by_id(self, role_id: int) -> Optional[Role]:
        """Get role by ID"""
        return await self.role_repo.get_role_by_id(role_id)
        
    async def create_role(
        self,
        role_name: str,
        description: Optional[str] = None,
        parent_role_id: Optional[int] = None,
        is_active: bool = True,
        is_system_role: bool = False,
        permission_ids: Optional[List[int]] = None
    ) -> Role:
        """Create role and assign permissions"""
        existing = await self.role_repo.get_role_by_name(role_name)
        if existing:
            raise ValueError("Role with this name already exists")
            
        role = await self.role_repo.create_role(
            role_name=role_name,
            description=description,
            parent_role_id=parent_role_id,
            is_active=is_active,
            is_system_role=is_system_role
        )
        
        if permission_ids:
            await self.role_repo.assign_permissions_to_role(role.role_id, permission_ids)
            
        return await self.role_repo.get_role_by_id(role.role_id)
        
    async def update_role(self, role_id: int, updates: dict) -> Optional[Role]:
        """Update role details and permissions"""
        role = await self.role_repo.get_role_by_id(role_id)
        if not role:
            return None
            
        if "role_name" in updates and updates["role_name"] != role.role_name:
            existing = await self.role_repo.get_role_by_name(updates["role_name"])
            if existing:
                raise ValueError("Role with this name already exists")
                
        permission_ids = updates.pop("permission_ids", None)
        
        for field, value in updates.items():
            if value is not None and hasattr(role, field):
                setattr(role, field, value)
                
        await self.role_repo.update_role(role)
        
        if permission_ids is not None:
            await self.role_repo.assign_permissions_to_role(role_id, permission_ids)
            
        return await self.role_repo.get_role_by_id(role_id)
        
    async def delete_role(self, role_id: int) -> bool:
        """Delete role"""
        return await self.role_repo.delete_role(role_id)
        
    async def list_permissions(self) -> List[Permission]:
        """List all permissions"""
        return await self.role_repo.get_all_permissions()
        
    async def list_permission_groups(self) -> List[PermissionGroup]:
        """List all permission groups"""
        return await self.role_repo.get_permission_groups()
        
    async def assign_permissions_to_role(self, role_id: int, permission_ids: List[int], granted_by: Optional[int] = None):
        """Assign permissions to role"""
        return await self.role_repo.assign_permissions_to_role(role_id, permission_ids, granted_by)
        
    async def assign_role_to_user(self, user_id: int, role_id: int, assigned_by: Optional[int] = None, expires_at: Optional[datetime] = None) -> UserRole:
        """Assign role to user"""
        return await self.role_repo.assign_role_to_user(user_id, role_id, assigned_by, expires_at)
        
    async def remove_user_role(self, user_id: int, role_id: int) -> bool:
        """Remove user role"""
        return await self.role_repo.remove_user_role(user_id, role_id)


# Import new service
from app.services.payment_method import PaymentMethodService
from app.services.hotel_details import HotelDetailsService
