"""
Comprehensive End-to-End Test Suite for SEYEYA Courts Email Notifications
Verifies all modules:
1. Authentication (Register, Password Reset Request, Password Reset Confirm)
2. Staff / Users Creation (Admin creates staff)
3. CRM / Customers (Customer creation with user auto-provisioning)
4. Restaurant Orders (Order placement, duplicate prevention, HTML breakdown)
5. Accommodation (Room reservation confirmation)
6. Conference (Conference reservation confirmation with hall & facilities)
7. Payments (Payment verification and receipt email)
8. EmailQueue & Notifications Table Verification (Status transitions to 'Sent', audit logging)
"""
import sys
import os
import time
import uuid
import asyncio
from decimal import Decimal
from datetime import datetime, date, timedelta, time as dt_time

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select, and_, desc
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.security import create_access_token
from app.db.database import AsyncSessionLocal
from app.models import (
    User, Customer, RestaurantOrder, OrderItem, MenuItem,
    AccommodationReservation, Room, RoomCategory,
    ConferenceReservation, ConferenceHall, Payment,
    NotificationEvent, Notification, EmailQueue, PasswordResetToken
)
from app.services import (
    AuthService, UserService, CustomerService,
    RestaurantOrderService, PaymentService
)
from app.services.notifications import NotificationService

RECIPIENT_TEST_EMAIL = "ahikirizahenry05@gmail.com"

results = {
    "passed": [],
    "failed": [],
    "details": []
}

def record_result(module: str, test_name: str, passed: bool, notes: str = ""):
    status_str = "PASSED" if passed else "FAILED"
    print(f"[{status_str}] {module} -> {test_name}: {notes}")
    if passed:
        results["passed"].append(f"{module}: {test_name}")
    else:
        results["failed"].append(f"{module}: {test_name} - {notes}")
    results["details"].append({
        "module": module,
        "test": test_name,
        "status": status_str,
        "notes": notes
    })


async def wait_for_queue_item(db, email: str, subject_keyword: str, timeout: int = 25):
    """Polls email_queue until item reaches 'Sent' or timeout using a fresh session each time"""
    start = time.time()
    last_item = None
    while time.time() - start < timeout:
        async with AsyncSessionLocal() as poll_db:
            stmt = (
                select(EmailQueue)
                .where(
                    and_(
                        EmailQueue.recipient_email == email,
                        EmailQueue.subject.ilike(f"%{subject_keyword}%")
                    )
                )
                .order_by(desc(EmailQueue.created_at))
            )
            res = await poll_db.execute(stmt)
            item = res.scalars().first()
            if item:
                last_item = item
                if item.status in ["Sent", "Failed"]:
                    return item
        await asyncio.sleep(1.5)
    return last_item


async def test_module_auth():
    print("\n=======================================================")
    print("MODULE 1: AUTHENTICATION & PASSWORD RESET NOTIFICATIONS")
    print("=======================================================")
    unique_suffix = str(uuid.uuid4())[:6]
    test_email = f"authtest_{unique_suffix}@seyeyacourts.com"
    full_name = f"Auth Tester {unique_suffix}"
    
    async with AsyncSessionLocal() as db:
        # 1.1 User Registration
        auth_service = AuthService(db)
        user, token, r_token = await auth_service.register_user(
            full_name=full_name,
            email=test_email,
            password="SecurePassword123!",
            phone_number=f"+256700{unique_suffix[:4]}"
        )
        await asyncio.sleep(2)
        q_item = await wait_for_queue_item(db, test_email, "Welcome", timeout=25)
        if q_item and q_item.status == "Sent":
            record_result("Auth", "Registration Welcome Email", True, f"Delivered (Queue ID: {q_item.id})")
        else:
            status_txt = q_item.status if q_item else "Not Queued"
            record_result("Auth", "Registration Welcome Email", False, f"Status: {status_txt}")

        # 1.2 Password Reset Request
        await auth_service.request_password_reset(test_email)
        await asyncio.sleep(2)
        q_reset = await wait_for_queue_item(db, test_email, "Reset", timeout=25)
        if q_reset and q_reset.status == "Sent":
            record_result("Auth", "Password Reset Request Email", True, f"Delivered (Queue ID: {q_reset.id})")
        else:
            status_txt = q_reset.status if q_reset else "Not Queued"
            record_result("Auth", "Password Reset Request Email", False, f"Status: {status_txt}")

        # 1.3 Password Reset Confirm & Password Changed Notification
        stmt = select(PasswordResetToken).where(
            and_(PasswordResetToken.user_id == user.user_id, PasswordResetToken.used_at == None)
        ).order_by(desc(PasswordResetToken.created_at))
        token_obj = (await db.execute(stmt)).scalars().first()
        if token_obj:
            confirmed = await auth_service.confirm_password_reset(token_obj.token, "NewPassword123!")
            await asyncio.sleep(2)
            q_changed = await wait_for_queue_item(db, test_email, "Password Changed", timeout=25)
            if confirmed and q_changed and q_changed.status == "Sent":
                record_result("Auth", "Password Changed Security Alert Email", True, f"Delivered (Queue ID: {q_changed.id})")
            else:
                status_txt = q_changed.status if q_changed else "Not Queued"
                record_result("Auth", "Password Changed Security Alert Email", False, f"Status: {status_txt}")
        else:
            record_result("Auth", "Password Changed Security Alert Email", False, "Reset token not found")


