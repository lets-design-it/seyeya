"""
Conference module routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from decimal import Decimal
from app.db.database import get_db
from app.core.security import get_current_user
from app.schemas import (
    ConferenceReservationCreate, ConferenceReservationResponse, ConferenceReservationUpdate,
    ConferenceHallResponse, ConferenceResourceResponse, ConferenceMealPackageResponse
)
from app.services import ConferenceRepository
from app.repositories import ConferenceRepository
from app.models import ConferenceHall, ConferenceResource, ConferenceMealPackage, ConferenceResourceBooking, ConferenceMealBooking

router = APIRouter(prefix="/api/v1/conference", tags=["conference"])


@router.get("/halls", response_model=List[ConferenceHallResponse])
async def get_halls(db: AsyncSession = Depends(get_db)):
    """Get all conference halls"""
    repo = ConferenceRepository(db)
    halls = await repo.get_all_halls()
    return halls


@router.get("/halls/{hall_id}", response_model=ConferenceHallResponse)
async def get_hall(
    hall_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get hall details"""
    repo = ConferenceRepository(db)
    hall = await repo.get_hall_by_id(hall_id)
    
    if not hall:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hall not found"
        )
    
    return hall


@router.get("/resources", response_model=List[ConferenceResourceResponse])
async def get_resources(db: AsyncSession = Depends(get_db)):
    """Get all conference resources"""
    result = await db.execute(
        select(ConferenceResource).where(ConferenceResource.is_available == True)
    )
    resources = result.scalars().all()
    return resources


@router.get("/meal-packages", response_model=List[ConferenceMealPackageResponse])
async def get_meal_packages(db: AsyncSession = Depends(get_db)):
    """Get all meal packages"""
    result = await db.execute(
        select(ConferenceMealPackage).where(ConferenceMealPackage.is_active == True)
    )
    packages = result.scalars().all()
    return packages


@router.post("/reservations", response_model=ConferenceReservationResponse)
async def create_reservation(
    request: ConferenceReservationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a conference reservation"""
    try:
        repo = ConferenceRepository(db)
        
        # Get hall to calculate cost
        hall = await repo.get_hall_by_id(request.hall_id)
        if not hall:
            raise ValueError("Hall not found")
        
        # Calculate hall cost based on booking type
        hall_cost = Decimal(0)
        if request.booking_type == "Hourly":
            if hall.hourly_rate:
                hall_cost = hall.hourly_rate
        elif request.booking_type == "HalfDay":
            if hall.half_day_rate:
                hall_cost = hall.half_day_rate
        elif request.booking_type == "FullDay":
            if hall.full_day_rate:
                hall_cost = hall.full_day_rate
        
        # Calculate resource cost
        resource_cost = Decimal(0)
        if request.resources:
            for res_data in request.resources:
                result = await db.execute(
                    select(ConferenceResource).where(ConferenceResource.resource_id == res_data.resource_id)
                )
                resource = result.scalar_one_or_none()
                if resource:
                    resource_cost += resource.daily_rate * Decimal(res_data.quantity)
        
        # Calculate meal cost
        meal_cost = Decimal(0)
        if request.meals:
            for meal_data in request.meals:
                result = await db.execute(
                    select(ConferenceMealPackage).where(ConferenceMealPackage.package_id == meal_data.package_id)
                )
                package = result.scalar_one_or_none()
                if package:
                    meal_cost += package.price_per_person * Decimal(meal_data.num_participants)
        
        total_amount = hall_cost + resource_cost + meal_cost
        reservation_code = f"CON-{datetime.utcnow().strftime('%Y')}-{str(uuid.uuid4())[:8].upper()}"
        
        from datetime import datetime
        import uuid
        
        reservation = await repo.create_reservation(
            customer_id=request.customer_id,
            hall_id=request.hall_id,
            event_name=request.event_name,
            event_date=request.event_date,
            start_time=request.start_time,
            end_time=request.end_time,
            num_participants=request.num_participants,
            booking_type=request.booking_type,
            reservation_code=reservation_code,
            total_amount=total_amount
        )
        
        reservation.special_requests = request.special_requests
        reservation.hall_cost = hall_cost
        reservation.resource_cost = resource_cost
        reservation.meal_cost = meal_cost
        
        # Add resource bookings
        if request.resources:
            for res_data in request.resources:
                result = await db.execute(
                    select(ConferenceResource).where(ConferenceResource.resource_id == res_data.resource_id)
                )
                resource = result.scalar_one_or_none()
                if resource:
                    booking = ConferenceResourceBooking(
                        conference_res_id=reservation.conference_res_id,
                        resource_id=resource.resource_id,
                        quantity=res_data.quantity,
                        rate=resource.daily_rate,
                        total_cost=resource.daily_rate * Decimal(res_data.quantity)
                    )
                    db.add(booking)
        
        # Add meal bookings
        if request.meals:
            for meal_data in request.meals:
                result = await db.execute(
                    select(ConferenceMealPackage).where(ConferenceMealPackage.package_id == meal_data.package_id)
                )
                package = result.scalar_one_or_none()
                if package:
                    booking = ConferenceMealBooking(
                        conference_res_id=reservation.conference_res_id,
                        package_id=package.package_id,
                        num_participants=meal_data.num_participants,
                        price_per_person=package.price_per_person,
                        total_cost=package.price_per_person * Decimal(meal_data.num_participants)
                    )
                    db.add(booking)
        
        db.add(reservation)
        await db.commit()
        await db.refresh(reservation)
        
        return reservation
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/reservations/{conference_res_id}", response_model=ConferenceReservationResponse)
async def get_reservation(
    conference_res_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get reservation details"""
    repo = ConferenceRepository(db)
    reservation = await repo.get_reservation_by_id(conference_res_id)
    
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found"
        )
    
    return reservation


@router.patch("/reservations/{conference_res_id}", response_model=ConferenceReservationResponse)
async def update_reservation(
    conference_res_id: int,
    request: ConferenceReservationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update reservation"""
    repo = ConferenceRepository(db)
    reservation = await repo.get_reservation_by_id(conference_res_id)
    
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found"
        )
    
    if request.reservation_status:
        reservation.reservation_status = request.reservation_status
    
    if request.payment_status:
        reservation.payment_status = request.payment_status
    
    if request.amount_paid is not None:
        reservation.amount_paid = request.amount_paid
        reservation.balance_due = reservation.total_amount - request.amount_paid
    
    db.add(reservation)
    await db.commit()
    await db.refresh(reservation)
    
    return reservation
