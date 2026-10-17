"""
Repository implementations for different modules
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, delete, update, desc
from sqlalchemy.orm import selectinload
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
from app.models import (
    User, Customer, RestaurantOrder, AccommodationReservation, 
    ConferenceReservation, MenuItem, MenuCategory, Room, RoomCategory, ConferenceHall, HallPhoto,
    ConferenceFacility, ConferenceHallFacility, ConferenceBookingFacility,
    Payment, CustomerReview, OrderItem, OrderItemExtra, MenuExtra, MenuChoice, MenuAccompaniment,
    Role, Permission, PermissionGroup, UserRole, RolePermission, PasswordResetToken,
    RoomAmenity, Amenity, RoomRatePlan, RoomPolicy,
    UserSession, DeviceToken, NotificationPreference, Notification, EmailQueue,
    NotificationEvent, PaymentMethod, LoginLog, ActivityLog, AuditLog, OrderStatusHistory, HotelDetails, PaymentRefund,
    EmailVerificationCode
)


class UserRepository:
    """Repository for user operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        result = await self.db.execute(
            select(User)
            .where(User.email == email)
            .options(selectinload(User.roles).selectinload(UserRole.role))
        )
        return result.scalar_one_or_none()
    
    async def get_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID"""
        result = await self.db.execute(
            select(User)
            .where(User.user_id == user_id)
            .options(selectinload(User.roles).selectinload(UserRole.role))
        )
        return result.scalar_one_or_none()
    
    async def create_user(
        self,
        full_name: str,
        email: str,
        password_hash: str,
        phone_number: Optional[str] = None,
        is_staff: bool = False,
        is_active: bool = True
    ) -> User:
        """Create a new user"""
        user = User(
            full_name=full_name,
            email=email,
            password_hash=password_hash,
            phone_number=phone_number,
            is_staff=is_staff,
            is_active=is_active
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user
    
    async def get_all_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        """Get all active users except those with associated customer profiles"""
        result = await self.db.execute(
            select(User)
            .outerjoin(Customer)
            .where(Customer.customer_id == None)
            .where(User.is_active == True)
            .options(selectinload(User.roles).selectinload(UserRole.role))
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def update_user(self, user: User) -> User:
        """Update an existing user"""
        self.db.add(user)
        await self.db.commit()
        return await self.get_by_id(user.user_id)

    async def permanent_delete_user(self, user_id: int) -> bool:
        """Permanently delete a user and decouple/cascade all foreign key references"""
        user = await self.get_by_id(user_id)
        if not user:
            return False

        try:
            # 1. Nullify non-cascading staff action foreign keys
            await self.db.execute(
                update(RolePermission).where(RolePermission.granted_by == user_id).values(granted_by=None)
            )
            await self.db.execute(
                update(RestaurantOrder).where(RestaurantOrder.assigned_waiter == user_id).values(assigned_waiter=None)
            )
            await self.db.execute(
                update(OrderStatusHistory).where(OrderStatusHistory.changed_by == user_id).values(changed_by=None)
            )
            await self.db.execute(
                update(AccommodationReservation).where(AccommodationReservation.checked_in_by == user_id).values(checked_in_by=None)
            )
            await self.db.execute(
                update(AccommodationReservation).where(AccommodationReservation.checked_out_by == user_id).values(checked_out_by=None)
            )
            await self.db.execute(
                update(Payment).where(Payment.verified_by == user_id).values(verified_by=None)
            )
            await self.db.execute(
                update(PaymentRefund).where(PaymentRefund.processed_by == user_id).values(processed_by=None)
            )
            await self.db.execute(
                update(AuditLog).where(AuditLog.changed_by == user_id).values(changed_by=None)
            )
            await self.db.execute(
                update(CustomerReview).where(CustomerReview.replied_by == user_id).values(replied_by=None)
            )
            await self.db.execute(
                update(HotelDetails).where(HotelDetails.created_by == user_id).values(created_by=None)
            )
            await self.db.execute(
                update(HotelDetails).where(HotelDetails.updated_by == user_id).values(updated_by=None)
            )
            await self.db.execute(
                update(NotificationEvent).where(NotificationEvent.triggered_by == user_id).values(triggered_by=None)
            )
            # Decouple customer user link
            await self.db.execute(
                update(Customer).where(Customer.user_id == user_id).values(user_id=None)
            )

            # 2. Delete user-specific cascading tables
            user_notifs = await self.db.execute(
                select(Notification.id).where(Notification.recipient_id == user_id)
            )
            notif_ids = user_notifs.scalars().all()
            if notif_ids:
                await self.db.execute(
                    delete(EmailQueue).where(EmailQueue.notification_id.in_(notif_ids))
                )
            await self.db.execute(
                delete(EmailQueue).where(EmailQueue.recipient_email == user.email)
            )
            await self.db.execute(
                delete(Notification).where(Notification.recipient_id == user_id)
            )
            await self.db.execute(
                delete(NotificationPreference).where(NotificationPreference.user_id == user_id)
            )
            await self.db.execute(
                delete(UserRole).where(UserRole.user_id == user_id)
            )
            await self.db.execute(
                delete(UserSession).where(UserSession.user_id == user_id)
            )
            await self.db.execute(
                delete(PasswordResetToken).where(PasswordResetToken.user_id == user_id)
            )
            await self.db.execute(
                delete(DeviceToken).where(DeviceToken.user_id == user_id)
            )
            await self.db.execute(
                delete(PaymentMethod).where(PaymentMethod.user_id == user_id)
            )
            await self.db.execute(
                delete(LoginLog).where(LoginLog.user_id == user_id)
            )
            await self.db.execute(
                delete(ActivityLog).where(ActivityLog.user_id == user_id)
            )

            # 3. Permanently delete the User row
            await self.db.execute(
                delete(User).where(User.user_id == user_id)
            )
            await self.db.commit()
            return True
        except Exception:
            await self.db.rollback()
            raise

    async def delete_user(self, user_id: int, hard: bool = True) -> bool:
        """Delete user - permanently by default or soft-deactivate"""
        if hard:
            try:
                return await self.permanent_delete_user(user_id)
            except Exception:
                pass

        # Fallback to soft delete
        user = await self.get_by_id(user_id)
        if user:
            user.is_active = False
            self.db.add(user)
            await self.db.commit()
            return True
        return False


class RoleRepository:
    """Repository for role and permission operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        
    async def get_all_roles(self) -> List[Role]:
        """Get all roles with permissions preloaded"""
        result = await self.db.execute(
            select(Role).options(selectinload(Role.permissions).selectinload(RolePermission.permission))
        )
        return result.scalars().all()
        
    async def get_role_by_id(self, role_id: int) -> Optional[Role]:
        """Get role by ID with permissions preloaded"""
        result = await self.db.execute(
            select(Role)
            .where(Role.role_id == role_id)
            .options(selectinload(Role.permissions).selectinload(RolePermission.permission))
        )
        return result.scalar_one_or_none()
        
    async def get_role_by_name(self, role_name: str) -> Optional[Role]:
        """Get role by name"""
        result = await self.db.execute(
            select(Role).where(Role.role_name == role_name)
        )
        return result.scalar_one_or_none()
        
    async def create_role(
        self,
        role_name: str,
        description: Optional[str] = None,
        parent_role_id: Optional[int] = None,
        is_active: bool = True,
        is_system_role: bool = False
    ) -> Role:
        """Create a new role"""
        role = Role(
            role_name=role_name,
            description=description,
            parent_role_id=parent_role_id,
            is_active=is_active,
            is_system_role=is_system_role
        )
        self.db.add(role)
        await self.db.commit()
        return await self.get_role_by_id(role.role_id)
        
    async def update_role(self, role: Role) -> Role:
        """Update an existing role"""
        self.db.add(role)
        await self.db.commit()
        return await self.get_role_by_id(role.role_id)
        
    async def delete_role(self, role_id: int) -> bool:
        """Delete a role"""
        result = await self.db.execute(
            select(Role).where(Role.role_id == role_id)
        )
        role = result.scalar_one_or_none()
        if role:
            await self.db.delete(role)
            await self.db.commit()
            return True
        return False
        
    async def get_all_permissions(self) -> List[Permission]:
        """Get all permissions with groups preloaded"""
        result = await self.db.execute(
            select(Permission).options(selectinload(Permission.group))
        )
        return result.scalars().all()

    async def get_permission_groups(self) -> List[PermissionGroup]:
        """Get all permission groups with permissions preloaded"""
        result = await self.db.execute(
            select(PermissionGroup).options(selectinload(PermissionGroup.permissions))
        )
        return result.scalars().all()
        
    async def assign_permissions_to_role(self, role_id: int, permission_ids: List[int], granted_by: Optional[int] = None):
        """Re-assign permissions to a role"""
        from sqlalchemy import delete
        await self.db.execute(
            delete(RolePermission).where(RolePermission.role_id == role_id)
        )
        
        for perm_id in permission_ids:
            rp = RolePermission(
                role_id=role_id,
                permission_id=perm_id,
                granted_by=granted_by
            )
            self.db.add(rp)
        await self.db.commit()
        
    async def assign_role_to_user(
        self,
        user_id: int,
        role_id: int,
        assigned_by: Optional[int] = None,
        expires_at: Optional[datetime] = None
    ) -> UserRole:
        """Assign role to user"""
        result = await self.db.execute(
            select(UserRole).where(and_(UserRole.user_id == user_id, UserRole.role_id == role_id))
        )
        existing = result.scalar_one_or_none()
        if existing:
            existing.expires_at = expires_at
            existing.assigned_by = assigned_by
            self.db.add(existing)
            await self.db.commit()
            await self.db.refresh(existing)
            return existing
            
        user_role = UserRole(
            user_id=user_id,
            role_id=role_id,
            assigned_by=assigned_by,
            expires_at=expires_at
        )
        self.db.add(user_role)
        await self.db.commit()
        await self.db.refresh(user_role)
        return user_role

    async def remove_user_role(self, user_id: int, role_id: int) -> bool:
        """Remove a role assignment from a user"""
        result = await self.db.execute(
            select(UserRole).where(and_(UserRole.user_id == user_id, UserRole.role_id == role_id))
        )
        user_role = result.scalar_one_or_none()
        if user_role:
            await self.db.delete(user_role)
            await self.db.commit()
            return True
        return False


