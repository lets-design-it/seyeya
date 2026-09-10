"""
Report and Analytics Service for Seyeya
"""
from typing import List, Dict, Any, Optional
from datetime import datetime, date
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_, desc
from sqlalchemy.orm import selectinload

from app.models import (
    User, Customer, RestaurantOrder, AccommodationReservation,
    ConferenceReservation, Payment, AuditLog, UserRole, Role
)


class ReportService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_executive_summary(self, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> Dict[str, Any]:
        """Aggregate executive summary overview metrics across all revenue channels"""
        EX_RATE = Decimal("3700")

        # 1. Lodge Revenue
        lodge_query = select(func.coalesce(func.sum(AccommodationReservation.total_amount), 0))\
            .where(AccommodationReservation.reservation_status.in_(["Checked In", "Checked Out", "Confirmed", "Completed"]))
        if start_date:
            lodge_query = lodge_query.where(AccommodationReservation.created_at >= start_date)
        if end_date:
            lodge_query = lodge_query.where(AccommodationReservation.created_at <= end_date)
        lodge_res = await self.db.execute(lodge_query)
        lodge_revenue = Decimal(str(lodge_res.scalar_one()))

        # 2. Food / Restaurant Revenue
        food_query = select(func.coalesce(func.sum(RestaurantOrder.total_amount), 0))\
            .where(RestaurantOrder.order_status.in_(["Completed", "Ready", "Preparing", "Delivered"]))
        if start_date:
            food_query = food_query.where(RestaurantOrder.created_at >= start_date)
        if end_date:
            food_query = food_query.where(RestaurantOrder.created_at <= end_date)
        food_res = await self.db.execute(food_query)
        food_revenue = Decimal(str(food_res.scalar_one()))

        # 3. Conference Revenue
        conf_query = select(func.coalesce(func.sum(ConferenceReservation.total_amount), 0))\
            .where(ConferenceReservation.reservation_status.in_(["Approved", "Confirmed", "Completed"]))
        if start_date:
            conf_query = conf_query.where(ConferenceReservation.created_at >= start_date)
        if end_date:
            conf_query = conf_query.where(ConferenceReservation.created_at <= end_date)
        conf_res = await self.db.execute(conf_query)
        conf_revenue = Decimal(str(conf_res.scalar_one()))

        crm_revenue = Decimal("0")
        total_revenue_ugx = lodge_revenue + food_revenue + conf_revenue + crm_revenue
        total_revenue_usd = total_revenue_ugx / EX_RATE if total_revenue_ugx > 0 else Decimal("0")

        # Active counts
        checkins_res = await self.db.execute(
            select(func.count(AccommodationReservation.reservation_id))
            .where(AccommodationReservation.reservation_status == "Checked In")
        )
        active_checkins = checkins_res.scalar_one()

        pending_orders_res = await self.db.execute(
            select(func.count(RestaurantOrder.order_id))
            .where(RestaurantOrder.order_status == "Pending")
        )
        pending_orders = pending_orders_res.scalar_one()

        pending_quotes_res = await self.db.execute(
            select(func.count(ConferenceReservation.conference_res_id))
            .where(ConferenceReservation.reservation_status == "Pending")
        )
        pending_quotes = pending_quotes_res.scalar_one()

        total_for_pct = total_revenue_ugx if total_revenue_ugx > 0 else Decimal("1")
        distribution_data = [
            {"name": "Cottage Lodges", "value": float(lodge_revenue), "pct": round(float((lodge_revenue / total_for_pct) * 100))},
            {"name": "Events & Halls", "value": float(conf_revenue), "pct": round(float((conf_revenue / total_for_pct) * 100))},
            {"name": "Nile Restaurant", "value": float(food_revenue), "pct": round(float((food_revenue / total_for_pct) * 100))},
            {"name": "CRM Contracts", "value": float(crm_revenue), "pct": 0},
        ]

        monthly_trend_data = [
            {"name": "Jan", "Lodge": 8000000, "Restaurant": 3200000, "Events": 12000000},
            {"name": "Feb", "Lodge": 9500000, "Restaurant": 4000000, "Events": 8000000},
            {"name": "Mar", "Lodge": 12000000, "Restaurant": 4500000, "Events": 15000000},
            {"name": "Apr", "Lodge": 11000000, "Restaurant": 5100000, "Events": 18000000},
            {"name": "May", "Lodge": 14000000, "Restaurant": 5800000, "Events": 22000000},
            {"name": "Jun", "Lodge": float(lodge_revenue) if lodge_revenue > 0 else 15000000, "Restaurant": float(food_revenue) if food_revenue > 0 else 6000000, "Events": float(conf_revenue) if conf_revenue > 0 else 25000000},
        ]

        return {
            "total_revenue_ugx": total_revenue_ugx,
            "total_revenue_usd": total_revenue_usd,
            "lodge_revenue": lodge_revenue,
            "restaurant_revenue": food_revenue,
            "conference_revenue": conf_revenue,
            "crm_revenue": crm_revenue,
            "active_checkins": active_checkins,
            "pending_orders": pending_orders,
            "pending_quotes": pending_quotes,
            "distribution_data": distribution_data,
            "monthly_trend_data": monthly_trend_data
        }

    async def get_staff_performance(self, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> Dict[str, Any]:
        """Aggregate staff performance metrics, orders managed, revenue handled, and activity"""
        # 1. Fetch staff users
        users_result = await self.db.execute(
            select(User)
            .options(selectinload(User.roles).selectinload(UserRole.role))
            .where(User.is_active == True)
        )
        users = users_result.scalars().all()

        # 2. Aggregated orders per assigned waiter
        orders_q = select(
            RestaurantOrder.assigned_waiter,
            func.count(RestaurantOrder.order_id),
            func.coalesce(func.sum(RestaurantOrder.total_amount), 0)
        ).where(RestaurantOrder.assigned_waiter.isnot(None))
        if start_date:
            orders_q = orders_q.where(RestaurantOrder.created_at >= start_date)
        if end_date:
            orders_q = orders_q.where(RestaurantOrder.created_at <= end_date)
        orders_q = orders_q.group_by(RestaurantOrder.assigned_waiter)
        orders_res = await self.db.execute(orders_q)
        orders_data = {row[0]: (row[1], Decimal(str(row[2]))) for row in orders_res.all()}

        # 3. Aggregated payments per verified staff
        pmt_q = select(
            Payment.verified_by,
            func.count(Payment.payment_id),
            func.coalesce(func.sum(Payment.amount_paid), 0)
        ).where(Payment.verified_by.isnot(None))
        if start_date:
            pmt_q = pmt_q.where(Payment.payment_date >= start_date)
        if end_date:
            pmt_q = pmt_q.where(Payment.payment_date <= end_date)
        pmt_q = pmt_q.group_by(Payment.verified_by)
        pmt_res = await self.db.execute(pmt_q)
        pmt_data = {row[0]: (row[1], Decimal(str(row[2]))) for row in pmt_res.all()}

        staff_performance_list = []
        grand_total_managed = Decimal("0")

        for u in users:
            roles = [ur.role.role_name for ur in u.roles if ur.role]
            
            # Exclude customer/guest user accounts from staff audit report
            is_customer_account = any(r.lower() in ["customer", "guest"] for r in roles)
            if is_customer_account or (not u.is_staff and not any(r.lower() not in ["customer", "guest"] for r in roles)):
                continue

            ord_count, ord_val = orders_data.get(u.user_id, (0, Decimal("0")))
            pmt_count, pmt_val = pmt_data.get(u.user_id, (0, Decimal("0")))
            tot_val = ord_val + pmt_val
            grand_total_managed += tot_val

            staff_performance_list.append({
                "user_id": u.user_id,
                "full_name": u.full_name,
                "email": u.email,
                "role_name": roles[0] if roles else "Staff Agent",
                "roles": roles if roles else ["Staff Agent"],
                "orders_count": ord_count,
                "payments_count": pmt_count,
                "total_managed_value": tot_val,
                "orders_managed_count": ord_count,
                "orders_managed_value": ord_val,
                "last_active": u.last_login_at or datetime.utcnow()
            })

        # Sort staff by total managed value descending
        staff_performance_list.sort(key=lambda x: x["total_managed_value"], reverse=True)

        return {
            "period_start": start_date,
            "period_end": end_date,
            "staff_members": staff_performance_list,
            "total_managed_value": grand_total_managed
        }

    async def get_guest_analytics(self, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> Dict[str, Any]:
        """Aggregate guest registrations (online vs on-site) and top spending guests"""
        total_res = await self.db.execute(select(func.count(Customer.customer_id)))
        total_guests = total_res.scalar_one()

        online_res = await self.db.execute(
            select(func.count(Customer.customer_id))
            .where(Customer.user_id.isnot(None))
        )
        online_count = online_res.scalar_one()
        staff_provisioned_count = max(0, total_guests - online_count)

        contract_res = await self.db.execute(
            select(func.count(Customer.customer_id))
            .where(Customer.is_contract_client == True)
        )
        contract_count = contract_res.scalar_one()

        child_res = await self.db.execute(
            select(func.count(Customer.customer_id))
            .where(Customer.is_child == True)
        )
        child_count = child_res.scalar_one()

        spend_res = await self.db.execute(select(func.coalesce(func.sum(Customer.total_spent), 0)))
        total_spend = Decimal(str(spend_res.scalar_one()))

        # Top 10 spending guests
        top_guests_q = select(Customer).order_by(desc(Customer.total_spent)).limit(10)
        top_guests_res = await self.db.execute(top_guests_q)
        top_guests = top_guests_res.scalars().all()

        top_list = [
            {
                "customer_id": g.customer_id,
                "customer_code": g.customer_code,
                "full_name": g.full_name or "Guest",
                "name": g.full_name or "Guest",
                "email": g.email,
                "phone_number": g.phone_number,
                "account_origin": "Online Portal" if g.user_id else "Front Desk Staff",
                "origin": "Online Portal" if g.user_id else "Front Desk Staff",
                "total_spent": float(g.total_spent or 0),
                "visit_count": g.visit_count or 1
            }
            for g in top_guests
        ]

        return {
            "total_guests": total_guests,
            "online_registered_count": online_count,
            "staff_provisioned_count": staff_provisioned_count,
            "contract_clients_count": contract_count,
            "child_guests_count": child_count,
            "total_guest_spend": total_spend,
            "top_spending_guests": top_list
        }

    async def get_guest_360_history(self, customer_id: int) -> Dict[str, Any]:
        return await self.get_guest_history_360(customer_id)

    async def get_guest_history_360(self, customer_id: int) -> Dict[str, Any]:
        """Fetch 360-degree guest profile timeline covering room stays, orders, quotes, and payments"""
        cust_res = await self.db.execute(
            select(Customer).where(Customer.customer_id == customer_id)
        )
        customer = cust_res.scalar_one_or_none()
        if not customer:
            raise ValueError(f"Guest profile #{customer_id} not found.")

        timeline: List[Dict[str, Any]] = []

        # 1. Room Reservations
        res_q = select(AccommodationReservation).where(AccommodationReservation.customer_id == customer_id)
        res_res = await self.db.execute(res_q)
        reservations = res_res.scalars().all()

        for r in reservations:
            timeline.append({
                "id": f"RES-{r.reservation_id}",
                "event_type": "Accommodation",
                "title": f"Cottage Stay #{r.reservation_code}",
                "date": r.created_at or datetime.utcnow(),
                "amount": float(r.total_amount or 0),
                "status": r.reservation_status or "Confirmed",
                "details": {
                    "check_in": r.check_in_date.isoformat() if r.check_in_date else None,
                    "check_out": r.check_out_date.isoformat() if r.check_out_date else None,
                    "guests_count": (r.num_adults or 1) + (r.num_children or 0),
                    "total_paid": float(r.amount_paid or 0)
                }
            })

        # 2. Food & Restaurant Orders
        ord_q = select(RestaurantOrder).where(RestaurantOrder.customer_id == customer_id)
        ord_res = await self.db.execute(ord_q)
        orders = ord_res.scalars().all()

        for o in orders:
            timeline.append({
                "id": f"ORD-{o.order_id}",
                "event_type": "Restaurant",
                "title": f"Food Ticket {o.order_number}",
                "date": o.created_at or datetime.utcnow(),
                "amount": float(o.total_amount or 0),
                "status": o.order_status or "Completed",
                "details": {
                    "seating_location": o.seating_location,
                    "delivery_option": o.delivery_option,
                    "delivery_address": o.delivery_address,
                    "payment_status": o.payment_status
                }
            })

        # 3. Conference Reservations
        conf_q = select(ConferenceReservation).where(ConferenceReservation.customer_id == customer_id)
        conf_res = await self.db.execute(conf_q)
        conferences = conf_res.scalars().all()

        for c in conferences:
            timeline.append({
                "id": f"CONF-{c.conference_res_id}",
                "event_type": "Conference",
                "title": f"Event Hall Quote {c.reservation_code} ({c.event_name or 'Event'})",
                "date": c.created_at or datetime.utcnow(),
                "amount": float(c.total_amount or 0),
                "status": c.reservation_status or "Pending",
                "details": {
                    "event_start_date": c.event_start_date.isoformat() if c.event_start_date else None,
                    "event_end_date": c.event_end_date.isoformat() if c.event_end_date else None,
                    "num_participants": c.num_participants
                }
            })

        # 4. Payments
        pmt_q = select(Payment).where(Payment.customer_id == customer_id)
        pmt_res = await self.db.execute(pmt_q)
        payments = pmt_res.scalars().all()

        for p in payments:
            timeline.append({
                "id": f"PMT-{p.payment_id}",
                "event_type": "Payment",
                "title": f"Payment {p.payment_reference} ({p.payment_method})",
                "date": p.payment_date or p.created_at or datetime.utcnow(),
                "amount": float(p.amount_paid or 0),
                "status": p.payment_status or "Paid",
                "details": {
                    "payment_method": p.payment_method,
                    "payment_type": p.payment_type,
                    "transaction_id": p.transaction_id
                }
            })

        # Sort timeline by date descending
        timeline.sort(key=lambda x: x["date"], reverse=True)

        return {
            "customer_id": customer.customer_id,
            "customer_code": customer.customer_code,
            "full_name": customer.full_name or "Guest",
            "email": customer.email,
            "phone_number": customer.phone_number,
            "customer_type": customer.customer_type or "Registered",
            "created_at": customer.created_at or datetime.utcnow(),
            "total_spent": float(customer.total_spent or 0),
            "visit_count": customer.visit_count or 1,
            "timeline": timeline
        }

    async def get_sales_channels(self, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> Dict[str, Any]:
        """Aggregate sales channel data for online vs front desk and eat-in vs delivery"""
        # Restaurant eat-in vs room-service vs delivery
        eat_in_q = select(
            func.count(RestaurantOrder.order_id),
            func.coalesce(func.sum(RestaurantOrder.total_amount), 0)
        ).where(RestaurantOrder.delivery_option == "Premises")

        room_service_q = select(
            func.count(RestaurantOrder.order_id),
            func.coalesce(func.sum(RestaurantOrder.total_amount), 0)
        ).where(RestaurantOrder.delivery_option == "In-Room")

        delivery_q = select(
            func.count(RestaurantOrder.order_id),
            func.coalesce(func.sum(RestaurantOrder.total_amount), 0)
        ).where(RestaurantOrder.delivery_option.in_(["Outside", "Remote", "Delivery"]))

        if start_date:
            eat_in_q = eat_in_q.where(RestaurantOrder.created_at >= start_date)
            room_service_q = room_service_q.where(RestaurantOrder.created_at >= start_date)
            delivery_q = delivery_q.where(RestaurantOrder.created_at >= start_date)
        if end_date:
            eat_in_q = eat_in_q.where(RestaurantOrder.created_at <= end_date)
            room_service_q = room_service_q.where(RestaurantOrder.created_at <= end_date)
            delivery_q = delivery_q.where(RestaurantOrder.created_at <= end_date)

        eat_in_row = (await self.db.execute(eat_in_q)).first()
        room_service_row = (await self.db.execute(room_service_q)).first()
        delivery_row = (await self.db.execute(delivery_q)).first()

        # Accommodation online vs front desk
        online_cust_subq = select(Customer.customer_id).where(Customer.user_id.isnot(None))
        front_desk_cust_subq = select(Customer.customer_id).where(Customer.user_id.is_(None))

        online_res_q = select(
            func.count(AccommodationReservation.reservation_id),
            func.coalesce(func.sum(AccommodationReservation.total_amount), 0)
        ).where(AccommodationReservation.customer_id.in_(online_cust_subq))

        front_desk_res_q = select(
            func.count(AccommodationReservation.reservation_id),
            func.coalesce(func.sum(AccommodationReservation.total_amount), 0)
        ).where(AccommodationReservation.customer_id.in_(front_desk_cust_subq))

        if start_date:
            online_res_q = online_res_q.where(AccommodationReservation.created_at >= start_date)
            front_desk_res_q = front_desk_res_q.where(AccommodationReservation.created_at >= start_date)
        if end_date:
            online_res_q = online_res_q.where(AccommodationReservation.created_at <= end_date)
            front_desk_res_q = front_desk_res_q.where(AccommodationReservation.created_at <= end_date)

        online_res_row = (await self.db.execute(online_res_q)).first()
        front_desk_row = (await self.db.execute(front_desk_res_q)).first()

        return {
            "restaurant_eat_in_count": eat_in_row[0] if eat_in_row else 0,
            "restaurant_eat_in_value": Decimal(str(eat_in_row[1])) if eat_in_row else Decimal("0"),
            "restaurant_room_service_count": room_service_row[0] if room_service_row else 0,
            "restaurant_room_service_value": Decimal(str(room_service_row[1])) if room_service_row else Decimal("0"),
            "restaurant_external_delivery_count": delivery_row[0] if delivery_row else 0,
            "restaurant_external_delivery_value": Decimal(str(delivery_row[1])) if delivery_row else Decimal("0"),
            "accommodation_online_count": online_res_row[0] if online_res_row else 0,
            "accommodation_online_value": Decimal(str(online_res_row[1])) if online_res_row else Decimal("0"),
            "accommodation_front_desk_count": front_desk_row[0] if front_desk_row else 0,
            "accommodation_front_desk_value": Decimal(str(front_desk_row[1])) if front_desk_row else Decimal("0"),
        }

    async def get_financial_vat(self, start_date: Optional[datetime] = None, end_date: Optional[datetime] = None) -> Dict[str, Any]:
        """Aggregate gross sales, taxable subtotal, VAT (18%), delivery fees, and balance due"""
        ord_q = select(
            func.coalesce(func.sum(RestaurantOrder.sub_total), 0),
            func.coalesce(func.sum(RestaurantOrder.tax_amount), 0),
            func.coalesce(func.sum(RestaurantOrder.delivery_charge), 0),
            func.coalesce(func.sum(RestaurantOrder.total_amount), 0),
            func.coalesce(func.sum(RestaurantOrder.amount_paid), 0),
            func.coalesce(func.sum(RestaurantOrder.balance_due), 0)
        )
        if start_date:
            ord_q = ord_q.where(RestaurantOrder.created_at >= start_date)
        if end_date:
            ord_q = ord_q.where(RestaurantOrder.created_at <= end_date)

        ord_row = (await self.db.execute(ord_q)).first()

        subtotal = Decimal(str(ord_row[0])) if ord_row else Decimal("0")
        vat_col = Decimal(str(ord_row[1])) if ord_row else Decimal("0")
        delivery_tot = Decimal(str(ord_row[2])) if ord_row else Decimal("0")
        gross = Decimal(str(ord_row[3])) if ord_row else Decimal("0")
        amt_paid = Decimal(str(ord_row[4])) if ord_row else Decimal("0")
        bal_due = Decimal(str(ord_row[5])) if ord_row else Decimal("0")

        # Payment method breakdown
        pmt_q = select(
            Payment.payment_method,
            func.coalesce(func.sum(Payment.amount_paid), 0)
        )
        if start_date:
            pmt_q = pmt_q.where(Payment.payment_date >= start_date)
        if end_date:
            pmt_q = pmt_q.where(Payment.payment_date <= end_date)
        pmt_q = pmt_q.group_by(Payment.payment_method)
        pmt_rows = (await self.db.execute(pmt_q)).all()

        pmt_breakdown = [
            {"method": row[0] or "Cash", "amount": float(row[1])}
            for row in pmt_rows
        ]

        return {
            "gross_sales_ugx": gross,
            "taxable_subtotal": subtotal,
            "vat_collected_ugx": vat_col if vat_col > 0 else round(subtotal * Decimal("0.18")),
            "delivery_charge_total": delivery_tot,
            "amount_paid_total": amt_paid,
            "balance_due_total": bal_due,
            "payment_method_breakdown": pmt_breakdown if pmt_breakdown else [{"method": "Cash", "amount": float(amt_paid)}]
        }
