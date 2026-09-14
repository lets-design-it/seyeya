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
    ConferenceHallResponse, ConferenceResourceResponse, ConferenceMealPackageResponse,
    ConferenceHallCreate, ConferenceEventCreate, ConferenceEventUpdate, ConferenceEventResponse,
    ConferenceFacilityCreate, ConferenceFacilityUpdate, ConferenceFacilityResponse
)
from app.repositories import ConferenceRepository
from app.models import ConferenceHall, ConferenceResource, ConferenceMealPackage, ConferenceResourceBooking, ConferenceMealBooking

router = APIRouter(prefix="/api/v1/conference", tags=["conference"])


@router.post("/halls", response_model=ConferenceHallResponse, status_code=status.HTTP_201_CREATED)
async def create_hall(
    request: ConferenceHallCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new conference hall"""
    repo = ConferenceRepository(db)
    hall = await repo.create_hall(
        hall_name=request.hall_name,
        capacity=request.capacity,
        hourly_rate=request.hourly_rate,
        half_day_rate=request.half_day_rate,
        full_day_rate=request.full_day_rate,
        description=request.description,
        amenities=request.amenities
    )
    return hall


@router.get("/reservations", response_model=List[ConferenceReservationResponse])
async def list_reservations(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all conference reservations"""
    repo = ConferenceRepository(db)
    reservations = await repo.get_all_reservations()
    return reservations


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
    from datetime import datetime
    import uuid
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
        
        reservation = await repo.create_reservation(
            customer_id=request.customer_id,
            hall_id=request.hall_id,
            event_name=request.event_name,
            event_start_date=request.event_start_date,
            event_end_date=request.event_end_date,
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
        
        # Trigger notification event
        try:
            from app.services.notifications import NotificationService
            notif_service = NotificationService(db)
            await notif_service.create_event(
                event_type="Reservation Created",
                reference_type="ConferenceReservation",
                reference_id=str(reservation.conference_res_id)
            )
        except Exception as e:
            # Prevent notification issues from failing the reservation endpoint
            pass
            
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
    
    old_status = reservation.reservation_status
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
    
    # Trigger notification if cancelled
    if request.reservation_status == "Cancelled" and old_status != "Cancelled":
        try:
            from app.services.notifications import NotificationService
            notif_service = NotificationService(db)
            await notif_service.create_event(
                event_type="Reservation Cancelled",
                reference_type="ConferenceReservation",
                reference_id=str(reservation.conference_res_id)
            )
        except Exception as e:
            pass
            
    return reservation


# =====================================================================
# EVENTS ENDPOINTS
# =====================================================================

@router.get("/events", response_model=List[ConferenceEventResponse])
async def get_conference_events(db: AsyncSession = Depends(get_db)):
    """Get all conference events"""
    from app.models import ConferenceEvent
    result = await db.execute(select(ConferenceEvent).order_by(ConferenceEvent.event_id.desc()))
    return result.scalars().all()


@router.post("/events", response_model=ConferenceEventResponse, status_code=status.HTTP_201_CREATED)
async def create_conference_event(
    request: ConferenceEventCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new conference/lodge event"""
    from app.models import ConferenceEvent
    event = ConferenceEvent(
        event_name=request.event_name,
        description=request.description,
        photo_url=request.photo_url,
        price=request.price,
        discount=request.discount if request.discount is not None else Decimal('0.00'),
        event_date=request.event_date,
        location=request.location,
        capacity=request.capacity,
        is_active=request.is_active if request.is_active is not None else True
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event


@router.put("/events/{event_id}", response_model=ConferenceEventResponse)
async def update_conference_event(
    event_id: int,
    request: ConferenceEventUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update a conference/lodge event"""
    from app.models import ConferenceEvent
    result = await db.execute(select(ConferenceEvent).where(ConferenceEvent.event_id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    if request.event_name is not None:
        event.event_name = request.event_name
    if request.description is not None:
        event.description = request.description
    if request.photo_url is not None:
        event.photo_url = request.photo_url
    if request.price is not None:
        event.price = request.price
    if request.discount is not None:
        event.discount = request.discount
    if request.event_date is not None:
        event.event_date = request.event_date
    if request.location is not None:
        event.location = request.location
    if request.capacity is not None:
        event.capacity = request.capacity
    if request.is_active is not None:
        event.is_active = request.is_active

    db.add(event)
    await db.commit()
    await db.refresh(event)
    return event


@router.delete("/events/{event_id}")
async def delete_conference_event(
    event_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete a conference/lodge event"""
    from app.models import ConferenceEvent
    result = await db.execute(select(ConferenceEvent).where(ConferenceEvent.event_id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    await db.delete(event)
    await db.commit()
    return {"message": "Event deleted successfully"}


# =====================================================================
# CONFERENCE FACILITIES ENDPOINTS
# =====================================================================

@router.get("/facilities", response_model=List[ConferenceFacilityResponse])
async def get_conference_facilities(
    db: AsyncSession = Depends(get_db)
):
    """Get all conference facilities. Seeds defaults if table is empty."""
    from app.models import ConferenceFacility
    result = await db.execute(select(ConferenceFacility).order_by(ConferenceFacility.facility_id.asc()))
    facilities = result.scalars().all()
    
    if not facilities:
        defaults = [
            {"name": "Catering Services", "category": "Catering & Dining", "description": "Full buffet, seated banquets, and coffee breaks.", "icon_name": "Utensils", "is_active": True, "price": 30000.0},
            {"name": "Public Address System", "category": "Audio/Visual", "description": "High-powered PA system, wireless mics, and mixers.", "icon_name": "Volume2", "is_active": True, "price": 100000.0},
            {"name": "HD Projector & Screen", "category": "Audio/Visual", "description": "4K Laser projection with motorized 150-inch screens.", "icon_name": "Projector", "is_active": True, "price": 150000.0},
            {"name": "High-Speed Wi-Fi", "category": "Connectivity", "description": "Dedicated 1Gbps fiber internet with guest portal.", "icon_name": "Wifi", "is_active": True, "price": 50000.0},
            {"name": "Stage & Podium", "category": "Staging & Hall", "description": "Modular executive stage with wooden lectern.", "icon_name": "Mic", "is_active": True, "price": 200000.0},
            {"name": "Executive Sound & Lighting", "category": "Audio/Visual", "description": "Ambient stage spotlights, RGB mood lights, and DJ rig.", "icon_name": "Zap", "is_active": True, "price": 300000.0},
            {"name": "Coffee & Refreshments Station", "category": "Catering & Dining", "description": "Espresso machine, herbal tea bar, and pastries.", "icon_name": "Coffee", "is_active": True, "price": 80000.0}
        ]
        for item in defaults:
            db.add(ConferenceFacility(**item))
        await db.commit()
        result = await db.execute(select(ConferenceFacility).order_by(ConferenceFacility.facility_id.asc()))
        facilities = result.scalars().all()
        
    return facilities


@router.post("/facilities", response_model=ConferenceFacilityResponse, status_code=status.HTTP_201_CREATED)
async def create_conference_facility(
    request: ConferenceFacilityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new conference facility"""
    from app.models import ConferenceFacility
    facility = ConferenceFacility(
        name=request.name,
        category=request.category or "General Services",
        description=request.description,
        icon_name=request.icon_name or "Sparkles",
        is_active=request.is_active if request.is_active is not None else True,
        price=request.price if request.price is not None else 0.0
    )
    db.add(facility)
    await db.commit()
    await db.refresh(facility)
    return facility


@router.put("/facilities/{facility_id}", response_model=ConferenceFacilityResponse)
async def update_conference_facility(
    facility_id: int,
    request: ConferenceFacilityUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update a conference facility"""
    from app.models import ConferenceFacility
    result = await db.execute(select(ConferenceFacility).where(ConferenceFacility.facility_id == facility_id))
    facility = result.scalar_one_or_none()
    if not facility:
        raise HTTPException(status_code=404, detail="Facility not found")

    if request.name is not None:
        facility.name = request.name
    if request.category is not None:
        facility.category = request.category
    if request.description is not None:
        facility.description = request.description
    if request.icon_name is not None:
        facility.icon_name = request.icon_name
    if request.is_active is not None:
        facility.is_active = request.is_active
    if request.price is not None:
        facility.price = request.price

    db.add(facility)
    await db.commit()
    await db.refresh(facility)
    return facility


@router.delete("/facilities/{facility_id}")
async def delete_conference_facility(
    facility_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete a conference facility"""
    from app.models import ConferenceFacility
    result = await db.execute(select(ConferenceFacility).where(ConferenceFacility.facility_id == facility_id))
    facility = result.scalar_one_or_none()
    if not facility:
        raise HTTPException(status_code=404, detail="Facility not found")

    await db.delete(facility)
    await db.commit()
    return {"message": "Facility deleted successfully"}
