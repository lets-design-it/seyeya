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
    RoomResponse, GuestCheckInDetailCreate
)
from app.services import AccommodationService
from app.repositories import AccommodationRepository

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
        reservation.num_adults = request.num_adults
        reservation.num_children = request.num_children
        reservation.special_requests = request.special_requests
        
        db.add(reservation)
        await db.commit()
        await db.refresh(reservation)
        
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
    service = AccommodationService(db)
    reservation = await service.get_reservation(reservation_id)
    
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found"
        )
    
    return reservation


@router.patch("/reservations/{reservation_id}", response_model=AccommodationReservationResponse)
async def update_reservation(
    reservation_id: int,
    request: AccommodationReservationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update reservation status"""
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
    await db.refresh(reservation)
    
    return reservation


@router.post("/reservations/{reservation_id}/checkin", response_model=AccommodationReservationResponse)
async def check_in(
    reservation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Check in guest"""
    service = AccommodationService(db)
    reservation = await service.check_in(reservation_id, current_user["user_id"])
    
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found"
        )
    
    return reservation


@router.post("/reservations/{reservation_id}/checkout", response_model=AccommodationReservationResponse)
async def check_out(
    reservation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Check out guest"""
    from datetime import datetime
    service = AccommodationService(db)
    reservation = await service.check_out(reservation_id, current_user["user_id"])
    
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reservation not found"
        )
    
    return reservation
