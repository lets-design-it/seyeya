"""
Repository implementations for different modules
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload
from typing import Optional, List
from datetime import datetime, date
from decimal import Decimal
from app.models import (
    User, Customer, RestaurantOrder, AccommodationReservation, 
    ConferenceReservation, MenuItem, MenuCategory, Room, ConferenceHall,
    Payment, CustomerReview, OrderItem, OrderItemExtra, MenuExtra, MenuChoice, MenuAccompaniment,
    Role, Permission, PermissionGroup, UserRole, RolePermission, PasswordResetToken
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

    async def delete_user(self, user_id: int) -> bool:
        """Attempt hard delete, fallback to soft delete for relational integrity"""
        user = await self.get_by_id(user_id)
        if user:
            try:
                # Attempt to hard delete the user and cascade related roles/sessions/tokens
                await self.db.delete(user)
                await self.db.commit()
                return True
            except Exception:
                # Fallback to soft delete if there are active references in other tables
                await self.db.rollback()
                # Re-fetch user in new transaction context and deactivate
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
            select(Customer).offset(skip).limit(limit)
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
            ).offset(skip).limit(limit)
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
    
    async def get_customer_orders(self, customer_id: int, skip: int = 0, limit: int = 50) -> List[RestaurantOrder]:
        """Get orders for a customer"""
        result = await self.db.execute(
            select(RestaurantOrder)
            .where(RestaurantOrder.customer_id == customer_id)
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
                selectinload(Room.category),
                selectinload(Room.beds),
                selectinload(Room.views),
                selectinload(Room.bathroom_features),
                selectinload(Room.room_facilities),
                selectinload(Room.images)
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
                selectinload(Room.category),
                selectinload(Room.beds),
                selectinload(Room.views),
                selectinload(Room.bathroom_features),
                selectinload(Room.room_facilities),
                selectinload(Room.images)
            )
            .where(Room.room_id == room_id)
        )
        return result.scalar_one_or_none()
    
    async def create_reservation(self, customer_id: int, room_id: int, check_in_date, check_out_date, num_nights: int, rate_per_night, total_amount, reservation_code: str) -> AccommodationReservation:
        """Create a new accommodation reservation"""
        reservation = AccommodationReservation(
            customer_id=customer_id,
            room_id=room_id,
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
            select(ConferenceHall).where(ConferenceHall.is_active == True)
        )
        return result.scalars().all()
    
    async def create_hall(self, hall_name: str, capacity: int, hourly_rate, half_day_rate, full_day_rate, description: Optional[str] = None, amenities: Optional[str] = None) -> ConferenceHall:
        """Create a new conference hall"""
        hall = ConferenceHall(
            hall_name=hall_name,
            capacity=capacity,
            hourly_rate=hourly_rate,
            half_day_rate=half_day_rate,
            full_day_rate=full_day_rate,
            description=description,
            amenities=amenities,
            is_active=True
        )
        self.db.add(hall)
        await self.db.commit()
        await self.db.refresh(hall)
        return hall
    
    async def get_all_reservations(self) -> List[ConferenceReservation]:
        """Get all conference reservations"""
        result = await self.db.execute(
            select(ConferenceReservation)
            .options(selectinload(ConferenceReservation.customer), selectinload(ConferenceReservation.hall))
            .order_by(ConferenceReservation.created_at.desc())
        )
        return result.scalars().all()
    
    async def get_hall_by_id(self, hall_id: int) -> Optional[ConferenceHall]:
        """Get hall by ID"""
        result = await self.db.execute(
            select(ConferenceHall).where(ConferenceHall.hall_id == hall_id)
        )
        return result.scalar_one_or_none()
    
    async def create_reservation(self, customer_id: int, hall_id: int, event_name: str, event_start_date, event_end_date, start_time, end_time, num_participants: int, booking_type: str, reservation_code: str, total_amount) -> ConferenceReservation:
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
            booking_type=booking_type,
            reservation_code=reservation_code,
            total_amount=total_amount,
            reservation_status="Pending",
            payment_status="Pending"
        )
        self.db.add(reservation)
        await self.db.commit()
        await self.db.refresh(reservation)
        return reservation
    
    async def get_reservation_by_id(self, conference_res_id: int) -> Optional[ConferenceReservation]:
        """Get reservation by ID"""
        result = await self.db.execute(
            select(ConferenceReservation)
            .options(selectinload(ConferenceReservation.customer), selectinload(ConferenceReservation.hall))
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


# Import new repository
from app.repositories.payment_method import PaymentMethodRepository
from app.repositories.hotel_details import HotelDetailsRepository
