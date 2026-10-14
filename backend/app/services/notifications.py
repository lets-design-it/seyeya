"""
Centralized Notification & Event Management Service
"""
import uuid
import logging
import smtplib
import asyncio
from datetime import datetime, timedelta
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
    get_welcome_email, get_registration_welcome_email, get_verification_email, get_password_reset_email,
    get_password_changed_email, get_reservation_confirmation_email, get_reservation_cancellation_email,
    get_reservation_reminder_email, get_order_confirmation_email,
    get_payment_receipt_email, get_invoice_email, get_booking_approved_email,
    get_booking_declined_email, get_system_announcement_email,
    format_accommodation_details_html, format_conference_details_html,
    format_order_items_html
)
from app.utils.email import send_email_sync, send_email_async

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
            pref = NotificationPreference(
                user_id=user_id,
                email_enabled=True,
                in_app_enabled=True,
                reservation_notifications=True,
                order_notifications=True,
                payment_notifications=True,
                security_notifications=True,
                marketing_notifications=True,
                system_notifications=True
            )
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
        # Critical transactional categories are never blocked
        cat_lower = (category or "").lower()
        if cat_lower in ["account", "security", "administration", "reservation", "orders", "payments"]:
            return True

        pref = await self.get_preferences(user_id)
        
        if channel == "EMAIL" and pref.email_enabled is False:
            return False
        if channel == "IN_APP" and pref.in_app_enabled is False:
            return False
            
        if "reservation" in cat_lower and pref.reservation_notifications is False:
            return False
        if "order" in cat_lower and pref.order_notifications is False:
            return False
        if "payment" in cat_lower and pref.payment_notifications is False:
            return False
        if "security" in cat_lower and pref.security_notifications is False:
            return False
        if "marketing" in cat_lower and pref.marketing_notifications is False:
            return False
        if "system" in cat_lower and pref.system_notifications is False:
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

        # 3. Handle EMAIL channel (Insert into queue and dispatch immediately)
        if channel == "EMAIL":
            # Fetch user email
            stmt = select(User).where(User.user_id == recipient_id)
            res = await self.db.execute(stmt)
            user = res.scalar_one_or_none()
            if user and user.email:
                await self.queue_and_send_email(
                    to_email=user.email,
                    subject=title,
                    body=message,
                    to_name=user.full_name,
                    notification_id=notification.id,
                    background_tasks=background_tasks
                )

        return notification

    async def queue_and_send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        to_name: Optional[str] = None,
        notification_id: Optional[uuid.UUID] = None,
        background_tasks: Optional[Any] = None
    ) -> EmailQueue:
        """Create an EmailQueue record and dispatch it immediately via background task / worker"""
        email_item = EmailQueue(
            notification_id=notification_id,
            recipient_email=to_email,
            recipient_name=to_name,
            subject=subject,
            body=body,
            status="Pending",
            retry_count=0
        )
        self.db.add(email_item)
        try:
            await self.db.commit()
            await self.db.refresh(email_item)
        except Exception:
            await self.db.flush()

        queue_id = email_item.id

        async def _dispatch_task(qid: uuid.UUID):
            try:
                await self.send_email_by_queue_id(qid)
            except Exception as e:
                logger.error(f"Error in background email dispatch for queue {qid}: {str(e)}")

        if background_tasks:
            background_tasks.add_task(_dispatch_task, queue_id)
        else:
            asyncio.create_task(_dispatch_task(queue_id))

        return email_item

    async def create_event(
        self,
        event_type: str,
        reference_type: str,
        reference_id: str,
        triggered_by: Optional[int] = None,
        background_tasks: Optional[Any] = None
    ) -> NotificationEvent:
        """Create a new system event and automatically trigger notifications with duplicate suppression"""
        # Suppress duplicate events triggered within 5 seconds for same event_type, reference_type, and reference_id
        recent_threshold = datetime.utcnow() - timedelta(seconds=5)
        stmt_dup = select(NotificationEvent).where(
            and_(
                NotificationEvent.event_type == event_type,
                NotificationEvent.reference_type == reference_type,
                NotificationEvent.reference_id == str(reference_id),
                NotificationEvent.created_at >= recent_threshold
            )
        )
        res_dup = await self.db.execute(stmt_dup)
        existing_event = res_dup.scalars().first()
        if existing_event:
            logger.info(
                f"Duplicate event suppressed: {event_type} for {reference_type} #{reference_id} within 5s."
            )
            return existing_event

        event = NotificationEvent(
            event_type=event_type,
            reference_type=reference_type,
            reference_id=str(reference_id),
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
                stmt = select(User).options(selectinload(User.roles).selectinload(UserRole.role)).where(User.user_id == int(ref_id))
                res = await self.db.execute(stmt)
                user = res.scalar_one_or_none()
                if user:
                    frontend_base = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
                    role_names = [ur.role.role_name for ur in user.roles if ur.role]
                    role_title = role_names[0] if role_names else ("Staff Member" if user.is_staff else "Customer")

                    # In-app welcome notification for user (the credentials email is sent directly with their password)
                    await self.create_notification(
                        recipient_id=user.user_id,
                        title="Welcome to SEYEYA Courts!",
                        message=f"Welcome {user.full_name}! Your account has been registered successfully as {role_title}.",
                        category="Account",
                        notification_type=event_type,
                        channel="IN_APP",
                        event_id=event.id,
                        background_tasks=background_tasks
                    )
                    # Notify Admin
                    await notify_role(
                        "Super Admin",
                        "New User Registered",
                        f"A new user {user.full_name} ({user.email}) registered in the system as {role_title}.",
                        "Administration"
                    )

            elif event_type == "Password Reset Request":
                stmt = select(User).where(User.user_id == int(ref_id))
                res = await self.db.execute(stmt)
                user = res.scalar_one_or_none()
                if user:
                    from app.models import PasswordResetToken
                    stmt_token = select(PasswordResetToken).where(
                        and_(
                            PasswordResetToken.user_id == user.user_id,
                            PasswordResetToken.used_at == None,
                            PasswordResetToken.expires_at > datetime.utcnow()
                        )
                    ).order_by(desc(PasswordResetToken.created_at))
                    res_token = await self.db.execute(stmt_token)
                    token_obj = res_token.scalar_one_or_none()
                    token_str = token_obj.token if token_obj else ""
                    frontend_base = getattr(settings, "FRONTEND_URL", "http://localhost:5173")
                    reset_link = f"{frontend_base}/reset-password?token={token_str}"
                    reset_body = get_password_reset_email(
                        full_name=user.full_name,
                        reset_link=reset_link,
                        reset_token=token_str
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
                    if event_type == "Password Changed":
                        body = get_password_changed_email(user.full_name)
                        await notify_user(user.user_id, "Password Changed Successfully", body, "Security", priority="HIGH")
                    else:
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
                    from app.models import AccommodationReservation, Room, RoomCategory
                    stmt = select(AccommodationReservation).options(
                        selectinload(AccommodationReservation.customer),
                        selectinload(AccommodationReservation.room).selectinload(Room.category),
                        selectinload(AccommodationReservation.room_category)
                    ).where(AccommodationReservation.reservation_id == int(ref_id))
                    res = await self.db.execute(stmt)
                    resv = res.scalar_one_or_none()
                    if resv and (resv.customer or getattr(resv, 'guest_email', None)):
                        room_label = "Accommodation Room"
                        if resv.room:
                            room_label = f"Room {resv.room.room_number}"
                            if resv.room.category:
                                room_label += f" ({resv.room.category.category_name})"
                        elif resv.room_category:
                            room_label = f"{resv.room_category.category_name} (Category)"

                        details_html = format_accommodation_details_html(
                            room_label=room_label,
                            check_in_date=str(resv.check_in_date),
                            check_out_date=str(resv.check_out_date),
                            num_nights=resv.num_nights or 1,
                            num_adults=resv.num_adults or 1,
                            num_children=resv.num_children or 0,
                            rate_per_night=str(resv.rate_per_night or "0.00"),
                            total_amount=str(resv.total_amount or "0.00"),
                            balance_due=str(getattr(resv, 'balance_due', resv.total_amount) or "0.00"),
                            special_requests=resv.special_requests or ""
                        )
                        cust_name = resv.customer.full_name if resv.customer else getattr(resv, 'guest_name', 'Guest')
                        cust_email = resv.customer.email if resv.customer else getattr(resv, 'guest_email', None)
                        cust_uid = resv.customer.user_id if resv.customer else None

                        email_body = get_reservation_confirmation_email(cust_name, resv.reservation_code, details_html)

                        if cust_uid:
                            await notify_user(
                                cust_uid,
                                f"Accommodation Reservation Confirmed - {resv.reservation_code}",
                                email_body,
                                "Reservation"
                            )
                        elif cust_email:
                            await self.queue_and_send_email(
                                to_email=cust_email,
                                subject=f"Accommodation Reservation Confirmed - {resv.reservation_code}",
                                body=email_body,
                                to_name=cust_name,
                                background_tasks=background_tasks
                            )

                        # Notify Hotel Managers / Receptionists
                        mgr_msg = f"New room reservation {resv.reservation_code} received from guest {cust_name} for {room_label}."
                        await notify_role("Hotel Manager", "New Reservation Received", mgr_msg, "Reservation")
                        await notify_role("Receptionist", "New Reservation Received", mgr_msg, "Reservation")

                elif ref_type == "ConferenceReservation":
                    from app.models import ConferenceReservation, ConferenceHall, ConferenceBookingFacility, ConferenceFacility
                    stmt = select(ConferenceReservation).options(
                        selectinload(ConferenceReservation.customer),
                        selectinload(ConferenceReservation.hall),
                        selectinload(ConferenceReservation.booked_facilities).selectinload(ConferenceBookingFacility.facility)
                    ).where(ConferenceReservation.conference_res_id == int(ref_id))
                    res = await self.db.execute(stmt)
                    resv = res.scalar_one_or_none()
                    if resv and resv.customer:
                        hall_name = resv.hall.hall_name if resv.hall else f"Hall #{resv.hall_id}"
                        event_name = resv.event_name or "Conference Event"
                        fac_list = []
                        if resv.booked_facilities:
                            for bf in resv.booked_facilities:
                                fn = bf.facility.name if bf.facility else f"Facility #{bf.facility_id}"
                                fac_list.append(f"{fn} (Qty: {bf.quantity})")
                        fac_summary = ", ".join(fac_list) if fac_list else "None"

                        details_html = format_conference_details_html(
                            hall_name=hall_name,
                            event_name=event_name,
                            start_date=str(resv.event_start_date),
                            end_date=str(resv.event_end_date),
                            start_time=str(resv.start_time or "09:00"),
                            end_time=str(resv.end_time or "17:00"),
                            num_participants=resv.num_participants or 1,
                            facilities_summary=fac_summary,
                            total_amount=str(resv.total_amount or "0.00"),
                            amount_paid=str(resv.amount_paid or "0.00"),
                            balance_due=str(resv.balance_due or "0.00")
                        )
                        email_body = get_reservation_confirmation_email(resv.customer.full_name, resv.reservation_code, details_html)

                        if resv.customer.user_id:
                            await notify_user(
                                resv.customer.user_id,
                                f"Conference Reservation Confirmed - {resv.reservation_code}",
                                email_body,
                                "Reservation"
                            )
                        elif resv.customer.email:
                            await self.queue_and_send_email(
                                to_email=resv.customer.email,
                                subject=f"Conference Reservation Confirmed - {resv.reservation_code}",
                                body=email_body,
                                to_name=resv.customer.full_name,
                                background_tasks=background_tasks
                            )

                        mgr_msg = f"New conference reservation {resv.reservation_code} received from customer {resv.customer.full_name} for {hall_name}."
                        await notify_role("Hotel Manager", "New Conference Reservation", mgr_msg, "Reservation")

            elif event_type == "Reservation Cancelled":
                if ref_type == "AccommodationReservation":
                    from app.models import AccommodationReservation
                    stmt = select(AccommodationReservation).options(selectinload(AccommodationReservation.customer)).where(AccommodationReservation.reservation_id == int(ref_id))
                    res = await self.db.execute(stmt)
                    resv = res.scalar_one_or_none()
                    if resv and (resv.customer or getattr(resv, 'guest_email', None)):
                        cust_name = resv.customer.full_name if resv.customer else getattr(resv, 'guest_name', 'Guest')
                        cust_email = resv.customer.email if resv.customer else getattr(resv, 'guest_email', None)
                        cust_uid = resv.customer.user_id if resv.customer else None

                        details = f"<p>Reservation Code: {resv.reservation_code}</p>"
                        email_body = get_reservation_cancellation_email(cust_name, resv.reservation_code, details)
                        if cust_uid:
                            await notify_user(cust_uid, "Reservation Cancelled", email_body, "Reservation", priority="HIGH")
                        elif cust_email:
                            await self.queue_and_send_email(
                                to_email=cust_email,
                                subject=f"Reservation Cancelled - {resv.reservation_code}",
                                body=email_body,
                                to_name=cust_name,
                                background_tasks=background_tasks
                            )

                        mgr_msg = f"Room Reservation {resv.reservation_code} has been cancelled."
                        await notify_role("Hotel Manager", "Reservation Cancelled", mgr_msg, "Reservation", priority="HIGH")

                elif ref_type == "ConferenceReservation":
                    from app.models import ConferenceReservation
                    stmt = select(ConferenceReservation).options(selectinload(ConferenceReservation.customer)).where(ConferenceReservation.conference_res_id == int(ref_id))
                    res = await self.db.execute(stmt)
                    resv = res.scalar_one_or_none()
                    if resv and resv.customer:
                        details = f"<p>Reservation Code: {resv.reservation_code}</p>"
                        email_body = get_reservation_cancellation_email(resv.customer.full_name, resv.reservation_code, details)
                        if resv.customer.user_id:
                            await notify_user(resv.customer.user_id, "Conference Reservation Cancelled", email_body, "Reservation", priority="HIGH")
                        elif resv.customer.email:
                            await self.queue_and_send_email(
                                to_email=resv.customer.email,
                                subject=f"Conference Reservation Cancelled - {resv.reservation_code}",
                                body=email_body,
                                to_name=resv.customer.full_name,
                                background_tasks=background_tasks
                            )

            elif event_type == "Reservation Reminder":
                if ref_type == "AccommodationReservation":
                    from app.models import AccommodationReservation
                    stmt = select(AccommodationReservation).options(selectinload(AccommodationReservation.customer)).where(AccommodationReservation.reservation_id == int(ref_id))
                    res = await self.db.execute(stmt)
                    resv = res.scalar_one_or_none()
                    if resv and resv.customer:
                        details = f"<p>Check In Date: {resv.check_in_date}</p>"
                        email_body = get_reservation_reminder_email(resv.customer.full_name, resv.reservation_code, details)
                        if resv.customer.user_id:
                            await notify_user(resv.customer.user_id, "Upcoming Reservation Reminder", email_body, "Reservation")
                        elif resv.customer.email:
                            await self.queue_and_send_email(
                                to_email=resv.customer.email,
                                subject=f"Upcoming Reservation Reminder - {resv.reservation_code}",
                                body=email_body,
                                to_name=resv.customer.full_name,
                                background_tasks=background_tasks
                            )

            # 3. Restaurant Orders Triggers
            elif event_type == "Order Placed":
                from app.models import RestaurantOrder, OrderItem, MenuItem
                stmt = select(RestaurantOrder).options(
                    selectinload(RestaurantOrder.customer),
                    selectinload(RestaurantOrder.order_items).selectinload(OrderItem.menu_item)
                ).where(RestaurantOrder.order_id == int(ref_id))
                res = await self.db.execute(stmt)
                order = res.scalar_one_or_none()
                if order and order.customer:
                    items_data = []
                    if order.order_items:
                        for oi in order.order_items:
                            item_name = oi.menu_item.name if oi.menu_item else "Menu Item"
                            items_data.append({
                                "name": item_name,
                                "quantity": oi.quantity,
                                "unit_price": str(oi.unit_price or "0.00"),
                                "total_price": str(oi.total_price or "0.00"),
                                "extras_text": oi.special_notes or ""
                            })
                    loc = order.delivery_address or order.seating_location or order.delivery_option
                    details_html = format_order_items_html(
                        items=items_data,
                        subtotal=str(order.sub_total or "0.00"),
                        tax_amount=str(order.tax_amount or "0.00"),
                        delivery_charge=str(order.delivery_charge or "0.00"),
                        total_amount=str(order.total_amount or "0.00"),
                        delivery_option=order.delivery_option or "Premises",
                        location_details=str(loc or ""),
                        special_instr=order.special_instr or ""
                    )
                    confirm_body = get_order_confirmation_email(
                        full_name=order.customer.full_name,
                        order_num=order.order_number,
                        items_html=details_html,
                        total_amount=str(order.total_amount or "0.00")
                    )

                    # Notify Customer across BOTH IN_APP and EMAIL
                    if order.customer.user_id:
                        await notify_user(
                            order.customer.user_id,
                            f"Order Confirmed - {order.order_number}",
                            confirm_body,
                            "Orders"
                        )
                    elif order.customer.email:
                        await self.queue_and_send_email(
                            to_email=order.customer.email,
                            subject=f"Restaurant Order Confirmed - {order.order_number}",
                            body=confirm_body,
                            to_name=order.customer.full_name,
                            background_tasks=background_tasks
                        )

                    # Notify Chef and Waiters
                    staff_msg = f"New restaurant order {order.order_number} placed for preparation. Amount: UGX {order.total_amount}."
                    await notify_role("Restaurant Manager", "New Order Placed", staff_msg, "Orders")
                    await notify_role("Kitchen Staff", "New Order Placed", staff_msg, "Orders")
                    await notify_role("Waiter", "New Order Placed", staff_msg, "Orders")
 
            elif event_type in ["Order Accepted", "Order Being Prepared", "Order Ready", "Order Delivered", "Order Cancelled"]:
                from app.models import RestaurantOrder
                stmt = select(RestaurantOrder).options(selectinload(RestaurantOrder.customer)).where(RestaurantOrder.order_id == int(ref_id))
                res = await self.db.execute(stmt)
                order = res.scalar_one_or_none()
                if order and order.customer:
                    msg = f"Your order {order.order_number} status changed to: {event_type.replace('Order ', '')}."
                    if order.customer.user_id:
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
                if payment:
                    cust_name = payment.customer.full_name if payment.customer else None
                    cust_email = payment.customer.email if payment.customer else None
                    cust_uid = payment.customer.user_id if payment.customer else None

                    # If customer email is missing, lookup via linked order or reservation
                    if not cust_email:
                        if payment.reference_type == "RestaurantOrder":
                            from app.models import RestaurantOrder
                            o_res = await self.db.execute(select(RestaurantOrder).options(selectinload(RestaurantOrder.customer)).where(RestaurantOrder.order_id == payment.reference_id))
                            ord_obj = o_res.scalar_one_or_none()
                            if ord_obj and ord_obj.customer:
                                cust_name = cust_name or ord_obj.customer.full_name
                                cust_email = ord_obj.customer.email
                                cust_uid = cust_uid or ord_obj.customer.user_id
                        elif payment.reference_type == "AccommodationReservation":
                            from app.models import AccommodationReservation
                            a_res = await self.db.execute(select(AccommodationReservation).options(selectinload(AccommodationReservation.customer)).where(AccommodationReservation.reservation_id == payment.reference_id))
                            acc_obj = a_res.scalar_one_or_none()
                            if acc_obj:
                                if acc_obj.customer:
                                    cust_name = cust_name or acc_obj.customer.full_name
                                    cust_email = acc_obj.customer.email
                                    cust_uid = cust_uid or acc_obj.customer.user_id
                                elif getattr(acc_obj, "guest_email", None):
                                    cust_name = cust_name or getattr(acc_obj, "guest_name", "Guest")
                                    cust_email = acc_obj.guest_email
                        elif payment.reference_type == "ConferenceReservation":
                            from app.models import ConferenceReservation
                            c_res = await self.db.execute(select(ConferenceReservation).options(selectinload(ConferenceReservation.customer)).where(ConferenceReservation.conference_res_id == payment.reference_id))
                            conf_obj = c_res.scalar_one_or_none()
                            if conf_obj and conf_obj.customer:
                                cust_name = cust_name or conf_obj.customer.full_name
                                cust_email = conf_obj.customer.email
                                cust_uid = cust_uid or conf_obj.customer.user_id

                    cust_name = cust_name or "Valued Customer"

                    if event_type == "Payment Successful":
                        receipt_body = get_payment_receipt_email(
                            full_name=cust_name,
                            pay_ref=payment.payment_reference,
                            amount=str(payment.amount_paid),
                            method=payment.payment_method,
                            date_str=str(payment.created_at)
                        )
                        if cust_uid:
                            await notify_user(
                                cust_uid,
                                f"Payment Receipt - {payment.payment_reference}",
                                receipt_body,
                                "Payments"
                            )
                        elif cust_email:
                            await self.queue_and_send_email(
                                to_email=cust_email,
                                subject=f"Payment Receipt - {payment.payment_reference}",
                                body=receipt_body,
                                to_name=cust_name,
                                background_tasks=background_tasks
                            )
                        # Notify Cashier & Managers
                        cashier_msg = f"Payment of UGX {payment.amount_paid} verified for reference {payment.payment_reference}."
                        await notify_role("Cashier", "Payment Verified", cashier_msg, "Payments")
                        await notify_role("Restaurant Manager", "Payment Verified", cashier_msg, "Payments")
                        await notify_role("Hotel Manager", "Payment Verified", cashier_msg, "Payments")
                    else:
                        msg = f"Payment alert for reference {payment.payment_reference}. Status: {event_type}"
                        if cust_uid:
                            await notify_user(cust_uid, "Payment Alert", msg, "Payments", priority="HIGH")
                        elif cust_email:
                            await self.queue_and_send_email(
                                to_email=cust_email,
                                subject=f"Payment Alert - {payment.payment_reference}",
                                body=f"<p>{msg}</p>",
                                to_name=cust_name,
                                background_tasks=background_tasks
                            )

            # Commit all created events and notifications so they persist
            await self.db.commit()

        except Exception as e:
            logger.error(f"Error executing event routing rules: {str(e)}")

    async def send_email_by_queue_id(self, queue_id: uuid.UUID) -> bool:
        """Process email sending for a specific queue ID (runs in background)"""
        from app.db.database import AsyncSessionLocal

        # Retry finding item in case caller transaction is in the middle of committing
        item = None
        for _ in range(6):
            async with AsyncSessionLocal() as db:
                stmt = select(EmailQueue).where(EmailQueue.id == queue_id)
                result = await db.execute(stmt)
                item = result.scalar_one_or_none()
                if item:
                    break
            await asyncio.sleep(0.5)

        if not item or item.status in ["Sent", "Processing"]:
            return False

        async with AsyncSessionLocal() as db:
            # Re-fetch inside session
            stmt = select(EmailQueue).where(EmailQueue.id == queue_id)
            result = await db.execute(stmt)
            item = result.scalar_one_or_none()
            if not item or item.status in ["Sent", "Processing"]:
                return False

            item.status = "Processing"
            db.add(item)
            await db.commit()

            # Perform the actual SMTP send in a separate thread using unified email sender
            success = False
            error_msg = None

            try:
                success = await asyncio.to_thread(
                    send_email_sync,
                    item.recipient_email,
                    item.subject,
                    item.body,
                    item.recipient_name
                )
                if not success:
                    error_msg = "SMTP delivery failed or was simulated"
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