class CustomerRepository:
    """Repository for customer operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_customer(
        self,
        customer_code: str,
        full_name: str,
        phone_number: Optional[str] = None,
        email: Optional[str] = None,
        gender: Optional[str] = None,
        date_of_birth: Optional[date] = None,
        nationality: Optional[str] = None,
        address: Optional[str] = None,
        customer_type: str = "Registered",
        user_id: Optional[int] = None,
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
        customer = Customer(
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
        self.db.add(customer)
        await self.db.commit()
        await self.db.refresh(customer)
        return customer
    
    async def get_by_id(self, customer_id: int) -> Optional[Customer]:
        """Get customer by ID"""
        result = await self.db.execute(
            select(Customer).where(Customer.customer_id == customer_id)
        )
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[Customer]:
        """Get customer by email"""
        result = await self.db.execute(
            select(Customer).where(Customer.email == email)
        )
        return result.scalar_one_or_none()

    async def get_by_phone_number(self, phone_number: str) -> Optional[Customer]:
        """Get customer by phone number"""
        result = await self.db.execute(
            select(Customer).where(Customer.phone_number == phone_number)
        )
        return result.scalar_one_or_none()

    async def get_by_email_or_phone(self, email: Optional[str] = None, phone_number: Optional[str] = None) -> Optional[Customer]:
        """Get customer by email or phone"""
        conditions = []
        if email:
            conditions.append(Customer.email == email)
        if phone_number:
            conditions.append(Customer.phone_number == phone_number)
        if not conditions:
            return None

        result = await self.db.execute(
            select(Customer).where(or_(*conditions))
        )
        return result.scalar_one_or_none()
    
    async def get_by_identifier(self, identifier: str) -> Optional[Customer]:
        """Get customer by NIN, Passport, or Phone"""
        result = await self.db.execute(
            select(Customer).where(
                or_(
                    Customer.nin == identifier,
                    Customer.passport_number == identifier,
                    Customer.phone_number == identifier
                )
            )
        )
        return result.scalar_one_or_none()
    
    async def get_all_customers(self, skip: int = 0, limit: int = 100) -> List[Customer]:
        """Get all customers"""
        result = await self.db.execute(
            select(Customer).order_by(Customer.customer_id.desc()).offset(skip).limit(limit)
        )
        return result.scalars().all()

    async def search_customers(self, query: str, skip: int = 0, limit: int = 50) -> List[Customer]:
        """Search customers by name, phone, email, NIN, passport"""
        q = f"%{query}%"
        result = await self.db.execute(
            select(Customer).where(
                or_(
                    Customer.full_name.ilike(q),
                    Customer.phone_number.ilike(q),
                    Customer.email.ilike(q),
                    Customer.nin.ilike(q),
                    Customer.passport_number.ilike(q)
                )
            ).order_by(Customer.customer_id.desc()).offset(skip).limit(limit)
        )
        return result.scalars().all()

    async def update_customer(self, customer: Customer) -> Customer:
        """Update and persist a customer instance"""
        self.db.add(customer)
        await self.db.commit()
        await self.db.refresh(customer)
        return customer

    async def deactivate_customer(self, customer_id: int) -> bool:
        result = await self.db.execute(
            select(Customer).where(Customer.customer_id == customer_id)
        )
        cust = result.scalar_one_or_none()
        if not cust:
            return False
        cust.is_active = False
        self.db.add(cust)
        await self.db.commit()
        return True

    async def get_customer_transactions(self, customer_id: int, limit: int = 50) -> List[dict]:
        """Return recent transactions (payments, orders, reservations) for a customer"""
        txs = []
        # payments
        pay_res = await self.db.execute(
            select(Payment).where(Payment.customer_id == customer_id).order_by(Payment.payment_date.desc()).limit(limit)
        )
        for p in pay_res.scalars().all():
            txs.append({"type": "payment", "reference_id": p.payment_id, "amount": p.amount_paid, "currency": p.currency, "date": p.payment_date, "description": p.payment_reference})

        # orders
        ord_res = await self.db.execute(
            select(RestaurantOrder).where(RestaurantOrder.customer_id == customer_id).order_by(RestaurantOrder.created_at.desc()).limit(limit)
        )
        for o in ord_res.scalars().all():
            txs.append({"type": "order", "reference_id": o.order_id, "amount": o.total_amount, "currency": None, "date": o.created_at, "description": o.order_number})

        # accommodation
        acc_res = await self.db.execute(
            select(AccommodationReservation).where(AccommodationReservation.customer_id == customer_id).order_by(AccommodationReservation.created_at.desc()).limit(limit)
        )
        for a in acc_res.scalars().all():
            txs.append({"type": "accommodation", "reference_id": a.reservation_id, "amount": a.total_amount, "currency": None, "date": a.created_at, "description": a.reservation_code})

        # sort and trim
        txs_sorted = sorted(txs, key=lambda x: x["date"] or datetime.utcnow(), reverse=True)
        return txs_sorted[:limit]

    async def get_top_customers(self, limit: int = 10) -> List[Customer]:
        result = await self.db.execute(
            select(Customer).order_by(Customer.total_spent.desc()).limit(limit)
        )
        return result.scalars().all()

    async def get_vip_customers(self, min_spent: float = 1000000.0) -> List[Customer]:
        result = await self.db.execute(
            select(Customer).where(Customer.total_spent >= min_spent).order_by(Customer.total_spent.desc())
        )
        return result.scalars().all()


class MenuRepository:
    """Repository for menu operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_all_categories(self) -> List[MenuCategory]:
        """Get all menu categories"""
        result = await self.db.execute(
            select(MenuCategory).where(MenuCategory.is_active == True)
        )
        return result.scalars().all()

    async def create_menu_category(self, category_name: str, description: Optional[str] = None, image_url: Optional[str] = None, sort_order: int = 0, is_active: bool = True) -> MenuCategory:
        category = MenuCategory(
            category_name=category_name,
            description=description,
            image_url=image_url,
            sort_order=sort_order,
            is_active=is_active
        )
        self.db.add(category)
        await self.db.commit()
        await self.db.refresh(category)
        return category

    async def get_menu_category(self, category_id: int) -> Optional[MenuCategory]:
        """Get a menu category by ID"""
        result = await self.db.execute(
            select(MenuCategory).where(MenuCategory.category_id == category_id)
        )
        return result.scalar_one_or_none()

    async def update_menu_category(self, category_id: int, **kwargs) -> Optional[MenuCategory]:
        """Update a menu category"""
        result = await self.db.execute(
            select(MenuCategory).where(MenuCategory.category_id == category_id)
        )
        category = result.scalar_one_or_none()
        if not category:
            return None
            
        for key, value in kwargs.items():
            if value is not None:
                setattr(category, key, value)
                
        self.db.add(category)
        await self.db.commit()
        await self.db.refresh(category)
        return category

    async def delete_menu_category(self, category_id: int) -> bool:
        """Deactivate a menu category (soft delete)"""
        result = await self.db.execute(
            select(MenuCategory).where(MenuCategory.category_id == category_id)
        )
        category = result.scalar_one_or_none()
        if not category:
            return False
            
        category.is_active = False
        self.db.add(category)
        await self.db.commit()
        return True
    
    async def get_items_by_category(self, category_id: int) -> List[MenuItem]:
        """Get menu items by category"""
        result = await self.db.execute(
            select(MenuItem)
            .where(
                and_(
                    MenuItem.category_id == category_id,
                    MenuItem.is_active == True
                )
            )
            .options(
                selectinload(MenuItem.extras),
                selectinload(MenuItem.choices),
                selectinload(MenuItem.accompaniments)
            )
        )
        return result.scalars().all()

    async def get_all_items(self) -> List[MenuItem]:
        result = await self.db.execute(
            select(MenuItem)
            .where(MenuItem.is_active == True)
            .options(
                selectinload(MenuItem.extras),
                selectinload(MenuItem.choices),
                selectinload(MenuItem.accompaniments)
            )
        )
        return result.scalars().all()

    async def create_menu_item(self, category_id: int, item_name: str, price, description: Optional[str] = None, image_url: Optional[str] = None, allergen_info: Optional[str] = None, preparation_time: Optional[int] = None, is_available: bool = True, is_active: bool = True, quantity: int = 0) -> MenuItem:
        item = MenuItem(
            category_id=category_id,
            item_name=item_name,
            price=price,
            description=description,
            image_url=image_url,
            allergen_info=allergen_info,
            preparation_time=preparation_time,
            is_available=is_available,
            is_active=is_active,
            quantity=quantity
        )
        self.db.add(item)
        await self.db.commit()
        await self.db.refresh(item)

        result = await self.db.execute(
            select(MenuItem)
            .where(MenuItem.menu_item_id == item.menu_item_id)
            .options(
                selectinload(MenuItem.extras),
                selectinload(MenuItem.choices),
                selectinload(MenuItem.accompaniments)
            )
        )
        return result.scalar_one()

    async def create_menu_extra_for_item(self, menu_item_id: int, extra_name: str, price, is_available: bool = True) -> MenuExtra:
        extra = MenuExtra(
            extra_name=extra_name,
            price=price,
            is_available=is_available,
            menu_item_id=menu_item_id,
            image_url=None
        )
        self.db.add(extra)
        await self.db.commit()
        await self.db.refresh(extra)
        return extra
    
    async def get_menu_item(self, item_id: int) -> Optional[MenuItem]:
        """Get menu item by ID"""
        result = await self.db.execute(
            select(MenuItem)
            .where(MenuItem.menu_item_id == item_id)
            .options(
                selectinload(MenuItem.extras),
                selectinload(MenuItem.choices),
                selectinload(MenuItem.accompaniments)
            )
        )
        return result.scalar_one_or_none()

    async def create_menu_choice_for_item(self, menu_item_id: int, choice_name: str, price: Optional[Decimal] = None, is_available: bool = True) -> MenuChoice:
        choice = MenuChoice(
            choice_name=choice_name,
            price=price,
            is_available=is_available,
            menu_item_id=menu_item_id
        )
        self.db.add(choice)
        await self.db.commit()
        await self.db.refresh(choice)
        return choice

    async def get_menu_choice(self, choice_id: int) -> Optional[MenuChoice]:
        result = await self.db.execute(
            select(MenuChoice).where(MenuChoice.choice_id == choice_id)
        )
        return result.scalar_one_or_none()

    async def update_menu_choice(self, choice_id: int, updates: dict) -> Optional[MenuChoice]:
        choice = await self.get_menu_choice(choice_id)
        if not choice:
            return None
        for k, v in updates.items():
            if hasattr(choice, k) and v is not None:
                setattr(choice, k, v)
        self.db.add(choice)
        await self.db.commit()
        await self.db.refresh(choice)
        return choice

    async def delete_menu_choice(self, choice_id: int) -> bool:
        choice = await self.get_menu_choice(choice_id)
        if choice:
            await self.db.delete(choice)
            await self.db.commit()
            return True
        return False

    async def create_menu_accompaniment_for_item(self, menu_item_id: int, accompaniment_name: str, price: Optional[Decimal] = None, is_available: bool = True) -> MenuAccompaniment:
        accompaniment = MenuAccompaniment(
            accompaniment_name=accompaniment_name,
            price=price,
            is_available=is_available,
            menu_item_id=menu_item_id
        )
        self.db.add(accompaniment)
        await self.db.commit()
        await self.db.refresh(accompaniment)
        return accompaniment

    async def get_menu_accompaniment(self, accompaniment_id: int) -> Optional[MenuAccompaniment]:
        result = await self.db.execute(
            select(MenuAccompaniment).where(MenuAccompaniment.accompaniment_id == accompaniment_id)
        )
        return result.scalar_one_or_none()

    async def update_menu_accompaniment(self, accompaniment_id: int, updates: dict) -> Optional[MenuAccompaniment]:
        accompaniment = await self.get_menu_accompaniment(accompaniment_id)
        if not accompaniment:
            return None
        for k, v in updates.items():
            if hasattr(accompaniment, k) and v is not None:
                setattr(accompaniment, k, v)
        self.db.add(accompaniment)
        await self.db.commit()
        await self.db.refresh(accompaniment)
        return accompaniment

    async def delete_menu_accompaniment(self, accompaniment_id: int) -> bool:
        accompaniment = await self.get_menu_accompaniment(accompaniment_id)
        if accompaniment:
            await self.db.delete(accompaniment)
            await self.db.commit()
            return True
        return False

    async def get_menu_extra(self, extra_id: int) -> Optional[MenuExtra]:
        result = await self.db.execute(
            select(MenuExtra).where(MenuExtra.extra_id == extra_id)
        )
        return result.scalar_one_or_none()

    async def update_menu_extra(self, extra_id: int, updates: dict) -> Optional[MenuExtra]:
        extra = await self.get_menu_extra(extra_id)
        if not extra:
            return None
        for k, v in updates.items():
            if hasattr(extra, k) and v is not None:
                setattr(extra, k, v)
        self.db.add(extra)
        await self.db.commit()
        await self.db.refresh(extra)
        return extra

    async def delete_menu_extra(self, extra_id: int) -> bool:
        extra = await self.get_menu_extra(extra_id)
        if extra:
            await self.db.delete(extra)
            await self.db.commit()
            return True
        return False

    async def update_menu_item(self, item_id: int, **kwargs) -> Optional[MenuItem]:
        """Update a menu item"""
        result = await self.db.execute(
            select(MenuItem).where(MenuItem.menu_item_id == item_id)
        )
        item = result.scalar_one_or_none()
        if not item:
            return None
        
        for key, value in kwargs.items():
            if value is not None:
                setattr(item, key, value)
                
        self.db.add(item)
        await self.db.commit()
        await self.db.refresh(item)
        
        # Reload with extras preloaded
        result = await self.db.execute(
            select(MenuItem)
            .where(MenuItem.menu_item_id == item_id)
            .options(selectinload(MenuItem.extras))
        )
        return result.scalar_one_or_none()

    async def delete_menu_item(self, item_id: int) -> bool:
        """Deactivate a menu item (soft delete)"""
        result = await self.db.execute(
            select(MenuItem).where(MenuItem.menu_item_id == item_id)
        )
        item = result.scalar_one_or_none()
        if not item:
            return False
            
        item.is_active = False
        item.is_available = False
        self.db.add(item)
        await self.db.commit()
        return True