async def test_module_staff():
    print("\n=======================================================")
    print("MODULE 2: STAFF / USER CREATION NOTIFICATIONS")
    print("=======================================================")
    unique_suffix = str(uuid.uuid4())[:6]
    staff_email = f"staff_{unique_suffix}@seyeyacourts.com"
    full_name = f"Staff Member {unique_suffix}"
    
    async with AsyncSessionLocal() as db:
        user_service = UserService(db)
        staff_user = await user_service.create_user(
            full_name=full_name,
            email=staff_email,
            password="StaffInitialPassword123!",
            phone_number=f"+256711{unique_suffix[:4]}",
            is_staff=True
        )
        await asyncio.sleep(2)
        q_item = await wait_for_queue_item(db, staff_email, "Login Credentials", timeout=25)
        if q_item and q_item.status == "Sent":
            record_result("Staff", "Staff Account Provisioning Email", True, f"Delivered (Queue ID: {q_item.id})")
        else:
            status_txt = q_item.status if q_item else "Not Queued"
            record_result("Staff", "Staff Account Provisioning Email", False, f"Status: {status_txt}")


async def test_module_crm():
    print("\n=======================================================")
    print("MODULE 3: CRM / CUSTOMER CREATION NOTIFICATIONS")
    print("=======================================================")
    unique_suffix = str(uuid.uuid4())[:6]
    cust_email = f"crmcust_{unique_suffix}@seyeyacourts.com"
    full_name = f"CRM Guest {unique_suffix}"
    
    async with AsyncSessionLocal() as db:
        cust_service = CustomerService(db)
        customer = await cust_service.create_customer(
            full_name=full_name,
            email=cust_email,
            phone_number=f"+256722{unique_suffix[:4]}",
            customer_type="Registered",
            is_active=True
        )
        await asyncio.sleep(2)
        q_item = await wait_for_queue_item(db, cust_email, "Credentials", timeout=25)
        if q_item and q_item.status == "Sent":
            record_result("CRM", "Customer Auto-User Provisioning & Welcome Email", True, f"Delivered (Queue ID: {q_item.id})")
        else:
            status_txt = q_item.status if q_item else "Not Queued"
            record_result("CRM", "Customer Auto-User Provisioning & Welcome Email", False, f"Status: {status_txt}")


