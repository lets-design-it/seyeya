"""
Accommodation module routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
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
    from app.models import Room, RoomCategory, RoomAmenity, Amenity, RoomPolicy
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(Room)
        .options(
            selectinload(Room.category).selectinload(RoomCategory.beds),
            selectinload(Room.category).selectinload(RoomCategory.views),
            selectinload(Room.category).selectinload(RoomCategory.bathroom_features),
            selectinload(Room.category).selectinload(RoomCategory.room_facilities),
            selectinload(Room.category).selectinload(RoomCategory.images),
            selectinload(Room.category).selectinload(RoomCategory.amenity_assignments).selectinload(RoomAmenity.amenity).selectinload(Amenity.category),
            selectinload(Room.category).selectinload(RoomCategory.available_rates),
            selectinload(Room.category).selectinload(RoomCategory.policies).selectinload(RoomPolicy.policy)
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
        
        rate_per_night = getattr(room.category, 'base_rate', getattr(room.category, 'base_rate_usd', 0))
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
    from app.models import RoomCategory, RoomCategoryPhoto, RoomBed, RoomView, RoomBathroomFeature, RoomFacility, RoomImage, RoomAmenity, Amenity, RoomRatePlan, RoomPolicy
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(RoomCategory)
        .options(
            selectinload(RoomCategory.photos),
            selectinload(RoomCategory.beds),
            selectinload(RoomCategory.views),
            selectinload(RoomCategory.bathroom_features),
            selectinload(RoomCategory.room_facilities),
            selectinload(RoomCategory.images),
            selectinload(RoomCategory.amenity_assignments).selectinload(RoomAmenity.amenity).selectinload(Amenity.category),
            selectinload(RoomCategory.available_rates),
            selectinload(RoomCategory.policies).selectinload(RoomPolicy.policy)
        )
        .order_by(RoomCategory.room_category_id)
    )
    return result.scalars().all()


@router.post("/categories", response_model=RoomCategoryResponse)
async def create_room_category(
    request: RoomCategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new room category"""
    from app.models import RoomCategory, RoomCategoryPhoto, RoomBed, RoomView, RoomBathroomFeature, RoomFacility, RoomImage, RoomAmenity, Amenity, RoomRatePlan, RoomPolicy
    from sqlalchemy.orm import selectinload
    category = RoomCategory(
        category_name=request.category_name,
        description=request.description,
        base_rate=request.base_rate,
        room_size=request.room_size,
        room_size_unit=request.room_size_unit,
        max_occupancy=request.max_occupancy,
        is_active=request.is_active
    )
    db.add(category)
    await db.flush()
    
    # Save beds
    for bed in request.beds:
        db.add(RoomBed(room_category_id=category.room_category_id, bed_type=bed.type, quantity=bed.quantity))

    # Save views
    for view_name in request.views:
        db.add(RoomView(room_category_id=category.room_category_id, view_name=view_name))

    # Save bathroom features
    for feature_name in request.bathroom_features:
        db.add(RoomBathroomFeature(room_category_id=category.room_category_id, feature_name=feature_name))

    # Save facilities
    for facility_name in request.room_facilities:
        db.add(RoomFacility(room_category_id=category.room_category_id, facility_name=facility_name))

    # Save images
    for idx, img in enumerate(request.images):
        if isinstance(img, str):
            image_url = img
            is_primary = (idx == 0)
        else:
            image_url = img.url
            is_primary = img.is_primary if hasattr(img, 'is_primary') else (idx == 0)
        db.add(RoomImage(room_category_id=category.room_category_id, image_url=image_url, display_order=idx, is_primary=is_primary))
    db.add(category)
    await db.flush()
    
    if request.photos:
        for photo_url in request.photos:
            photo = RoomCategoryPhoto(
                room_category_id=category.room_category_id,
                photo_url=photo_url
            )
            db.add(photo)
            
    await db.commit()
    
    # Reload with photos and all relationships
    result = await db.execute(
        select(RoomCategory)
        .options(
            selectinload(RoomCategory.photos),
            selectinload(RoomCategory.beds),
            selectinload(RoomCategory.views),
            selectinload(RoomCategory.bathroom_features),
            selectinload(RoomCategory.room_facilities),
            selectinload(RoomCategory.images),
            selectinload(RoomCategory.amenity_assignments).selectinload(RoomAmenity.amenity).selectinload(Amenity.category),
            selectinload(RoomCategory.available_rates),
            selectinload(RoomCategory.policies).selectinload(RoomPolicy.policy)
        )
        .where(RoomCategory.room_category_id == category.room_category_id)
    )
    return result.scalar_one()