class RestaurantOrderRepository:
    """Repository for restaurant order operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_order(self, order_number: str, customer_id: Optional[int] = None) -> RestaurantOrder:
        """Create a new restaurant order"""
        order = RestaurantOrder(
            order_number=order_number,
            customer_id=customer_id,
            order_status="Pending",
            payment_status="Pending"
        )
        self.db.add(order)
        await self.db.commit()
        return await self.get_by_id(order.order_id)
    
    async def get_by_id(self, order_id: int) -> Optional[RestaurantOrder]:
        """Get order by ID"""
        result = await self.db.execute(
            select(RestaurantOrder)
            .where(RestaurantOrder.order_id == order_id)
            .options(
                selectinload(RestaurantOrder.items).selectinload(OrderItem.extras).selectinload(OrderItemExtra.extra),
                selectinload(RestaurantOrder.items).selectinload(OrderItem.choice),
                selectinload(RestaurantOrder.items).selectinload(OrderItem.accompaniment),
                selectinload(RestaurantOrder.items).selectinload(OrderItem.menu_item)
            )
        )
        return result.scalar_one_or_none()
    
    async def get_by_number(self, order_number: str) -> Optional[RestaurantOrder]:
        """Get order by order number"""
        result = await self.db.execute(
            select(RestaurantOrder)
            .where(RestaurantOrder.order_number == order_number)
            .options(
                selectinload(RestaurantOrder.items).selectinload(OrderItem.extras).selectinload(OrderItemExtra.extra),
                selectinload(RestaurantOrder.items).selectinload(OrderItem.choice),
                selectinload(RestaurantOrder.items).selectinload(OrderItem.accompaniment),
                selectinload(RestaurantOrder.items).selectinload(OrderItem.menu_item)
            )
        )
        return result.scalar_one_or_none()
    
    async def get_customer_orders(self, customer_id: int, skip: int = 0, limit: Optional[int] = None) -> List[RestaurantOrder]:
        """Get orders for a customer"""
        query = (
            select(RestaurantOrder)
            .where(RestaurantOrder.customer_id == customer_id)
            .options(
                selectinload(RestaurantOrder.items).selectinload(OrderItem.extras).selectinload(OrderItemExtra.extra),
                selectinload(RestaurantOrder.items).selectinload(OrderItem.choice),
                selectinload(RestaurantOrder.items).selectinload(OrderItem.accompaniment),
                selectinload(RestaurantOrder.items).selectinload(OrderItem.menu_item)
            )
        )
        if skip:
            query = query.offset(skip)
        if limit is not None:
            query = query.limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()

    async def delete_order(self, order_id: int) -> bool:
        """Delete an order by ID"""
        order = await self.get_by_id(order_id)
        if not order:
            return False
        
        await self.db.delete(order)
        await self.db.commit()
        return True


class AccommodationRepository:
    """Repository for accommodation operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_available_rooms(self, check_in: str, check_out: str) -> List[Room]:
        """Get available rooms for date range"""
        result = await self.db.execute(
            select(Room)
            .options(
                selectinload(Room.category).selectinload(RoomCategory.beds),
                selectinload(Room.category).selectinload(RoomCategory.views),
                selectinload(Room.category).selectinload(RoomCategory.bathroom_features),
                selectinload(Room.category).selectinload(RoomCategory.room_facilities),
                selectinload(Room.category).selectinload(RoomCategory.images),
                selectinload(Room.category).selectinload(RoomCategory.amenity_assignments).selectinload(RoomAmenity.amenity).selectinload(Amenity.category),
                selectinload(Room.category).selectinload(RoomCategory.available_rates),
                selectinload(Room.category).selectinload(RoomCategory.policies)
            )
            .where(
                and_(
                    Room.room_status == "Available",
                    Room.is_active == True
                )
            )
        )
        return result.scalars().all()
    
    async def get_room_by_id(self, room_id: int) -> Optional[Room]:
        """Get room by ID"""
        result = await self.db.execute(
            select(Room)
            .options(
                selectinload(Room.category).selectinload(RoomCategory.beds),
                selectinload(Room.category).selectinload(RoomCategory.views),
                selectinload(Room.category).selectinload(RoomCategory.bathroom_features),
                selectinload(Room.category).selectinload(RoomCategory.room_facilities),
                selectinload(Room.category).selectinload(RoomCategory.images),
                selectinload(Room.category).selectinload(RoomCategory.amenity_assignments).selectinload(RoomAmenity.amenity).selectinload(Amenity.category),
                selectinload(Room.category).selectinload(RoomCategory.available_rates),
                selectinload(Room.category).selectinload(RoomCategory.policies)
            )
            .where(Room.room_id == room_id)
        )
        return result.scalar_one_or_none()
    
    async def get_room_category_by_id(self, room_category_id: int) -> Optional[RoomCategory]:
        """Get room category by ID"""
        result = await self.db.execute(
            select(RoomCategory)
            .options(
                selectinload(RoomCategory.beds),
                selectinload(RoomCategory.views),
                selectinload(RoomCategory.bathroom_features),
                selectinload(RoomCategory.room_facilities),
                selectinload(RoomCategory.images),
                selectinload(RoomCategory.amenity_assignments).selectinload(RoomAmenity.amenity).selectinload(Amenity.category),
                selectinload(RoomCategory.available_rates),
                selectinload(RoomCategory.policies)
            )
            .where(RoomCategory.room_category_id == room_category_id)
        )
        return result.scalar_one_or_none()
    
    async def create_reservation(self, customer_id: int, room_id: Optional[int], check_in_date, check_out_date, num_nights: int, rate_per_night, total_amount, reservation_code: str, room_category_id: Optional[int] = None) -> AccommodationReservation:
        """Create a new accommodation reservation"""
        reservation = AccommodationReservation(
            customer_id=customer_id,
            room_id=room_id,
            room_category_id=room_category_id,
            check_in_date=check_in_date,
            check_out_date=check_out_date,
            num_nights=num_nights,
            rate_per_night=rate_per_night,
            total_amount=total_amount,
            reservation_code=reservation_code,
            reservation_status="Pending",
            payment_status="Pending"
        )
        self.db.add(reservation)
        await self.db.commit()
        await self.db.refresh(reservation)
        return reservation
    
    async def get_reservation_by_id(self, reservation_id: int) -> Optional[AccommodationReservation]:
        """Get reservation by ID"""
        result = await self.db.execute(
            select(AccommodationReservation).where(AccommodationReservation.reservation_id == reservation_id)
        )
        return result.scalar_one_or_none()
    
    async def get_customer_reservations(self, customer_id: int, skip: int = 0, limit: int = 50) -> List[AccommodationReservation]:
        """Get reservations for a customer"""
        result = await self.db.execute(
            select(AccommodationReservation)
            .where(AccommodationReservation.customer_id == customer_id)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()


class ConferenceRepository:
    """Repository for conference operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_all_halls(self) -> List[ConferenceHall]:
        """Get all conference halls"""
        result = await self.db.execute(
            select(ConferenceHall)
            .options(
                selectinload(ConferenceHall.photos_rel),
                selectinload(ConferenceHall.facilities)
                .selectinload(ConferenceHallFacility.facility)
                .selectinload(ConferenceFacility.category_relation)
            )
            .where(ConferenceHall.is_active == True)
        )
        return result.scalars().all()
    
    async def create_hall(
        self,
        hall_name: str,
        capacity: int,
        standard_price: Optional[Decimal] = None,
        hourly_rate: Optional[Decimal] = None,
        half_day_rate: Optional[Decimal] = None,
        full_day_rate: Optional[Decimal] = None,
        description: Optional[str] = None,
        image: Optional[str] = None,
        photos: Optional[List[str]] = None,
        main_photo_index: Optional[int] = 0,
        facility_ids: Optional[List[int]] = None
    ) -> ConferenceHall:
        """Create a new conference hall"""
        std_price = standard_price if standard_price is not None else full_day_rate
        hall = ConferenceHall(
            hall_name=hall_name,
            capacity=capacity,
            standard_price=std_price,
            hourly_rate=hourly_rate,
            half_day_rate=half_day_rate,
            full_day_rate=full_day_rate,
            description=description,
            image=image,
            main_photo_index=main_photo_index or 0,
            is_active=True
        )
        self.db.add(hall)
        await self.db.flush()
        
        if photos:
            for idx, p_url in enumerate(photos):
                self.db.add(HallPhoto(hall_id=hall.hall_id, photo_url=p_url, sort_order=idx))

        if facility_ids:
            for fid in facility_ids:
                hall_facility = ConferenceHallFacility(
                    hall_id=hall.hall_id,
                    facility_id=fid,
                    status="Available"
                )
                self.db.add(hall_facility)
                
        await self.db.commit()
        self.db.expire_all()
        
        # Load the newly created hall with its facilities
        return await self.get_hall_by_id(hall.hall_id)

    async def update_hall(
        self,
        hall_id: int,
        hall_name: Optional[str] = None,
        capacity: Optional[int] = None,
        standard_price: Optional[Decimal] = None,
        hourly_rate: Optional[Decimal] = None,
        half_day_rate: Optional[Decimal] = None,
        full_day_rate: Optional[Decimal] = None,
        description: Optional[str] = None,
        image: Optional[str] = None,
        photos: Optional[List[str]] = None,
        main_photo_index: Optional[int] = None,
        is_active: Optional[bool] = None,
        facility_ids: Optional[List[int]] = None
    ) -> Optional[ConferenceHall]:
        """Update a conference hall"""
        result = await self.db.execute(
            select(ConferenceHall).where(ConferenceHall.hall_id == hall_id)
        )
        hall = result.scalar_one_or_none()
        if not hall:
            return None

        if hall_name is not None:
            hall.hall_name = hall_name
        if capacity is not None:
            hall.capacity = capacity
        if standard_price is not None:
            hall.standard_price = standard_price
        elif full_day_rate is not None:
            hall.standard_price = full_day_rate

        if hourly_rate is not None:
            hall.hourly_rate = hourly_rate
        if half_day_rate is not None:
            hall.half_day_rate = half_day_rate
        if full_day_rate is not None:
            hall.full_day_rate = full_day_rate

        if description is not None:
            hall.description = description
        if image is not None:
            hall.image = image
        if main_photo_index is not None:
            hall.main_photo_index = main_photo_index
        if is_active is not None:
            hall.is_active = is_active

        if photos is not None:
            from sqlalchemy import delete
            await self.db.execute(
                delete(HallPhoto).where(HallPhoto.hall_id == hall_id)
            )
            for idx, p_url in enumerate(photos):
                self.db.add(HallPhoto(hall_id=hall_id, photo_url=p_url, sort_order=idx))

        if facility_ids is not None:
            from sqlalchemy import delete
            # Delete existing facility associations
            await self.db.execute(
                delete(ConferenceHallFacility).where(ConferenceHallFacility.hall_id == hall_id)
            )
            # Re-add specified facilities
            for fid in facility_ids:
                hall_facility = ConferenceHallFacility(
                    hall_id=hall_id,
                    facility_id=fid,
                    status="Available"
                )
                self.db.add(hall_facility)

        self.db.add(hall)
        await self.db.commit()
        self.db.expire_all()
        return await self.get_hall_by_id(hall_id)

    async def assign_facilities_to_hall(self, hall_id: int, facility_ids: List[int]) -> Optional[ConferenceHall]:
        """Assign facilities list (multiple) to a conference hall"""
        return await self.update_hall(hall_id=hall_id, facility_ids=facility_ids)

    async def add_facility_to_hall(self, hall_id: int, facility_id: int) -> Optional[ConferenceHall]:
        """Add a single facility to a hall without removing existing ones"""
        from sqlalchemy import select
        existing = await self.db.execute(
            select(ConferenceHallFacility).where(
                ConferenceHallFacility.hall_id == hall_id,
                ConferenceHallFacility.facility_id == facility_id
            )
        )
        if not existing.scalar_one_or_none():
            hall_fac = ConferenceHallFacility(
                hall_id=hall_id,
                facility_id=facility_id,
                status="Available"
            )
            self.db.add(hall_fac)
            await self.db.commit()
        return await self.get_hall_by_id(hall_id)

    async def remove_facility_from_hall(self, hall_id: int, facility_id: int) -> Optional[ConferenceHall]:
        """Remove a single facility association from a hall"""
        from sqlalchemy import delete
        await self.db.execute(
            delete(ConferenceHallFacility).where(
                ConferenceHallFacility.hall_id == hall_id,
                ConferenceHallFacility.facility_id == facility_id
            )
        )
        await self.db.commit()
        return await self.get_hall_by_id(hall_id)

    async def delete_hall(self, hall_id: int) -> bool:
        """Delete a conference hall"""
        result = await self.db.execute(
            select(ConferenceHall).where(ConferenceHall.hall_id == hall_id)
        )
        hall = result.scalar_one_or_none()
        if not hall:
            return False
        await self.db.delete(hall)
        await self.db.commit()
        return True
    
    async def get_all_reservations(self) -> List[ConferenceReservation]:
        """Get all conference reservations"""
        result = await self.db.execute(
            select(ConferenceReservation)
            .options(
                selectinload(ConferenceReservation.customer), 
                selectinload(ConferenceReservation.hall)
                .selectinload(ConferenceHall.photos_rel),
                selectinload(ConferenceReservation.hall)
                .selectinload(ConferenceHall.facilities)
                .selectinload(ConferenceHallFacility.facility)
                .selectinload(ConferenceFacility.category_relation),
                selectinload(ConferenceReservation.facility_bookings)
                .selectinload(ConferenceBookingFacility.facility)
                .selectinload(ConferenceFacility.category_relation)
            )
            .order_by(ConferenceReservation.created_at.desc())
        )
        return result.scalars().all()
    
    async def get_hall_by_id(self, hall_id: int) -> Optional[ConferenceHall]:
        """Get hall by ID"""
        result = await self.db.execute(
            select(ConferenceHall)
            .options(
                selectinload(ConferenceHall.photos_rel),
                selectinload(ConferenceHall.facilities)
                .selectinload(ConferenceHallFacility.facility)
                .selectinload(ConferenceFacility.category_relation)
            )
            .where(ConferenceHall.hall_id == hall_id)
        )
        return result.scalar_one_or_none()
    
    async def create_reservation(
        self,
        customer_id: int,
        hall_id: int,
        event_name: str,
        event_start_date,
        event_end_date,
        start_time,
        end_time,
        num_participants: Optional[int] = 1,
        reservation_code: str = "",
        total_amount: Decimal = Decimal('0.00'),
        subtotal: Decimal = Decimal('0.00'),
        hall_standard_price: Optional[Decimal] = Decimal('0.00'),
        amount_paid: Decimal = Decimal('0.00'),
        balance_due: Optional[Decimal] = Decimal('0.00'),
        payment_responsibility: str = "Individual",
        booking_type: Optional[str] = "Standard",
        special_requests: Optional[str] = None
    ) -> ConferenceReservation:
        """Create a new conference reservation"""
        reservation = ConferenceReservation(
            customer_id=customer_id,
            hall_id=hall_id,
            event_name=event_name,
            event_start_date=event_start_date,
            event_end_date=event_end_date,
            start_time=start_time,
            end_time=end_time,
            num_participants=num_participants,
            booking_type=booking_type or "Standard",
            reservation_code=reservation_code,
            total_amount=total_amount,
            subtotal=subtotal,
            hall_cost=hall_standard_price or Decimal('0.00'),
            hall_unit_price=hall_standard_price or Decimal('0.00'),
            payment_responsibility=payment_responsibility,
            amount_paid=amount_paid,
            balance_due=balance_due,
            special_requests=special_requests,
            reservation_status="Pending",
            payment_status="Pending"
        )
        self.db.add(reservation)
        await self.db.commit()
        await self.db.refresh(reservation)
        return await self.get_reservation_by_id(reservation.conference_res_id)
    
    async def get_reservation_by_id(self, conference_res_id: int) -> Optional[ConferenceReservation]:
        """Get reservation by ID"""
        result = await self.db.execute(
            select(ConferenceReservation)
            .options(
                selectinload(ConferenceReservation.customer), 
                selectinload(ConferenceReservation.hall)
                .selectinload(ConferenceHall.facilities)
                .selectinload(ConferenceHallFacility.facility)
                .selectinload(ConferenceFacility.category_relation),
                selectinload(ConferenceReservation.facility_bookings)
                .selectinload(ConferenceBookingFacility.facility)
                .selectinload(ConferenceFacility.category_relation)
            )
            .where(ConferenceReservation.conference_res_id == conference_res_id)
        )
        return result.scalar_one_or_none()


class PaymentRepository:
    """Repository for payment operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_payment(self, customer_id: Optional[int], payment_type: str, reference_type: str, reference_id: int, payment_method: str, amount_paid, payment_reference: str) -> Payment:
        """Create a new payment"""
        payment = Payment(
            customer_id=customer_id,
            payment_type=payment_type,
            reference_type=reference_type,
            reference_id=reference_id,
            payment_method=payment_method,
            amount_paid=amount_paid,
            payment_reference=payment_reference,
            payment_status="Pending"
        )
        self.db.add(payment)
        await self.db.commit()
        await self.db.refresh(payment)
        return payment
    
    async def get_by_id(self, payment_id: int) -> Optional[Payment]:
        """Get payment by ID"""
        result = await self.db.execute(
            select(Payment).where(Payment.payment_id == payment_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_reference(self, payment_reference: str) -> Optional[Payment]:
        """Get payment by reference"""
        result = await self.db.execute(
            select(Payment).where(Payment.payment_reference == payment_reference)
        )
        return result.scalar_one_or_none()


class ReviewRepository:
    """Repository for review operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_review(self, customer_id: int, review_type: str, reference_id: int, rating: int, comment: Optional[str] = None) -> CustomerReview:
        """Create a new review"""
        review = CustomerReview(
            customer_id=customer_id,
            review_type=review_type,
            reference_id=reference_id,
            rating=rating,
            comment=comment,
            is_published=True
        )
        self.db.add(review)
        await self.db.commit()
        await self.db.refresh(review)
        return review
    
    async def get_by_id(self, review_id: int) -> Optional[CustomerReview]:
        """Get review by ID"""
        result = await self.db.execute(
            select(CustomerReview).where(CustomerReview.review_id == review_id)
        )
        return result.scalar_one_or_none()
    
    async def get_for_reference(self, review_type: str, reference_id: int) -> List[CustomerReview]:
        """Get reviews for a specific reference"""
        result = await self.db.execute(
            select(CustomerReview).where(
                and_(
                    CustomerReview.review_type == review_type,
                    CustomerReview.reference_id == reference_id,
                    CustomerReview.is_published == True
                )
            )
        )
        return result.scalars().all()


class PasswordResetRepository:
    """Repository for password reset operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        
    async def create_token(self, user_id: int, token: str, expires_at: datetime) -> PasswordResetToken:
        """Create a new password reset token"""
        reset_token = PasswordResetToken(
            user_id=user_id,
            token=token,
            expires_at=expires_at
        )
        self.db.add(reset_token)
        await self.db.commit()
        await self.db.refresh(reset_token)
        return reset_token
        
    async def get_token(self, token: str) -> Optional[PasswordResetToken]:
        """Get token details with eager loaded user"""
        result = await self.db.execute(
            select(PasswordResetToken)
            .where(PasswordResetToken.token == token)
            .options(selectinload(PasswordResetToken.user))
        )
        return result.scalar_one_or_none()
        
    async def mark_used(self, token_obj: PasswordResetToken) -> None:
        """Mark token as used"""
        token_obj.used_at = datetime.utcnow()
        self.db.add(token_obj)
        await self.db.commit()


class EmailVerificationRepository:
    """Repository for email verification code and token operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_code(self, email: str, code: str, expires_at: datetime) -> EmailVerificationCode:
        """Create a new 4-digit code record and invalidate any previous unverified codes for this email"""
        clean_email = email.lower().strip()
        await self.db.execute(
            delete(EmailVerificationCode).where(
                and_(
                    EmailVerificationCode.email == clean_email,
                    EmailVerificationCode.is_verified == False
                )
            )
        )
        record = EmailVerificationCode(
            email=clean_email,
            code=code,
            attempts=0,
            is_verified=False,
            expires_at=expires_at
        )
        self.db.add(record)
        await self.db.commit()
        await self.db.refresh(record)
        return record

    async def get_latest_by_email(self, email: str) -> Optional[EmailVerificationCode]:
        """Fetch the most recent verification record for an email"""
        clean_email = email.lower().strip()
        stmt = (
            select(EmailVerificationCode)
            .where(EmailVerificationCode.email == clean_email)
            .order_by(desc(EmailVerificationCode.created_at))
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def increment_attempts(self, record: EmailVerificationCode) -> int:
        """Increment failed verification attempts"""
        record.attempts += 1
        self.db.add(record)
        await self.db.commit()
        return record.attempts

    async def mark_verified(self, record: EmailVerificationCode, token: str) -> EmailVerificationCode:
        """Mark record as verified and issue verification token"""
        record.is_verified = True
        record.verified_at = datetime.utcnow()
        record.verification_token = token
        self.db.add(record)
        await self.db.commit()
        await self.db.refresh(record)
        return record

    async def get_by_token(self, token: str) -> Optional[EmailVerificationCode]:
        """Find verification record by one-time registration token"""
        stmt = (
            select(EmailVerificationCode)
            .where(EmailVerificationCode.verification_token == token)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def consume_token(self, record: EmailVerificationCode) -> None:
        """Consume/delete verification token after registration completes"""
        await self.db.delete(record)
        await self.db.commit()


# Import new repository
from app.repositories.payment_method import PaymentMethodRepository
from app.repositories.hotel_details import HotelDetailsRepository
