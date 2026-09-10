"""
Reports & Analytics API Router for Seyeya
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional, List, Dict, Any
from datetime import datetime
import io
import csv

from app.db.database import get_db
from app.services.report_service import ReportService
from app.core.security import get_current_user
from app.models import User

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])


@router.get("/executive-summary")
async def get_executive_summary(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ReportService(db)
    return await service.get_executive_summary(start_date=start_date, end_date=end_date)


@router.get("/staff-performance")
async def get_staff_performance(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ReportService(db)
    return await service.get_staff_performance(start_date=start_date, end_date=end_date)


@router.get("/guest-analytics")
async def get_guest_analytics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ReportService(db)
    return await service.get_guest_analytics()


@router.get("/guest-360/{customer_id}")
async def get_guest_360_history(
    customer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ReportService(db)
    res = await service.get_guest_360_history(customer_id)
    if not res:
        raise HTTPException(status_code=404, detail="Customer non existant or not found")
    return res


@router.get("/sales-channels")
async def get_sales_channels(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ReportService(db)
    return await service.get_sales_channels(start_date=start_date, end_date=end_date)


@router.get("/financial-vat")
async def get_financial_vat(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ReportService(db)
    return await service.get_financial_vat(start_date=start_date, end_date=end_date)


@router.get("/export/csv")
async def export_report_csv(
    report_type: str = Query(..., description="executive | staff | guests | channels | vat"),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    service = ReportService(db)
    output = io.StringIO()
    writer = csv.writer(output)

    if report_type == "staff":
        data = await service.get_staff_performance(start_date=start_date, end_date=end_date)
        writer.writerow(["Staff User ID", "Staff Name", "Email", "Role", "Orders Managed", "Payments Processed", "Total Value (UGX)"])
        for member in data.get("staff_members", []):
            writer.writerow([
                member.get("user_id"),
                member.get("full_name"),
                member.get("email"),
                member.get("role_name"),
                member.get("orders_count"),
                member.get("payments_count"),
                member.get("total_managed_value")
            ])
        filename = "staff_performance_report.csv"

    elif report_type == "guests":
        data = await service.get_guest_analytics()
        writer.writerow(["Customer ID", "Guest Name", "Email", "Phone", "Origin", "Total Spend (UGX)", "Visits"])
        for guest in data.get("top_spending_guests", []):
            writer.writerow([
                guest.get("customer_id"),
                guest.get("name"),
                guest.get("email"),
                guest.get("phone_number"),
                guest.get("origin"),
                guest.get("total_spent"),
                guest.get("visit_count")
            ])
        filename = "guest_analytics_report.csv"

    elif report_type == "vat":
        data = await service.get_financial_vat(start_date=start_date, end_date=end_date)
        writer.writerow(["Metric", "Amount (UGX)"])
        writer.writerow(["Gross Sales", data.get("gross_sales_ugx")])
        writer.writerow(["Taxable Subtotal", data.get("taxable_subtotal")])
        writer.writerow(["18% VAT Collected", data.get("vat_collected_ugx")])
        writer.writerow(["Total Delivery Charges", data.get("delivery_charge_total")])
        writer.writerow(["Total Amount Paid", data.get("amount_paid_total")])
        writer.writerow(["Total Balance Due", data.get("balance_due_total")])
        filename = "financial_vat_report.csv"

    elif report_type == "channels":
        data = await service.get_sales_channels(start_date=start_date, end_date=end_date)
        writer.writerow(["Channel", "Orders / Stays Count", "Total Value (UGX)"])
        writer.writerow(["Restaurant - Eat In", data.get("restaurant_eat_in_count"), data.get("restaurant_eat_in_value")])
        writer.writerow(["Restaurant - Room Service", data.get("restaurant_room_service_count"), data.get("restaurant_room_service_value")])
        writer.writerow(["Restaurant - External Delivery", data.get("restaurant_external_delivery_count"), data.get("restaurant_external_delivery_value")])
        writer.writerow(["Accommodation - Online Portal", data.get("accommodation_online_count"), data.get("accommodation_online_value")])
        writer.writerow(["Accommodation - Front Desk", data.get("accommodation_front_desk_count"), data.get("accommodation_front_desk_value")])
        filename = "sales_channels_report.csv"

    else: # executive
        data = await service.get_executive_summary(start_date=start_date, end_date=end_date)
        writer.writerow(["Metric", "Value"])
        writer.writerow(["Total Revenue (UGX)", data.get("total_revenue_ugx")])
        writer.writerow(["Total Revenue (USD)", data.get("total_revenue_usd")])
        writer.writerow(["Lodge Revenue (UGX)", data.get("lodge_revenue")])
        writer.writerow(["Restaurant Revenue (UGX)", data.get("restaurant_revenue")])
        writer.writerow(["Conference Revenue (UGX)", data.get("conference_revenue")])
        writer.writerow(["Active Checked In Guests", data.get("active_checkins")])
        writer.writerow(["Pending Kitchen Orders", data.get("pending_orders")])
        filename = "executive_summary_report.csv"

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