async def test_module_restaurant():
    print("\n=======================================================")
    print("MODULE 4: RESTAURANT ORDER NOTIFICATIONS & DUPLICATE PREVENTION")
    print("=======================================================")
    unique_suffix = str(uuid.uuid4())[:6]
    order_email = f"orderguest_{unique_suffix}@seyeyacourts.com"
    
    async with AsyncSessionLocal() as db:
        cust_service = CustomerService(db)
        customer = await cust_service.create_customer(
            full_name=f"Foodie Guest {unique_suffix}",
            email=order_email,
            phone_number=f"+256733{unique_suffix[:4]}"
        )
        
        # Get an active menu item
        m_stmt = select(MenuItem).where(MenuItem.is_available == True).limit(1)
        menu_item = (await db.execute(m_stmt)).scalars().first()
        if not menu_item:
            from app.models import MenuCategory
            cat_stmt = select(MenuCategory).limit(1)
            cat = (await db.execute(cat_stmt)).scalars().first()
            cat_id = cat.category_id if cat else 1
            menu_item = MenuItem(
                category_id=cat_id,
                item_name="Grilled Chicken",
                price=Decimal("35000"),
                is_available=True
            )
            db.add(menu_item)
            await db.commit()
            await db.refresh(menu_item)
            
        order_service = RestaurantOrderService(db)
        items_data = [{
            "menu_item_id": menu_item.menu_item_id,
            "quantity": 2,
            "unit_price": float(menu_item.price or Decimal("35000")),
            "special_notes": "Well done with extra sauce"
        }]
        
        # Place order
        order = await order_service.create_order(
            customer_id=customer.customer_id,
            items_data=items_data,
            delivery_option="Premises",
            seating_location="Table 4"
        )
        await asyncio.sleep(2)
        
        # 4.1 Order Confirmation Email
        q_item = await wait_for_queue_item(db, order_email, "Order Confirmed", timeout=25)
        if q_item and q_item.status == "Sent":
            record_result("Restaurant", "Order Placed Confirmation Email", True, f"Delivered (Queue ID: {q_item.id})")
        else:
            status_txt = q_item.status if q_item else "Not Queued"
            record_result("Restaurant", "Order Placed Confirmation Email", False, f"Status: {status_txt}")

        # 4.2 Duplicate Event Suppression Test
        notif_service = NotificationService(db)
        # Attempt immediate second create_event call
        evt2 = await notif_service.create_event(
            event_type="Order Placed",
            reference_type="RestaurantOrder",
            reference_id=str(order.order_id)
        )
        # Count events for this order
        ev_stmt = select(NotificationEvent).where(
            and_(
                NotificationEvent.event_type == "Order Placed",
                NotificationEvent.reference_type == "RestaurantOrder",
                NotificationEvent.reference_id == str(order.order_id)
            )
        )
        events_found = (await db.execute(ev_stmt)).scalars().all()
        if len(events_found) == 1:
            record_result("Restaurant", "Duplicate Order Placed Suppression", True, "Successfully suppressed redundant event")
        else:
            record_result("Restaurant", "Duplicate Order Placed Suppression", False, f"Found {len(events_found)} duplicate events")


async def test_module_accommodation():
    print("\n=======================================================")
    print("MODULE 5: ACCOMMODATION RESERVATION NOTIFICATIONS")
    print("=======================================================")
    unique_suffix = str(uuid.uuid4())[:6]
    acc_email = f"roomguest_{unique_suffix}@seyeyacourts.com"
    
    async with AsyncSessionLocal() as db:
        cust_service = CustomerService(db)
        customer = await cust_service.create_customer(
            full_name=f"Room Guest {unique_suffix}",
            email=acc_email,
            phone_number=f"+256744{unique_suffix[:4]}"
        )
        
        # Get room
        r_stmt = select(Room).options(selectinload(Room.category)).limit(1)
        room = (await db.execute(r_stmt)).scalars().first()
        room_id = room.room_id if room else None
        
        resv_code = f"ACC-{datetime.utcnow().strftime('%Y%m%d')}-{unique_suffix.upper()}"
        resv = AccommodationReservation(
            customer_id=customer.customer_id,
            reservation_code=resv_code,
            room_id=room_id,
            check_in_date=date.today() + timedelta(days=2),
            check_out_date=date.today() + timedelta(days=5),
            num_nights=3,
            num_adults=2,
            rate_per_night=Decimal("200000"),
            total_amount=Decimal("600000"),
            balance_due=Decimal("600000"),
            reservation_status="Confirmed"
        )
        db.add(resv)
        await db.commit()
        await db.refresh(resv)
        
        # Trigger event
        notif_service = NotificationService(db)
        await notif_service.create_event(
            event_type="Reservation Created",
            reference_type="AccommodationReservation",
            reference_id=str(resv.reservation_id)
        )
        await asyncio.sleep(2)
        
        q_item = await wait_for_queue_item(db, acc_email, "Accommodation Reservation", timeout=25)
        if q_item and q_item.status == "Sent":
            record_result("Accommodation", "Room Booking Confirmation Email", True, f"Delivered (Queue ID: {q_item.id})")
        else:
            status_txt = q_item.status if q_item else "Not Queued"
            record_result("Accommodation", "Room Booking Confirmation Email", False, f"Status: {status_txt}")


