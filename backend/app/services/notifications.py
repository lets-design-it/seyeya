"""
Centralized Notification & Event Management Service
"""
import uuid
import logging
import smtplib
import asyncio
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, desc, or_
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.models import (
    User, Customer, Role, UserRole, NotificationEvent, 
    Notification, EmailQueue, NotificationPreference
)
from app.utils.email_templates import (
    get_welcome_email, get_verification_email, get_password_reset_email,
    get_reservation_confirmation_email, get_reservation_cancellation_email,
    get_reservation_reminder_email, get_order_confirmation_email,
    get_payment_receipt_email, get_invoice_email, get_booking_approved_email,
    get_booking_declined_email, get_system_announcement_email
)

logger = logging.getLogger(__name__)

class NotificationService:
    """Centralized Notification and Event Management Service"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_preferences(self, user_id: int) -> NotificationPreference:
        """Get or create user notification preferences"""
        stmt = select(NotificationPreference).where(NotificationPreference.user_id == user_id)
        result = await self.db.execute(stmt)
        pref = result.scalar_one_or_none()
        
        if not pref:
            pref = NotificationPreference(user_id=user_id)
            self.db.add(pref)
            await self.db.flush()
        return pref

    async def update_preferences(self, user_id: int, updates: dict) -> NotificationPreference:
        """Update user notification preferences"""
        pref = await self.get_preferences(user_id)
        for k, v in updates.items():
            if hasattr(pref, k) and v is not None:
                setattr(pref, k, v)
        self.db.add(pref)
        await self.db.commit()
        await self.db.refresh(pref)
        return pref

    async def check_preference(self, user_id: int, channel: str, category: str) -> bool:
        """Check if notification is enabled for a given channel and category"""
        pref = await self.get_preferences(user_id)
        
        if channel == "EMAIL" and not pref.email_enabled:
            return False
        if channel == "IN_APP" and not pref.in_app_enabled:
            return False
            
        cat_lower = category.lower()
        if "reservation" in cat_lower and not pref.reservation_notifications:
            return False
        if "order" in cat_lower and not pref.order_notifications:
            return False
        if "payment" in cat_lower and not pref.payment_notifications:
            return False
        if "security" in cat_lower and not pref.security_notifications:
            return False
        if "marketing" in cat_lower and not pref.marketing_notifications:
            return False
        if "system" in cat_lower and not pref.system_notifications:
            return False
            
        return True

    async def create_notification(
        self,
        recipient_id: int,
        title: str,
        message: str,
        category: str,
        notification_type: Optional[str] = None,
        priority: str = "NORMAL",
        channel: str = "IN_APP",
        action_url: Optional[str] = None,
        reference_type: Optional[str] = None,
        reference_id: Optional[str] = None,
        event_id: Optional[uuid.UUID] = None,
        expires_at: Optional[datetime] = None,
        background_tasks: Optional[Any] = None
    ) -> Optional[Notification]:
        """Create a notification record for a single channel"""
        # 1. Check preferences
        enabled = await self.check_preference(recipient_id, channel, category)
        if not enabled:
            logger.info(f"Skipping notification for user {recipient_id} due to preferences (channel={channel}, category={category})")
            return None

        # 2. Create notification model
        notification = Notification(
            recipient_id=recipient_id,
            title=title,
            message=message,
            category=category,
            notification_type=notification_type,
            priority=priority,
            channel=channel,
            status="UNREAD",
            is_read=False,
            action_url=action_url,
            reference_type=reference_type,
            reference_id=reference_id,
            event_id=event_id,
            expires_at=expires_at
        )
        self.db.add(notification)
        await self.db.flush()

        # 3. Handle EMAIL channel (Insert into queue)
        if channel == "EMAIL":
            # Fetch user email
            stmt = select(User).where(User.user_id == recipient_id)
            res = await self.db.execute(stmt)
            user = res.scalar_one_or_none()
            if user and user.email:
                # Queue email
                email_item = EmailQueue(
                    notification_id=notification.id,
                    recipient_email=user.email,
                    recipient_name=user.full_name,
                    subject=title,
                    body=message,
                    status="Pending",
                    retry_count=0
                )
                self.db.add(email_item)
                await self.db.flush()

                # Trigger background task to process it
                if background_tasks:
                    background_tasks.add_task(self.send_email_by_queue_id, email_item.id)
                else:
                    # Fire & forget async call using asyncio.create_task in current event loop
                    asyncio.create_task(self.send_email_by_queue_id(email_item.id))

        return notification

    async def create_event(
        self,
        event_type: str,
        reference_type: str,
        reference_id: str,
        triggered_by: Optional[int] = None,
        background_tasks: Optional[Any] = None
    ) -> NotificationEvent:
        """Create a new system event and automatically trigger notifications"""
        event = NotificationEvent(
            event_type=event_type,
            reference_type=reference_type,
            reference_id=reference_id,
            triggered_by=triggered_by
        )
        self.db.add(event)
        await self.db.flush()

        # Process the event rules
        await self._process_event_rules(event, background_tasks)
        await self.db.commit()
        return event

    async def _process_event_rules(self, event: NotificationEvent, background_tasks: Optional[Any]):
        """Event Rules Engine to route notifications depending on recipient roles and event context"""
        event_type = event.event_type
        ref_id = event.reference_id
        ref_type = event.reference_type

        # Helper to send notifications to BOTH channels
        async def notify_user(uid: int, title: str, msg: str, category: str, priority="NORMAL", action_url=None):
            await self.create_notification(
                recipient_id=uid, title=title, message=msg, category=category,
                notification_type=event_type, priority=priority, channel="IN_APP",
                action_url=action_url, reference_type=ref_type, reference_id=ref_id,
                event_id=event.id, background_tasks=background_tasks
            )
            await self.create_notification(
                recipient_id=uid, title=title, message=msg, category=category,
                notification_type=event_type, priority=priority, channel="EMAIL",
                action_url=action_url, reference_type=ref_type, reference_id=ref_id,
                event_id=event.id, background_tasks=background_tasks
            )

        # Helper to send to specific role (IN_APP by default)
        async def notify_role(role_name: str, title: str, msg: str, category: str, priority="NORMAL", action_url=None):
            stmt = select(User).join(User.roles).join(UserRole.role).where(Role.role_name == role_name)
            res = await self.db.execute(stmt)
            users = res.scalars().all()
            for u in users:
                await self.create_notification(
                    recipient_id=u.user_id, title=title, message=msg, category=category,
                    notification_type=event_type, priority=priority, channel="IN_APP",
                    action_url=action_url, reference_type=ref_type, reference_id=ref_id,
                    event_id=event.id, background_tasks=background_tasks
                )

        try:
            # 1. Accounts & Security Triggers
            if event_type == "Account Created":
                # Find User
                stmt = select(User).where(User.user_id == int(ref_id))
                res = await self.db.execute(stmt)
                user = res.scalar_one_or_none()
                if user:
                    # Send Welcome Email
                    welcome_body = get_welcome_email(
                        full_name=user.full_name,
                        email=user.email,
                        temp_password="ProvidedDuringRegistration",
                        reset_link=f"http://localhost:8000/reset-password?email={user.email}"
                    )
                    await self.create_notification(
                        recipient_id=user.user_id,
                        title="Welcome to SEYEYA Courts!",
                        message=welcome_body,
                        category="Account",
                        notification_type=event_type,
                        channel="EMAIL",
                        event_id=event.id,
                        background_tasks=background_tasks
                    )
                    # Notify Admin
                    await notify_role(
                        "Super Admin",
                        "New User Registered",
                        f"A new user {user.full_name} ({user.email}) registered in the system.",
                        "Administration"
                    )

            elif event_type == "Password Reset Request":
                stmt = select(User).where(User.user_id == int(ref_id))
                res = await self.db.execute(stmt)
                user = res.scalar_one_or_none()
                if user:
                    reset_body = get_password_reset_email(
                        full_name=user.full_name,
                        reset_link=f"http://localhost:8000/reset-password?email={user.email}"
                    )
                    await self.create_notification(
                        recipient_id=user.user_id,
                        title="Password Reset Request",
                        message=reset_body,
                        category="Security",
                        notification_type=event_type,
                        priority="HIGH",
                        channel="EMAIL",
                        event_id=event.id,
                        background_tasks=background_tasks
                    )

            elif event_type in ["Password Changed", "Login Alert", "Account Locked"]:
                stmt = select(User).where(User.user_id == int(ref_id))
                res = await self.db.execute(stmt)
                user = res.scalar_one_or_none()
                if user:
                    msg = f"Security Alert: {event_type} occurred on your SEYEYA Courts account."
                    await notify_user(user.user_id, f"Security Alert: {event_type}", msg, "Security", priority="HIGH")

            elif event_type == "Role Assigned":
                stmt = select(User).where(User.user_id == int(ref_id))
                res = await self.db.execute(stmt)
                user = res.scalar_one_or_none()
                if user:
                    await self.create_notification(
                        recipient_id=user.user_id,
                        title="New Role Assigned",
                        message="A manager has updated your system roles.",
                        category="Account",
                        notification_type=event_type,
                        channel="IN_APP",
                        event_id=event.id,
                        background_tasks=background_tasks
                    )

            # 2. Reservation & Accommodation Triggers
            elif event_type == "Reservation Created":
                if ref_type == "AccommodationReservation":
                    from app.models import AccommodationReservation
                    stmt = select(AccommodationReservation).options(selectinload(AccommodationReservation.customer)).where(AccommodationReservation.reservation_id == int(ref_id))
                    res = await self.db.execute(stmt)
                    resv = res.scalar_one_or_none()
                    if resv and resv.customer and resv.customer.user_id:
                        details = f"<p>Room: {resv.room_id}</p><p>Check In: {resv.check_in_date}</p><p>Check Out: {resv.check_out_date}</p>"
                        email_body = get_reservation_confirmation_email(resv.customer.full_name, resv.reservation_code, details)
                        
                        await notify_user(
                            resv.customer.user_id,
                            "Accommodation Reservation Created",
                            email_body,
                            "Reservation"
                        )
                        
                        # Notify Hotel Managers / Receptionists
                        mgr_msg = f"New room reservation {resv.reservation_code} received from customer {resv.customer.full_name}."
                        await notify_role("Hotel Manager", "New Reservation Received", mgr_msg, "Reservation")
                        await notify_role("Receptionist", "New Reservation Received", mgr_msg, "Reservation")

                elif ref_type == "ConferenceReservation":
                    from app.models import ConferenceReservation
                    stmt = select(ConferenceReservation).options(selectinload(ConferenceReservation.customer)).where(ConferenceReservation.conference_res_id == int(ref_id))
                    res = await self.db.execute(stmt)
                    resv = res.scalar_one_or_none()
                    if resv and resv.customer and resv.customer.user_id:
                        details = f"<p>Hall: {resv.hall_id}</p><p>Start Date: {resv.event_start_date}</p><p>End Date: {resv.event_end_date}</p>"
                        email_body = get_reservation_confirmation_email(resv.customer.full_name, resv.reservation_code, details)
                        
                        await notify_user(
                            resv.customer.user_id,
                            "Conference Reservation Confirmed",
                            email_body,
                            "Reservation"
                        )
                        
                        mgr_msg = f"New conference reservation {resv.reservation_code} received from customer {resv.customer.full_name}."
                        await notify_role("Hotel Manager", "New Conference Reservation", mgr_msg, "Reservation")

            elif event_type == "Reservation Cancelled":
                if ref_type == "AccommodationReservation":
                    from app.models import AccommodationReservation
                    stmt = select(AccommodationReservation).options(selectinload(AccommodationReservation.customer)).where(AccommodationReservation.reservation_id == int(ref_id))
                    res = await self.db.execute(stmt)
                    resv = res.scalar_one_or_none()
                    if resv and resv.customer and resv.customer.user_id:
                        details = f"<p>Reservation Code: {resv.reservation_code}</p>"
                        email_body = get_reservation_cancellation_email(resv.customer.full_name, resv.reservation_code, details)
                        await notify_user(resv.customer.user_id, "Reservation Cancelled", email_body, "Reservation", priority="HIGH")
                        
                        mgr_msg = f"Room Reservation {resv.reservation_code} has been cancelled by the customer."
                        await notify_role("Hotel Manager", "Reservation Cancelled", mgr_msg, "Reservation", priority="HIGH")

                elif ref_type == "ConferenceReservation":
                    from app.models import ConferenceReservation
                    stmt = select(ConferenceReservation).options(selectinload(ConferenceReservation.customer)).where(ConferenceReservation.conference_res_id == int(ref_id))
                    res = await self.db.execute(stmt)
                    resv = res.scalar_one_or_none()
                    if resv and resv.customer and resv.customer.user_id:
                        details = f"<p>Reservation Code: {resv.reservation_code}</p>"
                        email_body = get_reservation_cancellation_email(resv.customer.full_name, resv.reservation_code, details)
                        await notify_user(resv.customer.user_id, "Conference Reservation Cancelled", email_body, "Reservation", priority="HIGH")

            elif event_type == "Reservation Reminder":
                if ref_type == "AccommodationReservation":
                    from app.models import AccommodationReservation
                    stmt = select(AccommodationReservation).options(selectinload(AccommodationReservation.customer)).where(AccommodationReservation.reservation_id == int(ref_id))
                    res = await self.db.execute(stmt)
                    resv = res.scalar_one_or_none()
                    if resv and resv.customer and resv.customer.user_id:
                        details = f"<p>Check In Date: {resv.check_in_date}</p>"
                        email_body = get_reservation_reminder_email(resv.customer.full_name, resv.reservation_code, details)
                        await notify_user(resv.customer.user_id, "Upcoming Reservation Reminder", email_body, "Reservation")

            # 3. Restaurant Orders Triggers
            elif event_type == "Order Placed":
                from app.models import RestaurantOrder
                stmt = select(RestaurantOrder).options(selectinload(RestaurantOrder.customer)).where(RestaurantOrder.order_id == int(ref_id))
                res = await self.db.execute(stmt)
                order = res.scalar_one_or_none()
                if order:
                    # Notify Customer
                    if order.customer and order.customer.user_id:
                        confirm_body = get_order_confirmation_email(order.customer.full_name, order.order_number, "", str(order.total_amount))
                        await self.create_notification(
                            recipient_id=order.customer.user_id,
                            title="Order Confirmed",
                            message=confirm_body,
                            category="Orders",
                            notification_type=event_type,
                            channel="IN_APP",
                            reference_type=ref_type,
                            reference_id=ref_id,
                            event_id=event.id,
                            background_tasks=background_tasks
                        )
                    # Notify Chef and Waiters
                    staff_msg = f"New restaurant order {order.order_number} placed for preparation."
                    await notify_role("Restaurant Manager", "New Order Placed", staff_msg, "Orders")
                    await notify_role("Kitchen Staff", "New Order Placed", staff_msg, "Orders")
                    await notify_role("Waiter", "New Order Placed", staff_msg, "Orders")
 
            elif event_type in ["Order Accepted", "Order Being Prepared", "Order Ready", "Order Delivered", "Order Cancelled"]:
                from app.models import RestaurantOrder
                stmt = select(RestaurantOrder).options(selectinload(RestaurantOrder.customer)).where(RestaurantOrder.order_id == int(ref_id))
                res = await self.db.execute(stmt)
                order = res.scalar_one_or_none()
                if order and order.customer and order.customer.user_id:
                    msg = f"Your order {order.order_number} status changed to: {event_type.replace('Order ', '')}."
                    await self.create_notification(
                        recipient_id=order.customer.user_id,
                        title=f"Order {event_type.replace('Order ', '')}",
                        message=msg,
                        category="Orders",
                        notification_type=event_type,
                        channel="IN_APP",
                        reference_type=ref_type,
                        reference_id=ref_id,
                        event_id=event.id,
                        background_tasks=background_tasks
                    )
                    
                    if event_type == "Order Ready":
                        # Notify Waiter to pickup
                        waiter_msg = f"Order {order.order_number} is ready. Please deliver to premises."
                        await notify_role("Waiter", "Order Ready for Pickup", waiter_msg, "Orders")

            # 4. Payment Triggers
            elif event_type in ["Payment Successful", "Payment Failed", "Refund Processed"]:
                from app.models import Payment
                stmt = select(Payment).options(selectinload(Payment.customer)).where(Payment.payment_id == int(ref_id))
                res = await self.db.execute(stmt)
                payment = res.scalar_one_or_none()
                if payment and payment.customer and payment.customer.user_id:
                    if event_type == "Payment Successful":
                        receipt_body = get_payment_receipt_email(
                            full_name=payment.customer.full_name,
                            pay_ref=payment.payment_reference,
                            amount=str(payment.amount_paid),
                            method=payment.payment_method,
                            date_str=str(payment.created_at)
                        )
                        await notify_user(
                            payment.customer.user_id,
                            "Payment Successful (Receipt)",
                            receipt_body,
                            "Payments"
                        )
                        # Notify Cashier
                        cashier_msg = f"Payment of {payment.amount_paid} verified for reference {payment.payment_reference}."
                        await notify_role("Cashier", "Payment Verified", cashier_msg, "Payments")
                        await notify_role("Restaurant Manager", "Payment Verified", cashier_msg, "Payments")
                    else:
                        msg = f"Payment failure alert for reference {payment.payment_reference}. Status: {event_type}"
                        await notify_user(payment.customer.user_id, "Payment Alert", msg, "Payments", priority="HIGH")

        except Exception as e:
            logger.error(f"Error executing event routing rules: {str(e)}")

    async def send_email_by_queue_id(self, queue_id: uuid.UUID) -> bool:
        """Process email sending for a specific queue ID (runs in background)"""
        from app.db.database import AsyncSessionLocal
        async with AsyncSessionLocal() as db:
            # Fetch the item
            stmt = select(EmailQueue).where(EmailQueue.id == queue_id)
            result = await db.execute(stmt)
            item = result.scalar_one_or_none()
            
            if not item or item.status in ["Sent", "Processing"]:
                return False

            item.status = "Processing"
            db.add(item)
            await db.commit()

            # Perform the actual SMTP send in a separate thread to prevent blocking
            success = False
            error_msg = None

            # Check SMTP settings
            if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
                # Fallback simulator print
                print(f"\n[EMAIL SIMULATION] To: {item.recipient_email}")
                print(f"Subject: {item.subject}")
                print(f"Body:\n{item.body}\n")
                success = True
            else:
                try:
                    # Wrap blocking smtplib calls using asyncio.to_thread
                    def smtp_send():
                        msg = MIMEMultipart()
                        msg['From'] = settings.SEND_FROM_EMAIL
                        msg['To'] = item.recipient_email
                        msg['Subject'] = item.subject
                        msg.attach(MIMEText(item.body, 'html'))
                        
                        server = smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT)
                        server.ehlo()
                        server.starttls()
                        server.ehlo()
                        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                        server.sendmail(settings.SEND_FROM_EMAIL, item.recipient_email, msg.as_string())
                        server.close()

                    await asyncio.to_thread(smtp_send)
                    success = True
                except Exception as e:
                    error_msg = str(e)
                    logger.error(f"Failed to send email to {item.recipient_email}: {error_msg}")

            # Re-fetch the item to prevent state mismatch or StaleDataError
            stmt = select(EmailQueue).where(EmailQueue.id == queue_id)
            result = await db.execute(stmt)
            item = result.scalar_one_or_none()
            if not item:
                return success

            # Update queue item status
            item.sent_at = datetime.utcnow() if success else None
            item.status = "Sent" if success else "Failed"
            if not success:
                item.retry_count += 1
                item.error_message = error_msg
                
            db.add(item)
            
            # Update original notification email_sent flag
            if item.notification_id:
                stmt_notif = select(Notification).where(Notification.id == item.notification_id)
                res_notif = await db.execute(stmt_notif)
                notification = res_notif.scalar_one_or_none()
                if notification:
                    notification.email_sent = success
                    notification.email_sent_at = datetime.utcnow() if success else None
                    db.add(notification)

            await db.commit()
            return success

    async def mark_as_read(self, notification_id: uuid.UUID, user_id: int) -> Optional[Notification]:
        """Mark a notification as read"""
        stmt = select(Notification).where(and_(Notification.id == notification_id, Notification.recipient_id == user_id))
        res = await self.db.execute(stmt)
        notification = res.scalar_one_or_none()
        if notification:
            notification.is_read = True
            notification.status = "READ"
            notification.read_at = datetime.utcnow()
            self.db.add(notification)
            await self.db.commit()
            await self.db.refresh(notification)
        return notification

    async def mark_all_as_read(self, user_id: int):
        """Mark all notifications for a user as read"""
        stmt = select(Notification).where(and_(Notification.recipient_id == user_id, Notification.is_read == False))
        res = await self.db.execute(stmt)
        notifications = res.scalars().all()
        for n in notifications:
            n.is_read = True
            n.status = "READ"
            n.read_at = datetime.utcnow()
            self.db.add(n)
        await self.db.commit()

    async def archive_notification(self, notification_id: uuid.UUID, user_id: int) -> Optional[Notification]:
        """Archive a notification"""
        stmt = select(Notification).where(and_(Notification.id == notification_id, Notification.recipient_id == user_id))
        res = await self.db.execute(stmt)
        notification = res.scalar_one_or_none()
        if notification:
            notification.status = "ARCHIVED"
            self.db.add(notification)
            await self.db.commit()
            await self.db.refresh(notification)
        return notification

    async def delete_notification(self, notification_id: uuid.UUID, user_id: int) -> bool:
        """Soft-delete/mark a notification as deleted"""
        stmt = select(Notification).where(and_(Notification.id == notification_id, Notification.recipient_id == user_id))
        res = await self.db.execute(stmt)
        notification = res.scalar_one_or_none()
        if notification:
            notification.status = "DELETED"
            self.db.add(notification)
            await self.db.commit()
            return True
        return False

    async def get_notifications(
        self,
        user_id: int,
        status: Optional[str] = None,
        category: Optional[str] = None,
        priority: Optional[str] = None,
        limit: int = 20,
        offset: int = 0
    ) -> List[Notification]:
        """Query user notifications"""
        conditions = [Notification.recipient_id == user_id]
        if status:
            conditions.append(Notification.status == status)
        else:
            # Exclude DELETED notifications by default
            conditions.append(Notification.status != "DELETED")
            
        if category:
            conditions.append(Notification.category == category)
        if priority:
            conditions.append(Notification.priority == priority)
            
        stmt = select(Notification).where(and_(*conditions)).order_by(desc(Notification.created_at)).offset(offset).limit(limit)
        res = await self.db.execute(stmt)
        return res.scalars().all()

    async def get_unread_count(self, user_id: int) -> int:
        """Get the count of unread notifications for a user"""
        stmt = select(func.count(Notification.id)).where(and_(
            Notification.recipient_id == user_id,
            Notification.is_read == False,
            Notification.status == "UNREAD"
        ))
        res = await self.db.execute(stmt)
        return int(res.scalar_one())

    async def get_notification_counts(self, user_id: int) -> Dict[str, Any]:
        """Get notification count statistics for a user"""
        stmt_total = select(func.count(Notification.id)).where(and_(Notification.recipient_id == user_id, Notification.status != "DELETED"))
        total = int((await self.db.execute(stmt_total)).scalar_one())

        stmt_unread = select(func.count(Notification.id)).where(and_(Notification.recipient_id == user_id, Notification.status == "UNREAD"))
        unread = int((await self.db.execute(stmt_unread)).scalar_one())

        stmt_read = select(func.count(Notification.id)).where(and_(Notification.recipient_id == user_id, Notification.status == "READ"))
        read = int((await self.db.execute(stmt_read)).scalar_one())

        stmt_archived = select(func.count(Notification.id)).where(and_(Notification.recipient_id == user_id, Notification.status == "ARCHIVED"))
        archived = int((await self.db.execute(stmt_archived)).scalar_one())

        stmt_deleted = select(func.count(Notification.id)).where(and_(Notification.recipient_id == user_id, Notification.status == "DELETED"))
        deleted = int((await self.db.execute(stmt_deleted)).scalar_one())

        # Category breakdown
        stmt_cats = select(Notification.category, func.count(Notification.id)).where(and_(Notification.recipient_id == user_id, Notification.status != "DELETED")).group_by(Notification.category)
        cat_res = (await self.db.execute(stmt_cats)).all()
        category_counts = {cat: count for cat, count in cat_res}

        return {
            "total_count": total,
            "unread_count": unread,
            "read_count": read,
            "archived_count": archived,
            "deleted_count": deleted,
            "category_counts": category_counts
        }

    async def broadcast_notification(
        self,
        title: str,
        message: str,
        category: str,
        priority: str,
        channel: str,
        recipient_group: str,
        role_name: Optional[str] = None,
        action_url: Optional[str] = None,
        background_tasks: Optional[Any] = None
    ) -> int:
        """Broadcast a notification to a specific group of users"""
        # Determine users in group
        stmt = select(User)
        
        if recipient_group == "all_customers":
            # Users with customer profile or no staff privileges
            stmt = stmt.where(User.is_staff == False)
        elif recipient_group == "all_managers":
            # Users with role names containing 'Manager'
            stmt = stmt.join(User.roles).join(UserRole.role).where(Role.role_name.like("%Manager%"))
        elif recipient_group == "all_staff":
            stmt = stmt.where(User.is_staff == True)
        elif recipient_group == "all_admins":
            stmt = stmt.join(User.roles).join(UserRole.role).where(Role.role_name == "Super Admin")
        elif recipient_group == "role_name" and role_name:
            stmt = stmt.join(User.roles).join(UserRole.role).where(Role.role_name == role_name)
            
        res = await self.db.execute(stmt)
        users = res.scalars().unique().all()

        count = 0
        for user in users:
            # Reusable HTML generator if needed or system announcement email template
            formatted_msg = message
            if channel == "EMAIL":
                formatted_msg = get_system_announcement_email(title, message)

            notif = await self.create_notification(
                recipient_id=user.user_id,
                title=title,
                message=formatted_msg,
                category=category,
                notification_type="SystemAnnouncement",
                priority=priority,
                channel=channel,
                action_url=action_url,
                background_tasks=background_tasks
            )
            if notif:
                count += 1
                
        await self.db.commit()
        return count

    async def send_bulk_notifications(
        self,
        recipient_ids: List[int],
        title: str,
        message: str,
        category: str,
        priority: str,
        channels: List[str],
        action_url: Optional[str] = None,
        background_tasks: Optional[Any] = None
    ) -> int:
        """Send notifications to a list of users across specified channels (EMAIL and/or IN_APP)"""
        count = 0
        for uid in recipient_ids:
            for channel in channels:
                notif = await self.create_notification(
                    recipient_id=uid,
                    title=title,
                    message=message,
                    category=category,
                    notification_type="BulkNotification",
                    priority=priority,
                    channel=channel,
                    action_url=action_url,
                    background_tasks=background_tasks
                )
                if notif:
                    count += 1
        await self.db.commit()
        return count
