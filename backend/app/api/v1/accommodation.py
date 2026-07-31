"""
Accommodation module routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from datetime import date
from app.db.database import get_db
from app.core.security import get_current_user
from app.schemas import (
    AccommodationReservationCreate, AccommodationReservationResponse, AccommodationReservationUpdate,
    RoomResponse, GuestCheckInDetailCreate, RoomCategoryResponse, RoomCategoryCreate,
    RoomCategoryUpdate, RoomCreate, RoomUpdate
)
from app.services import AccommodationService
from app.repositories import AccommodationRepository
from sqlalchemy import select, and_


router = APIRouter(prefix="/api/v1/accommodation", tags=["accommodation"])


@router.get("/rooms", response_model=List[RoomResponse])
async def get_available_rooms(
    check_in: date,
    check_out: date,
    db: AsyncSession = Depends(get_db)
):
    """Get available rooms for date range"""
    repo = AccommodationRepository(db)
    rooms = await repo.get_available_rooms(str(check_in), str(check_out))
    return rooms


@router.get("/rooms/all", response_model=List[RoomResponse])
async def get_all_rooms_list(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Retrieve all rooms (both available and unavailable)"""
    from app.models import Room
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Room)
        .options(
            selectinload(Room.category),
            selectinload(Room.beds),
            selectinload(Room.views),
            selectinload(Room.bathroom_features),
            selectinload(Room.room_facilities),
            selectinload(Room.images)
        )
        .order_by(Room.room_number)
    )
    return result.scalars().all()