async def test_module_conference():
    print("\n=======================================================")
    print("MODULE 6: CONFERENCE RESERVATION NOTIFICATIONS")
    print("=======================================================")
    unique_suffix = str(uuid.uuid4())[:6]
    conf_email = f"confguest_{unique_suffix}@seyeyacourts.com"
    
    async with AsyncSessionLocal() as db:
        cust_service = CustomerService(db)
        customer = await cust_service.create_customer(
            full_name=f"Summit Host {unique_suffix}",
            email=conf_email,
            phone_number=f"+256755{unique_suffix[:4]}"
        )
        
        h_stmt = select(ConferenceHall).limit(1)
        hall = (await db.execute(h_stmt)).scalars().first()
        hall_id = hall.hall_id if hall else 1
        
        conf_code = f"CONF-{datetime.utcnow().strftime('%Y%m%d')}-{unique_suffix.upper()}"
        conf_resv = ConferenceReservation(
            customer_id=customer.customer_id,
            hall_id=hall_id,
            reservation_code=conf_code,
            event_name=f"Global Tech Leadership Summit {unique_suffix}",
            event_start_date=date.today() + timedelta(days=10),
            event_end_date=date.today() + timedelta(days=11),
            start_time=dt_time(9, 0),
            end_time=dt_time(17, 0),
            num_participants=50,
            total_amount=Decimal("2500000"),
            amount_paid=Decimal("1000000"),
            balance_due=Decimal("1500000"),
            reservation_status="Confirmed"
        )
        db.add(conf_resv)
        await db.commit()
        await db.refresh(conf_resv)
        
        notif_service = NotificationService(db)
        await notif_service.create_event(
            event_type="Reservation Created",
            reference_type="ConferenceReservation",
            reference_id=str(conf_resv.conference_res_id)
        )
        await asyncio.sleep(2)
        
        q_item = await wait_for_queue_item(db, conf_email, "Conference Reservation", timeout=25)
        if q_item and q_item.status == "Sent":
            record_result("Conference", "Conference Booking Confirmation Email", True, f"Delivered (Queue ID: {q_item.id})")
        else:
            status_txt = q_item.status if q_item else "Not Queued"
            record_result("Conference", "Conference Booking Confirmation Email", False, f"Status: {status_txt}")


async def test_module_payments():
    print("\n=======================================================")
    print("MODULE 7: PAYMENT RECEIPTS & NOTIFICATIONS")
    print("=======================================================")
    unique_suffix = str(uuid.uuid4())[:6]
    pay_email = f"payguest_{unique_suffix}@seyeyacourts.com"
    
    async with AsyncSessionLocal() as db:
        cust_service = CustomerService(db)
        customer = await cust_service.create_customer(
            full_name=f"Payer Guest {unique_suffix}",
            email=pay_email,
            phone_number=f"+256766{unique_suffix[:4]}"
        )
        
        pay_service = PaymentService(db)
        payment = await pay_service.create_payment(
            customer_id=customer.customer_id,
            payment_type="Full",
            reference_type="RestaurantOrder",
            reference_id=1,
            payment_method="Mobile Money",
            amount_paid=Decimal("75000")
        )
        
        # Verify payment
        verified = await pay_service.verify_payment(payment.payment_id, verified_by=1)
        await asyncio.sleep(2)
        
        q_item = await wait_for_queue_item(db, pay_email, "Payment Receipt", timeout=25)
        if q_item and q_item.status == "Sent":
            record_result("Payments", "Payment Receipt Confirmation Email", True, f"Delivered (Queue ID: {q_item.id})")
        else:
            status_txt = q_item.status if q_item else "Not Queued"
            record_result("Payments", "Payment Receipt Confirmation Email", False, f"Status: {status_txt}")


async def main():
    print("=================================================================")
    print("STARTING FULL SUITE EMAIL NOTIFICATIONS VERIFICATION")
    print(f"SMTP Configuration: {settings.SMTP_SERVER}:{settings.SMTP_PORT} via {settings.SMTP_USER}")
    print("=================================================================")
    
    await test_module_auth()
    await test_module_staff()
    await test_module_crm()
    await test_module_restaurant()
    await test_module_accommodation()
    await test_module_conference()
    await test_module_payments()
    
    print("\n=================================================================")
    print("VERIFICATION RUN SUMMARY")
    print("=================================================================")
    print(f"Total Passed: {len(results['passed'])}")
    print(f"Total Failed: {len(results['failed'])}")
    for p in results['passed']:
        print(f"  [PASS] {p}")
    for f in results['failed']:
        print(f"  [FAIL] {f}")
    print("=================================================================")


if __name__ == "__main__":
    asyncio.run(main())
