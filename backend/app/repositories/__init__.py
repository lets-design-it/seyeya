"""
Repository implementations for different modules
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from typing import Optional, List
from datetime import datetime
from app.models import (
    User, Customer, RestaurantOrder, AccommodationReservation, 
    ConferenceReservation, MenuItem, MenuCategory, Room, ConferenceHall,
    Payment, CustomerReview, OrderItem
)


class UserRepository:
    """Repository for user operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()
    
    async def get_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID"""
        result = await self.db.execute(
            select(User).where(User.user_id == user_id)
        )
        return result.scalar_one_or_none()
    
    async def create_user(self, full_name: str, email: str, password_hash: str, phone_number: Optional[str] = None) -> User:
        """Create a new user"""
        user = User(
            full_name=full_name,
            email=email,
            password_hash=password_hash,
            phone_number=phone_number,
            is_active=True
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        return user
    
    async def get_all_users(self, skip: int = 0, limit: int = 100) -> List[User]:
        """Get all users"""
        result = await self.db.execute(
            select(User).offset(skip).limit(limit)
        )
        return result.scalars().all()


class CustomerRepository:
    """Repository for customer operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_customer(self, customer_code: str, full_name: str, phone_number: Optional[str] = None, email: Optional[str] = None) -> Customer:
        """Create a new customer"""
        customer = Customer(
            customer_code=customer_code,
            full_name=full_name,
            phone_number=phone_number,
            email=email,
            customer_type="Registered",
            is_active=True
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
    
    async def get_items_by_category(self, category_id: int) -> List[MenuItem]:
        """Get menu items by category"""
        result = await self.db.execute(
            select(MenuItem).where(
                and_(
                    MenuItem.category_id == category_id,
                    MenuItem.is_active == True
                )
            )
        )
        return result.scalars().all()
    
    async def get_menu_item(self, item_id: int) -> Optional[MenuItem]:
        """Get menu item by ID"""
        result = await self.db.execute(
            select(MenuItem).where(MenuItem.menu_item_id == item_id)
        )
        return result.scalar_one_or_none()


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
        await self.db.refresh(order)
        return order
    
    async def get_by_id(self, order_id: int) -> Optional[RestaurantOrder]:
        """Get order by ID"""
        result = await self.db.execute(
            select(RestaurantOrder).where(RestaurantOrder.order_id == order_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_number(self, order_number: str) -> Optional[RestaurantOrder]:
        """Get order by order number"""
        result = await self.db.execute(
            select(RestaurantOrder).where(RestaurantOrder.order_number == order_number)
        )
        return result.scalar_one_or_none()
    
    async def get_customer_orders(self, customer_id: int, skip: int = 0, limit: int = 50) -> List[RestaurantOrder]:
        """Get orders for a customer"""
        result = await self.db.execute(
            select(RestaurantOrder)
            .where(RestaurantOrder.customer_id == customer_id)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()


class AccommodationRepository:
    """Repository for accommodation operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def get_available_rooms(self, check_in: str, check_out: str) -> List[Room]:
        """Get available rooms for date range"""
        result = await self.db.execute(
            select(Room).where(
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
            select(Room).where(Room.room_id == room_id)
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
    
    async def get_hall_by_id(self, hall_id: int) -> Optional[ConferenceHall]:
        """Get hall by ID"""
        result = await self.db.execute(
            select(ConferenceHall).where(ConferenceHall.hall_id == hall_id)
        )
        return result.scalar_one_or_none()
    
    async def create_reservation(self, customer_id: int, hall_id: int, event_name: str, event_date, start_time, end_time, num_participants: int, booking_type: str, reservation_code: str, total_amount) -> ConferenceReservation:
        """Create a new conference reservation"""
        reservation = ConferenceReservation(
            customer_id=customer_id,
            hall_id=hall_id,
            event_name=event_name,
            event_date=event_date,
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
            select(ConferenceReservation).where(ConferenceReservation.conference_res_id == conference_res_id)
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