@router.get("/rooms/{room_id}", response_model=RoomResponse)
async def get_room(
    room_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get room details"""
    repo = AccommodationRepository(db)
    room = await repo.get_room_by_id(room_id)
    
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Room not found"
        )
    
    return room


@router.post("/reservations", response_model=AccommodationReservationResponse)
async def create_reservation(
    request: AccommodationReservationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create an accommodation reservation"""
    try:
        from app.models import AccommodationReservation
        from sqlalchemy.orm import selectinload
        service = AccommodationService(db)
        
        # Calculate number of nights and rate
        num_nights = (request.check_out_date - request.check_in_date).days
        
        if num_nights <= 0:
            raise ValueError("Check-out date must be after check-in date")
        
        # Get room to get rate
        repo = AccommodationRepository(db)
        room = await repo.get_room_by_id(request.room_id)
        if not room:
            raise ValueError("Room not found")
        
        # Validate capacity levels
        adults_count = sum(1 for g in request.guests if not g.is_child)
        children_count = sum(1 for g in request.guests if g.is_child)
        
        if not request.guests:
            adults_count = request.num_adults
            children_count = request.num_children
            
        if adults_count > room.max_occupancy:
            raise ValueError(f"Room maximum capacity is {room.max_occupancy} adults. You cannot add {adults_count} adults.")
        
        rate_per_night = room.category.base_rate_usd
        total_amount = rate_per_night * num_nights
        
        reservation = await service.create_reservation(
            customer_id=request.customer_id,
            room_id=request.room_id,
            check_in_date=request.check_in_date,
            check_out_date=request.check_out_date,
            num_nights=num_nights,
            rate_per_night=rate_per_night,
            total_amount=total_amount
        )
        
        # Set additional fields
        reservation.num_adults = adults_count
        reservation.num_children = children_count
        reservation.special_requests = request.special_requests
        
        db.add(reservation)
        await db.commit()
        await db.refresh(reservation)

        # Save selected guests into guest_checkin_details
        from app.models import GuestCheckInDetail, Customer
        primary_saved = False
        if request.guests:
            for guest in request.guests:
                c_res = await db.execute(select(Customer).where(Customer.customer_id == guest.customer_id))
                customer_obj = c_res.scalar_one_or_none()
                if customer_obj:
                    is_primary = (customer_obj.customer_id == request.customer_id)
                    if is_primary:
                        primary_saved = True
                    guest_detail = GuestCheckInDetail(
                        reservation_id=reservation.reservation_id,
                        customer_id=customer_obj.customer_id,
                        guest_name=customer_obj.full_name,
                        nationality=customer_obj.nationality,
                        phone_number=customer_obj.phone_number,
                        passport_number=customer_obj.passport_number,
                        nin=customer_obj.nin,
                        is_primary=is_primary,
                        is_child=guest.is_child
                    )
                    db.add(guest_detail)
        
        if not primary_saved:
            c_res = await db.execute(select(Customer).where(Customer.customer_id == request.customer_id))
            customer_obj = c_res.scalar_one_or_none()
            if customer_obj:
                guest_detail = GuestCheckInDetail(
                    reservation_id=reservation.reservation_id,
                    customer_id=customer_obj.customer_id,
                    guest_name=customer_obj.full_name,
                    nationality=customer_obj.nationality,
                    phone_number=customer_obj.phone_number,
                    passport_number=customer_obj.passport_number,
                    nin=customer_obj.nin,
                    is_primary=True,
                    is_child=False
                )
                db.add(guest_detail)
                
        await db.commit()
        
        # Reload with customer relation loaded
        result = await db.execute(
            select(AccommodationReservation)
            .options(
                selectinload(AccommodationReservation.customer),
                selectinload(AccommodationReservation.guest_details)
            )
            .where(AccommodationReservation.reservation_id == reservation.reservation_id)
        )
        reservation = result.scalar_one()
        if reservation.customer:
            reservation.guest_name = reservation.customer.full_name
            reservation.guest_email = reservation.customer.email
        
        return reservation
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/reservations/{reservation_id}", response_model=AccommodationReservationResponse)
async def get_reservation(
    reservation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get reservation details"""
    from app.models import AccommodationReservation
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(AccommodationReservation)
        .options(
            selectinload(AccommodationReservation.customer),
            selectinload(AccommodationReservation.guest_details)
        )
        .where(AccommodationReservation.reservation_id == reservation_id)
    )
    reservation = result.scalar_one_or_none()
    
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found"
        )
    
    if reservation.customer:
        reservation.guest_name = reservation.customer.full_name
        reservation.guest_email = reservation.customer.email
        
    return reservation


@router.patch("/reservations/{reservation_id}", response_model=AccommodationReservationResponse)
async def update_reservation(
    reservation_id: int,
    request: AccommodationReservationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update reservation status"""
    from app.models import AccommodationReservation
    from sqlalchemy.orm import selectinload
    service = AccommodationService(db)
    reservation = await service.get_reservation(reservation_id)
    
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
    
    # Reload with customer
    result = await db.execute(
        select(AccommodationReservation)
        .options(
            selectinload(AccommodationReservation.customer),
            selectinload(AccommodationReservation.guest_details)
        )
        .where(AccommodationReservation.reservation_id == reservation_id)
    )
    reservation = result.scalar_one()
    if reservation.customer:
        reservation.guest_name = reservation.customer.full_name
        reservation.guest_email = reservation.customer.email
        
    return reservation


@router.post("/reservations/{reservation_id}/checkin", response_model=AccommodationReservationResponse)
async def check_in(
    reservation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Check in guest"""
    from app.models import AccommodationReservation
    from sqlalchemy.orm import selectinload
    service = AccommodationService(db)
    reservation = await service.check_in(reservation_id, current_user["user_id"])
    
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found"
        )
        
    # Reload with customer
    result = await db.execute(
        select(AccommodationReservation)
        .options(
            selectinload(AccommodationReservation.customer),
            selectinload(AccommodationReservation.guest_details)
        )
        .where(AccommodationReservation.reservation_id == reservation_id)
    )
    reservation = result.scalar_one()
    if reservation.customer:
        reservation.guest_name = reservation.customer.full_name
        reservation.guest_email = reservation.customer.email
        
    return reservation


@router.post("/reservations/{reservation_id}/checkout", response_model=AccommodationReservationResponse)
async def check_out(
    reservation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Check out guest"""
    from app.models import AccommodationReservation
    from sqlalchemy.orm import selectinload
    service = AccommodationService(db)
    reservation = await service.check_out(reservation_id, current_user["user_id"])
    
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found"
        )
    # Reload with customer & guest details
    result = await db.execute(
        select(AccommodationReservation)
        .options(
            selectinload(AccommodationReservation.customer),
            selectinload(AccommodationReservation.guest_details)
        )
        .where(AccommodationReservation.reservation_id == reservation_id)
    )
    return result.scalar_one()


# =====================================================================
# ADDITIONAL ENDPOINTS FOR WORKSPACE CRUD & LISTING
# =====================================================================

@router.get("/categories", response_model=List[RoomCategoryResponse])
async def get_all_categories(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Retrieve all room categories"""
    from app.models import RoomCategory
    result = await db.execute(select(RoomCategory).order_by(RoomCategory.room_category_id))
    return result.scalars().all()


@router.post("/categories", response_model=RoomCategoryResponse)
async def create_room_category(
    request: RoomCategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new room category"""
    from app.models import RoomCategory
    category = RoomCategory(
        category_name=request.category_name,
        description=request.description,
        base_rate_usd=request.base_rate_usd,
        is_active=request.is_active
    )
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


@router.put("/categories/{category_id}", response_model=RoomCategoryResponse)
async def update_room_category(
    category_id: int,
    request: RoomCategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update room category details"""
    from app.models import RoomCategory
    result = await db.execute(select(RoomCategory).where(RoomCategory.room_category_id == category_id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    if request.category_name is not None:
        category.category_name = request.category_name
    if request.description is not None:
        category.description = request.description
    if request.base_rate_usd is not None:
        category.base_rate_usd = request.base_rate_usd
    if request.is_active is not None:
        category.is_active = request.is_active
        
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


@router.delete("/categories/{category_id}")
async def delete_room_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete a room category"""
    from app.models import RoomCategory, Room
    result = await db.execute(select(RoomCategory).where(RoomCategory.room_category_id == category_id))
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
        
    # Check if category has rooms
    rooms_check = await db.execute(select(Room).where(Room.room_category_id == category_id))
    if rooms_check.scalars().first():
        raise HTTPException(status_code=400, detail="Cannot delete category with active rooms assigned to it.")
        
    await db.delete(category)
    await db.commit()
    return {"message": "Category deleted successfully"}


@router.post("/rooms", response_model=RoomResponse, status_code=status.HTTP_201_CREATED)
async def create_room_unit(
    request: RoomCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new room unit with beds, views, bathroom features, facilities, and images"""
    from app.models import Room, RoomCategory, RoomBed, RoomView, RoomBathroomFeature, RoomFacility, RoomImage
    from sqlalchemy.exc import IntegrityError
    from sqlalchemy.orm import selectinload

    # Verify category exists
    cat_check = await db.execute(select(RoomCategory).where(RoomCategory.room_category_id == request.room_category_id))
    if not cat_check.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Room category not found")

    # Check room_number uniqueness
    existing = await db.execute(select(Room).where(Room.room_number == request.room_number))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Room number '{request.room_number}' already exists. Please choose a unique room number."
        )

    try:
        room = Room(
            room_category_id=request.room_category_id,
            room_number=request.room_number,
            room_name=request.room_name,
            building=request.building,
            wing=request.wing,
            floor=request.floor,
            room_size=request.room_size,
            room_size_unit=request.room_size_unit,
            room_status=request.room_status,
            max_occupancy=request.max_occupancy,
            description=request.description,
            amenities=request.amenities,
            is_active=request.is_active
        )
        db.add(room)
        await db.flush()

        # Save beds
        for bed in request.beds:
            db.add(RoomBed(room_id=room.room_id, bed_type=bed.type, quantity=bed.quantity))

        # Save views
        for view_name in request.views:
            db.add(RoomView(room_id=room.room_id, view_name=view_name))

        # Save bathroom features
        for feature_name in request.bathroom_features:
            db.add(RoomBathroomFeature(room_id=room.room_id, feature_name=feature_name))

        # Save facilities
        for facility_name in request.room_facilities:
            db.add(RoomFacility(room_id=room.room_id, facility_name=facility_name))

        # Save images
        for idx, img in enumerate(request.images):
            if isinstance(img, str):
                image_url = img
                is_primary = (idx == 0)
            else:
                image_url = img.url
                is_primary = img.is_primary if hasattr(img, 'is_primary') else (idx == 0)
            db.add(RoomImage(room_id=room.room_id, image_url=image_url, display_order=idx, is_primary=is_primary))

        await db.commit()
    except IntegrityError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Integrity error creating room: {str(e.orig) if hasattr(e, 'orig') else str(e)}"
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create room: {str(e)}"
        )

    # Reload with full options
    result = await db.execute(
        select(Room)
        .where(Room.room_id == room.room_id)
        .options(
            selectinload(Room.category),
            selectinload(Room.beds),
            selectinload(Room.views),
            selectinload(Room.bathroom_features),
            selectinload(Room.room_facilities),
            selectinload(Room.images)
        )
    )
    return result.scalar_one()


@router.put("/rooms/{room_id}", response_model=RoomResponse)
async def update_room_unit(
    room_id: int,
    request: RoomUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update room unit details and child collections"""
    from app.models import Room, RoomCategory, RoomBed, RoomView, RoomBathroomFeature, RoomFacility, RoomImage
    from sqlalchemy import delete
    from sqlalchemy.exc import IntegrityError
    from sqlalchemy.orm import selectinload

    result = await db.execute(
        select(Room)
        .where(Room.room_id == room_id)
        .options(
            selectinload(Room.beds),
            selectinload(Room.views),
            selectinload(Room.bathroom_features),
            selectinload(Room.room_facilities),
            selectinload(Room.images)
        )
    )
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")

    if request.room_category_id is not None:
        cat_check = await db.execute(select(RoomCategory).where(RoomCategory.room_category_id == request.room_category_id))
        if not cat_check.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Room category not found")
        room.room_category_id = request.room_category_id

    if request.room_number is not None and request.room_number != room.room_number:
        dup_check = await db.execute(select(Room).where(Room.room_number == request.room_number))
        if dup_check.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Room number '{request.room_number}' already exists. Please choose a unique room number."
            )
        room.room_number = request.room_number

    if request.room_name is not None:
        room.room_name = request.room_name
    if request.building is not None:
        room.building = request.building
    if request.wing is not None:
        room.wing = request.wing
    if request.floor is not None:
        room.floor = request.floor
    if request.room_size is not None:
        room.room_size = request.room_size
    if request.room_size_unit is not None:
        room.room_size_unit = request.room_size_unit
    if request.room_status is not None:
        room.room_status = request.room_status
    if request.max_occupancy is not None:
        room.max_occupancy = request.max_occupancy
    if request.description is not None:
        room.description = request.description
    if request.amenities is not None:
        room.amenities = request.amenities
    if request.is_active is not None:
        room.is_active = request.is_active

    try:
        if request.beds is not None:
            room.beds.clear()
            for bed in request.beds:
                room.beds.append(RoomBed(room_id=room_id, bed_type=bed.type, quantity=bed.quantity))

        if request.views is not None:
            room.views.clear()
            for view_name in request.views:
                room.views.append(RoomView(room_id=room_id, view_name=view_name))

        if request.bathroom_features is not None:
            room.bathroom_features.clear()
            for feature_name in request.bathroom_features:
                room.bathroom_features.append(RoomBathroomFeature(room_id=room_id, feature_name=feature_name))

        if request.room_facilities is not None:
            room.room_facilities.clear()
            for facility_name in request.room_facilities:
                room.room_facilities.append(RoomFacility(room_id=room_id, facility_name=facility_name))

        if request.images is not None:
            room.images.clear()
            for idx, img in enumerate(request.images):
                if isinstance(img, str):
                    image_url = img
                    is_primary = (idx == 0)
                else:
                    image_url = img.url
                    is_primary = img.is_primary if hasattr(img, 'is_primary') else (idx == 0)
                room.images.append(RoomImage(room_id=room_id, image_url=image_url, display_order=idx, is_primary=is_primary))

        db.add(room)
        await db.commit()
    except IntegrityError as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Integrity error updating room: {str(e.orig) if hasattr(e, 'orig') else str(e)}"
        )
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to update room: {str(e)}"
        )

    res = await db.execute(
        select(Room)
        .where(Room.room_id == room_id)
        .options(
            selectinload(Room.category),
            selectinload(Room.beds),
            selectinload(Room.views),
            selectinload(Room.bathroom_features),
            selectinload(Room.room_facilities),
            selectinload(Room.images)
        )
    )
    return res.scalar_one()


@router.delete("/rooms/{room_id}")
async def delete_room_unit(
    room_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete a room unit"""
    from app.models import Room, AccommodationReservation
    result = await db.execute(select(Room).where(Room.room_id == room_id))
    room = result.scalar_one_or_none()
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
        
    # Check if there are active bookings
    bookings_check = await db.execute(
        select(AccommodationReservation)
        .where(
            and_(
                AccommodationReservation.room_id == room_id,
                AccommodationReservation.reservation_status.in_(["Pending", "Confirmed", "CheckedIn"])
            )
        )
    )
    if bookings_check.scalars().first():
        raise HTTPException(status_code=400, detail="Cannot delete room with active reservations.")
        
    await db.delete(room)
    await db.commit()
    return {"message": "Room deleted successfully"}


@router.get("/reservations", response_model=List[AccommodationReservationResponse])
async def get_all_reservations(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Retrieve all reservations"""
    from app.models import AccommodationReservation
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(AccommodationReservation)
        .options(
            selectinload(AccommodationReservation.customer),
            selectinload(AccommodationReservation.guest_details)
        )
        .order_by(AccommodationReservation.created_at.desc())
    )
    reservations = result.scalars().all()
    for res in reservations:
        if res.customer:
            res.guest_name = res.customer.full_name
            res.guest_email = res.customer.email
    return reservations


@router.delete("/reservations/{reservation_id}")
async def delete_reservation(
    reservation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete/cancel a reservation and free up room status"""
    from app.models import AccommodationReservation, Room
    result = await db.execute(select(AccommodationReservation).where(AccommodationReservation.reservation_id == reservation_id))
    res = result.scalar_one_or_none()
    if not res:
        raise HTTPException(status_code=404, detail="Reservation not found")
        
    # Re-release the room to Available if status was CheckedIn or Reserved
    if res.reservation_status in ["Pending", "Confirmed", "CheckedIn"]:
        room_check = await db.execute(select(Room).where(Room.room_id == res.room_id))
        room = room_check.scalar_one_or_none()
        if room:
            room.room_status = "Available"
            db.add(room)
            
    await db.delete(res)
    await db.commit()
    return {"message": "Reservation deleted successfully"}
