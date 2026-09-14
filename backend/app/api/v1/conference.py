"""
Conference module routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from typing import List
from decimal import Decimal
from app.db.database import get_db
from app.core.security import get_current_user
from app.schemas import (
    ConferenceReservationCreate, ConferenceReservationResponse, ConferenceReservationUpdate,
    ConferenceHallResponse, ConferenceResourceResponse, ConferenceMealPackageResponse,
    ConferenceHallCreate, ConferenceEventCreate, ConferenceEventUpdate, ConferenceEventResponse,
    ConferenceFacilityCreate, ConferenceFacilityUpdate, ConferenceFacilityResponse,
    ConferenceFacilityCategoryCreate, ConferenceFacilityCategoryUpdate, ConferenceFacilityCategoryResponse
)
from app.repositories import ConferenceRepository
from app.models import ConferenceHall, ConferenceResource, ConferenceMealPackage, ConferenceResourceBooking, ConferenceMealBooking, ConferenceFacility, ConferenceBookingFacility

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
        facility_ids=request.facility_ids
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
        hall_unit_price = Decimal(0)
        hall_cost = Decimal(0)
        if request.booking_type == "Hourly" and hall.hourly_rate:
            hall_unit_price = hall.hourly_rate
            # Calculate hours difference
            from datetime import datetime, date
            start_dt = datetime.combine(date.today(), request.start_time)
            end_dt = datetime.combine(date.today(), request.end_time)
            duration_hours = (end_dt - start_dt).total_seconds() / 3600.0
            if duration_hours < 0:
                # Handle overnight bookings if start_time > end_time
                duration_hours += 24.0
            hall_cost = hall_unit_price * Decimal(str(duration_hours))
        elif request.booking_type == "HalfDay" and hall.half_day_rate:
            hall_unit_price = hall.half_day_rate
            hall_cost = hall_unit_price
        elif request.booking_type == "FullDay" and hall.full_day_rate:
            hall_unit_price = hall.full_day_rate
            hall_cost = hall_unit_price
        
        # Calculate facility cost
        facility_cost = Decimal(0)
        facility_line_items = []
        if request.facilities:
            for fac_req in request.facilities:
                result = await db.execute(
                    select(ConferenceFacility).where(ConferenceFacility.facility_id == fac_req.facility_id)
                )
                facility = result.scalar_one_or_none()
                if facility:
                    unit_price = facility.price
                    # Total is simply quantity x unit_price as requested
                    total_price = unit_price * Decimal(fac_req.quantity)
                    facility_cost += total_price
                    facility_line_items.append((facility, fac_req.quantity, unit_price, total_price))
        
        subtotal = hall_cost + facility_cost
        total_amount = subtotal  # can be updated if tax applies
        reservation_code = f"CON-{datetime.utcnow().strftime('%Y')}-{str(uuid.uuid4())[:8].upper()}"
        
        # Check for overlapping availability
        # We find any reservation for this hall that overlaps with the requested date and times
        from sqlalchemy import and_, or_
        from app.models import ConferenceReservation
        overlap_check = await db.execute(
            select(ConferenceReservation).where(
                ConferenceReservation.hall_id == request.hall_id,
                ConferenceReservation.event_start_date <= request.event_end_date,
                ConferenceReservation.event_end_date >= request.event_start_date,
                ConferenceReservation.start_time < request.end_time,
                ConferenceReservation.end_time > request.start_time,
                ConferenceReservation.reservation_status.notin_(["Cancelled", "Rejected"])
            )
        )
        if overlap_check.scalars().first():
            raise ValueError("The hall is already booked for the selected date and time.")

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
            total_amount=total_amount,
            subtotal=subtotal,
            hall_unit_price=hall_unit_price,
            payment_responsibility=request.payment_responsibility or "Individual"
        )
        
        reservation.special_requests = request.special_requests
        reservation.hall_cost = hall_cost
        
        # Add facility bookings
        if facility_line_items:
            for fac, qty, u_price, t_price in facility_line_items:
                booking = ConferenceBookingFacility(
                    booking_id=reservation.conference_res_id,
                    facility_id=fac.facility_id,
                    quantity=qty,
                    unit_price=u_price,
                    total_price=t_price
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
            
        return await repo.get_reservation_by_id(reservation.conference_res_id)
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
# CONFERENCE FACILITY CATEGORIES ENDPOINTS
# =====================================================================

@router.get("/facility-categories", response_model=List[ConferenceFacilityCategoryResponse])
async def get_conference_facility_categories(
    db: AsyncSession = Depends(get_db)
):
    """Get all conference facility categories"""
    from app.models import ConferenceFacilityCategory
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(ConferenceFacilityCategory)
        .options(selectinload(ConferenceFacilityCategory.facilities))
        .order_by(ConferenceFacilityCategory.name.asc())
    )
    return result.scalars().all()

@router.post("/facility-categories", response_model=ConferenceFacilityCategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_conference_facility_category(
    request: ConferenceFacilityCategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new facility category"""
    from app.models import ConferenceFacilityCategory
    
    category = ConferenceFacilityCategory(**request.model_dump())
    db.add(category)
    
    try:
        await db.commit()
        
        from sqlalchemy.orm import selectinload
        result = await db.execute(
            select(ConferenceFacilityCategory)
            .options(selectinload(ConferenceFacilityCategory.facilities))
            .where(ConferenceFacilityCategory.id == category.id)
        )
        return result.scalar_one()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="A category with this name already exists")