@router.put("/categories/{category_id}", response_model=RoomCategoryResponse)
async def update_room_category(
    category_id: int,
    request: RoomCategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update room category details"""
    from app.models import RoomCategory, RoomCategoryPhoto, RoomBed, RoomView, RoomBathroomFeature, RoomFacility, RoomImage, RoomAmenity, Amenity, RoomRatePlan, RoomPolicy
    from sqlalchemy import delete
    from sqlalchemy.orm import selectinload
    
    result = await db.execute(
        select(RoomCategory)
        .options(
            selectinload(RoomCategory.photos),
            selectinload(RoomCategory.beds),
            selectinload(RoomCategory.views),
            selectinload(RoomCategory.bathroom_features),
            selectinload(RoomCategory.room_facilities),
            selectinload(RoomCategory.images)
        )
        .where(RoomCategory.room_category_id == category_id)
    )
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    
    if request.category_name is not None:
        category.category_name = request.category_name
    if request.description is not None:
        category.description = request.description
    if request.base_rate is not None:
        category.base_rate = request.base_rate
    if request.room_size is not None:
        category.room_size = request.room_size
    if request.room_size_unit is not None:
        category.room_size_unit = request.room_size_unit
    if request.max_occupancy is not None:
        category.max_occupancy = request.max_occupancy
    if request.is_active is not None:
        category.is_active = request.is_active

    if request.beds is not None:
        category.beds.clear()
        for bed in request.beds:
            category.beds.append(RoomBed(room_category_id=category_id, bed_type=bed.type, quantity=bed.quantity))

    if request.views is not None:
        category.views.clear()
        for view_name in request.views:
            category.views.append(RoomView(room_category_id=category_id, view_name=view_name))

    if request.bathroom_features is not None:
        category.bathroom_features.clear()
        for feature_name in request.bathroom_features:
            category.bathroom_features.append(RoomBathroomFeature(room_category_id=category_id, feature_name=feature_name))

    if request.room_facilities is not None:
        category.room_facilities.clear()
        for facility_name in request.room_facilities:
            category.room_facilities.append(RoomFacility(room_category_id=category_id, facility_name=facility_name))

    if request.images is not None:
        category.images.clear()
        for idx, img in enumerate(request.images):
            if isinstance(img, str):
                image_url = img
                is_primary = (idx == 0)
            else:
                image_url = img.url
                is_primary = img.is_primary if hasattr(img, 'is_primary') else (idx == 0)
            category.images.append(RoomImage(room_category_id=category_id, image_url=image_url, display_order=idx, is_primary=is_primary))
        
    if request.photos is not None:
        category.photos.clear()
        for photo_url in request.photos:
            photo = RoomCategoryPhoto(
                room_category_id=category_id,
                photo_url=photo_url
            )
            category.photos.append(photo)
            
    db.add(category)
    await db.commit()
    
    # Reload category with all relationships
    result = await db.execute(
        select(RoomCategory)
        .options(
            selectinload(RoomCategory.photos),
            selectinload(RoomCategory.beds),
            selectinload(RoomCategory.views),
            selectinload(RoomCategory.bathroom_features),
            selectinload(RoomCategory.room_facilities),
            selectinload(RoomCategory.images),
            selectinload(RoomCategory.amenity_assignments).selectinload(RoomAmenity.amenity).selectinload(Amenity.category),
            selectinload(RoomCategory.available_rates),
            selectinload(RoomCategory.policies).selectinload(RoomPolicy.policy)
        )
        .where(RoomCategory.room_category_id == category_id)
    )
    return result.scalar_one()


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


@router.post("/categories/upload")
async def upload_category_photo(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Upload a room category photo"""
    from app.utils.upload import validate_and_save_upload
    photo_url = validate_and_save_upload(file, "categories")
    return {"photo_url": photo_url}


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
            room_status=request.room_status,
            is_active=request.is_active
        )
        db.add(room)

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

    # Reload with category
    result = await db.execute(
        select(Room)
        .where(Room.room_id == room.room_id)
        .options(selectinload(Room.category))
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
        .options(selectinload(Room.category))
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
    if request.room_status is not None:
        room.room_status = request.room_status
    if request.is_active is not None:
        room.is_active = request.is_active

    try:
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
        .options(selectinload(Room.category))
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


# =====================================================================
# ROOM AMENITIES, RATES, AND POLICIES ADMIN ENDPOINTS
# =====================================================================

from app.schemas import (
    AmenityCategoryCreate, AmenityCategoryUpdate, AmenityCategoryResponse,
    AmenityCreate, AmenityUpdate, AmenityResponse,
    RoomRatePlanCreate, RoomRatePlanUpdate, RoomRatePlanResponse,
    PolicyCreate, PolicyUpdate, PolicyResponse,
    RoomPolicyCreate, RoomPolicyUpdate, RoomPolicyResponse
)

@router.get("/amenity-categories", response_model=List[AmenityCategoryResponse])
async def get_amenity_categories(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    from app.models import AmenityCategory
    result = await db.execute(select(AmenityCategory).order_by(AmenityCategory.name))
    return result.scalars().all()

@router.post("/amenity-categories", response_model=AmenityCategoryResponse)
async def create_amenity_category(
    request: AmenityCategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    from app.models import AmenityCategory
    cat = AmenityCategory(**request.model_dump())
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return cat

@router.put("/amenity-categories/{category_id}", response_model=AmenityCategoryResponse)
async def update_amenity_category(
    category_id: int,
    request: AmenityCategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    from app.models import AmenityCategory
    result = await db.execute(select(AmenityCategory).where(AmenityCategory.category_id == category_id))
    cat = result.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    
    for key, value in request.dict(exclude_unset=True).items():
        setattr(cat, key, value)
        
    await db.commit()
    await db.refresh(cat)
    return cat

@router.delete("/amenity-categories/{category_id}")
async def delete_amenity_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    from app.models import AmenityCategory
    result = await db.execute(select(AmenityCategory).where(AmenityCategory.category_id == category_id))
    cat = result.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    await db.delete(cat)
    await db.commit()
    return {"message": "Deleted successfully"}

@router.get("/amenities", response_model=List[AmenityResponse])
async def get_amenities(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    from app.models import Amenity
    from sqlalchemy.orm import selectinload
    result = await db.execute(select(Amenity).options(selectinload(Amenity.category)).order_by(Amenity.name))
    return result.scalars().all()

@router.post("/amenities", response_model=AmenityResponse)
async def create_amenity(
    request: AmenityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    from app.models import Amenity
    from sqlalchemy.orm import selectinload
    amenity = Amenity(**request.model_dump())
    db.add(amenity)
    await db.commit()
    
    res = await db.execute(select(Amenity).options(selectinload(Amenity.category)).where(Amenity.amenity_id == amenity.amenity_id))
    return res.scalar_one()

@router.put("/amenities/{amenity_id}", response_model=AmenityResponse)
async def update_amenity(
    amenity_id: int,
    request: AmenityUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    from app.models import Amenity
    from sqlalchemy.orm import selectinload
    result = await db.execute(select(Amenity).options(selectinload(Amenity.category)).where(Amenity.amenity_id == amenity_id))
    amenity = result.scalar_one_or_none()
    if not amenity:
        raise HTTPException(status_code=404, detail="Amenity not found")
    
    for key, value in request.dict(exclude_unset=True).items():
        setattr(amenity, key, value)
        
    await db.commit()
    
    res = await db.execute(select(Amenity).options(selectinload(Amenity.category)).where(Amenity.amenity_id == amenity_id))
    return res.scalar_one()

@router.delete("/amenities/{amenity_id}")
async def delete_amenity(
    amenity_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    from app.models import Amenity
    result = await db.execute(select(Amenity).where(Amenity.amenity_id == amenity_id))
    amenity = result.scalar_one_or_none()
    if not amenity:
        raise HTTPException(status_code=404, detail="Amenity not found")
    await db.delete(amenity)
    await db.commit()
    return {"message": "Deleted successfully"}

@router.post("/categories/{category_id}/amenities")
async def assign_amenities_to_room(
    category_id: int,
    amenity_ids: List[int],
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    from app.models import RoomCategory, Amenity, RoomAmenity
    from sqlalchemy.exc import IntegrityError
    
    room_res = await db.execute(select(RoomCategory).where(RoomCategory.room_category_id == category_id))
    if not room_res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Category not found")
        
    # Clear existing
    await db.execute(RoomAmenity.__table__.delete().where(RoomAmenity.room_category_id == category_id))
    
    for a_id in amenity_ids:
        db.add(RoomAmenity(room_category_id=category_id, amenity_id=a_id))
        
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Invalid amenity ID provided")
        
    return {"message": "Amenities assigned successfully"}

@router.get("/categories/{category_id}/rates", response_model=List[RoomRatePlanResponse])
async def get_room_rates(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    from app.models import RoomRatePlan
    result = await db.execute(select(RoomRatePlan).where(RoomRatePlan.room_category_id == category_id))
    return result.scalars().all()

@router.post("/categories/{category_id}/rates", response_model=RoomRatePlanResponse)
async def create_room_rate(
    category_id: int,
    request: RoomRatePlanCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    from app.models import RoomRatePlan, RoomCategory
    room_res = await db.execute(select(RoomCategory).where(RoomCategory.room_category_id == category_id))
    if not room_res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Category not found")
        
    rate = RoomRatePlan(room_category_id=category_id, **request.model_dump())
    db.add(rate)
    await db.commit()
    await db.refresh(rate)
    return rate

@router.put("/categories/{category_id}/rates/{rate_id}", response_model=RoomRatePlanResponse)
async def update_room_rate(
    category_id: int,
    rate_id: int,
    request: RoomRatePlanUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    from app.models import RoomRatePlan
    result = await db.execute(select(RoomRatePlan).where(
        and_(RoomRatePlan.rate_id == rate_id, RoomRatePlan.room_category_id == category_id)
    ))
    rate = result.scalar_one_or_none()
    if not rate:
        raise HTTPException(status_code=404, detail="Rate plan not found")
        
    for key, value in request.dict(exclude_unset=True).items():
        setattr(rate, key, value)
        
    await db.commit()
    await db.refresh(rate)
    return rate

@router.delete("/categories/{category_id}/rates/{rate_id}")
async def delete_room_rate(
    category_id: int,
    rate_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    from app.models import RoomRatePlan
    result = await db.execute(select(RoomRatePlan).where(
        and_(RoomRatePlan.rate_id == rate_id, RoomRatePlan.room_category_id == category_id)
    ))
    rate = result.scalar_one_or_none()
    if not rate:
        raise HTTPException(status_code=404, detail="Rate plan not found")
    await db.delete(rate)
    await db.commit()
    return {"message": "Deleted successfully"}

# --- Policy Management ---

@router.get("/policies", response_model=List[PolicyResponse], tags=["Policies"])
async def get_policies(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    from app.models import Policy
    result = await db.execute(select(Policy).order_by(Policy.title))
    return result.scalars().all()


@router.post("/policies", response_model=PolicyResponse, tags=["Policies"])
async def create_policy(
    request: PolicyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    from app.models import Policy
    policy = Policy(**request.model_dump())
    db.add(policy)
    await db.commit()
    await db.refresh(policy)
    return policy


@router.put("/policies/{policy_id}", response_model=PolicyResponse, tags=["Policies"])
async def update_policy(
    policy_id: int,
    request: PolicyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    from app.models import Policy
    result = await db.execute(select(Policy).where(Policy.policy_id == policy_id))
    policy = result.scalar_one_or_none()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
        
    for key, value in request.model_dump(exclude_unset=True).items():
        setattr(policy, key, value)
        
    await db.commit()
    await db.refresh(policy)
    return policy


@router.delete("/policies/{policy_id}", tags=["Policies"])
async def delete_policy(
    policy_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    from app.models import Policy
    result = await db.execute(select(Policy).where(Policy.policy_id == policy_id))
    policy = result.scalar_one_or_none()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    await db.delete(policy)
    await db.commit()
    return {"message": "Deleted successfully"}


# --- Room Category Policy Assignments ---

@router.get("/categories/{category_id}/policies", response_model=List[RoomPolicyResponse], summary="Get Room Category Policies")
async def get_room_category_policies(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    from app.models import RoomPolicy, Policy
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(RoomPolicy)
        .options(selectinload(RoomPolicy.policy))
        .where(RoomPolicy.room_category_id == category_id)
    )
    return result.scalars().all()

@router.post("/categories/{category_id}/policies", response_model=RoomPolicyResponse, summary="Assign Policy To Category")
async def assign_policy_to_category(
    category_id: int,
    request: RoomPolicyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    from app.models import RoomPolicy, RoomCategory, Policy
    from sqlalchemy.orm import selectinload
    room_res = await db.execute(select(RoomCategory).where(RoomCategory.room_category_id == category_id))
    if not room_res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Category not found")
        
    policy_res = await db.execute(select(Policy).where(Policy.policy_id == request.policy_id))
    if not policy_res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Policy not found")
        
    policy_assignment = RoomPolicy(room_category_id=category_id, **request.model_dump())
    db.add(policy_assignment)
    await db.commit()
    
    # Reload with policy relation
    result = await db.execute(
        select(RoomPolicy)
        .options(selectinload(RoomPolicy.policy))
        .where(RoomPolicy.id == policy_assignment.id)
    )
    return result.scalar_one()

@router.put("/categories/{category_id}/policies/{assignment_id}", response_model=RoomPolicyResponse)
async def update_room_policy(
    category_id: int,
    assignment_id: int,
    request: RoomPolicyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    from app.models import RoomPolicy, Policy
    from sqlalchemy.orm import selectinload
    result = await db.execute(
        select(RoomPolicy)
        .options(selectinload(RoomPolicy.policy))
        .where(
            and_(RoomPolicy.id == assignment_id, RoomPolicy.room_category_id == category_id)
        )
    )
    policy_assignment = result.scalar_one_or_none()
    if not policy_assignment:
        raise HTTPException(status_code=404, detail="Policy assignment not found")
        
    for key, value in request.model_dump(exclude_unset=True).items():
        setattr(policy_assignment, key, value)
        
    await db.commit()
    await db.refresh(policy_assignment)
    return policy_assignment

@router.delete("/categories/{category_id}/policies/{assignment_id}")
async def delete_room_policy(
    category_id: int,
    assignment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    from app.models import RoomPolicy
    result = await db.execute(select(RoomPolicy).where(
        and_(RoomPolicy.id == assignment_id, RoomPolicy.room_category_id == category_id)
    ))
    policy_assignment = result.scalar_one_or_none()
    if not policy_assignment:
        raise HTTPException(status_code=404, detail="Policy assignment not found")
    await db.delete(policy_assignment)
    await db.commit()
    return {"message": "Deleted successfully"}