@router.put("/facility-categories/{category_id}", response_model=ConferenceFacilityCategoryResponse)
async def update_conference_facility_category(
    category_id: int,
    request: ConferenceFacilityCategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update a facility category"""
    from app.models import ConferenceFacilityCategory
    result = await db.execute(select(ConferenceFacilityCategory).where(ConferenceFacilityCategory.id == category_id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    for key, value in request.model_dump(exclude_unset=True).items():
        setattr(category, key, value)
        
    try:
        await db.commit()
        
        from sqlalchemy.orm import selectinload
        result = await db.execute(
            select(ConferenceFacilityCategory)
            .options(selectinload(ConferenceFacilityCategory.facilities))
            .where(ConferenceFacilityCategory.id == category.id)
        )
        return result.scalar_one()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="A category with this name already exists")

@router.delete("/facility-categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conference_facility_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete a facility category"""
    from app.models import ConferenceFacilityCategory
    result = await db.execute(select(ConferenceFacilityCategory).where(ConferenceFacilityCategory.id == category_id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    await db.delete(category)
    await db.commit()


# =====================================================================
# CONFERENCE FACILITIES ENDPOINTS
# =====================================================================

@router.get("/facilities", response_model=List[ConferenceFacilityResponse])
async def get_conference_facilities(
    db: AsyncSession = Depends(get_db)
):
    """Get all conference facilities. Seeds defaults if table is empty."""
    from app.models import ConferenceFacility, ConferenceFacilityCategory
    from sqlalchemy.orm import selectinload
    
    result = await db.execute(
        select(ConferenceFacility)
        .options(selectinload(ConferenceFacility.category_relation))
        .order_by(ConferenceFacility.facility_id.asc())
    )
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
    from sqlalchemy.orm import selectinload
    
    facility = ConferenceFacility(
        name=request.name,
        category_id=request.category_id,
        description=request.description,
        price=request.price,
        pricing_type=request.pricing_type,
        icon_name=request.icon_name or "Sparkles",
        is_active=request.is_active if request.is_active is not None else True,
        price=request.price if request.price is not None else 0.0
    )
    db.add(facility)
    await db.commit()
    await db.refresh(facility)
    
    # Reload with category relation
    result = await db.execute(
        select(ConferenceFacility)
        .options(selectinload(ConferenceFacility.category_relation))
        .where(ConferenceFacility.facility_id == facility.facility_id)
    )
    return result.scalar_one()


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
    if request.category_id is not None:
        facility.category_id = request.category_id
    if request.description is not None:
        facility.description = request.description
    if request.price is not None:
        facility.price = request.price
    if request.pricing_type is not None:
        facility.pricing_type = request.pricing_type
    if request.icon_name is not None:
        facility.icon_name = request.icon_name
    if request.is_active is not None:
        facility.is_active = request.is_active
    if request.price is not None:
        facility.price = request.price

    db.add(facility)
    await db.commit()
    
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(ConferenceFacility)
        .options(selectinload(ConferenceFacility.category_relation))
        .where(ConferenceFacility.facility_id == facility_id)
    )
    return result.scalar_one()


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
