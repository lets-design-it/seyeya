"""
Hotel Details API Endpoints
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Form, File, UploadFile, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.core.security import get_current_admin_user
from app.schemas import HotelDetailsResponse, StandardResponse, HotelDetailsCreate, HotelDetailsUpdate
from app.services import HotelDetailsService
from app.utils.upload import validate_and_save_upload

router = APIRouter(prefix="/api/v1/hotel-details", tags=["hotel-details"])


@router.post("", response_model=StandardResponse[HotelDetailsResponse], status_code=status.HTTP_201_CREATED)
async def create_hotel_details(
    hotel_name: str = Form(...),
    phone_number: str = Form(...),
    email: str = Form(...),
    physical_address: str = Form(...),
    city: str = Form(...),
    country: str = Form(...),
    description: Optional[str] = Form(None),
    alternative_phone_number: Optional[str] = Form(None),
    website: Optional[str] = Form(None),
    postal_code: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    google_maps_pin: Optional[str] = Form(None),
    facebook_url: Optional[str] = Form(None),
    instagram_url: Optional[str] = Form(None),
    x_url: Optional[str] = Form(None),
    linkedin_url: Optional[str] = Form(None),
    youtube_url: Optional[str] = Form(None),
    check_in_time: Optional[str] = Form(None),
    check_out_time: Optional[str] = Form(None),
    currency: str = Form("USD"),
    timezone: str = Form("UTC"),
    vat_rate: Optional[float] = Form(18.00),
    order_hold_duration_minutes: Optional[int] = Form(60),
    is_active: bool = Form(True),
    logo: Optional[UploadFile] = File(None),
    cover_image: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_admin_user)
):
    """Create a new hotel profile (Admin only)"""
    # 1. Trigger Pydantic schema validation
    try:
        schema = HotelDetailsCreate(
            hotel_name=hotel_name,
            description=description,
            phone_number=phone_number,
            alternative_phone_number=alternative_phone_number,
            email=email,
            website=website,
            physical_address=physical_address,
            city=city,
            country=country,
            postal_code=postal_code,
            latitude=latitude,
            longitude=longitude,
            google_maps_pin=google_maps_pin,
            facebook_url=facebook_url,
            instagram_url=instagram_url,
            x_url=x_url,
            linkedin_url=linkedin_url,
            youtube_url=youtube_url,
            check_in_time=check_in_time,
            check_out_time=check_out_time,
            currency=currency,
            timezone=timezone,
            vat_rate=vat_rate,
            order_hold_duration_minutes=order_hold_duration_minutes,
            is_active=is_active
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    # 2. Process logo and cover image uploads
    logo_url = None
    if logo and logo.filename:
        logo_url = validate_and_save_upload(logo, "logo")

    cover_url = None
    if cover_image and cover_image.filename:
        cover_url = validate_and_save_upload(cover_image, "cover")

    # 3. Create profile via Service Layer
    service = HotelDetailsService(db)
    profile = await service.create_profile(
        user_id=current_user["user_id"],
        schema=schema,
        logo_url=logo_url,
        cover_image_url=cover_url
    )

    return StandardResponse(
        success=True,
        message="Hotel details profile created successfully.",
        data=profile
    )


@router.get("", response_model=StandardResponse[HotelDetailsResponse])
async def get_active_hotel_details(
    db: AsyncSession = Depends(get_db)
):
    """Retrieve the currently active hotel profile (Public)"""
    service = HotelDetailsService(db)
    profile = await service.get_active_profile()
    return StandardResponse(
        success=True,
        message="Active hotel details profile retrieved successfully.",
        data=profile
    )


@router.get("/all/list", response_model=StandardResponse[List[HotelDetailsResponse]])
async def list_hotel_profiles(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_admin_user)
):
    """List all hotel details profiles with pagination (Admin only)"""
    service = HotelDetailsService(db)
    profiles = await service.get_all(skip=skip, limit=limit)
    return StandardResponse(
        success=True,
        message="Hotel profiles listed successfully.",
        data=profiles
    )


@router.get("/{id}", response_model=StandardResponse[HotelDetailsResponse])
async def get_hotel_details_by_id(
    id: int,
    db: AsyncSession = Depends(get_db)
):
    """Retrieve a specific hotel details profile by ID (Public)"""
    service = HotelDetailsService(db)
    profile = await service.get_by_id(id)
    return StandardResponse(
        success=True,
        message="Hotel details profile retrieved successfully.",
        data=profile
    )


@router.put("/{id}", response_model=StandardResponse[HotelDetailsResponse])
async def update_hotel_details(
    id: int,
    hotel_name: Optional[str] = Form(None),
    phone_number: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    physical_address: Optional[str] = Form(None),
    city: Optional[str] = Form(None),
    country: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    alternative_phone_number: Optional[str] = Form(None),
    website: Optional[str] = Form(None),
    postal_code: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    google_maps_pin: Optional[str] = Form(None),
    facebook_url: Optional[str] = Form(None),
    instagram_url: Optional[str] = Form(None),
    x_url: Optional[str] = Form(None),
    linkedin_url: Optional[str] = Form(None),
    youtube_url: Optional[str] = Form(None),
    check_in_time: Optional[str] = Form(None),
    check_out_time: Optional[str] = Form(None),
    currency: Optional[str] = Form(None),
    timezone: Optional[str] = Form(None),
    vat_rate: Optional[float] = Form(None),
    order_hold_duration_minutes: Optional[int] = Form(None),
    is_active: Optional[bool] = Form(None),
    logo: Optional[UploadFile] = File(None),
    cover_image: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_admin_user)
):
    """Update hotel details profile (Admin only)"""
    # 1. Trigger Pydantic schema validation for update fields
    try:
        schema = HotelDetailsUpdate(
            hotel_name=hotel_name,
            description=description,
            phone_number=phone_number,
            alternative_phone_number=alternative_phone_number,
            email=email,
            website=website,
            physical_address=physical_address,
            city=city,
            country=country,
            postal_code=postal_code,
            latitude=latitude,
            longitude=longitude,
            google_maps_pin=google_maps_pin,
            facebook_url=facebook_url,
            instagram_url=instagram_url,
            x_url=x_url,
            linkedin_url=linkedin_url,
            youtube_url=youtube_url,
            check_in_time=check_in_time,
            check_out_time=check_out_time,
            currency=currency,
            timezone=timezone,
            vat_rate=vat_rate,
            order_hold_duration_minutes=order_hold_duration_minutes,
            is_active=is_active
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    # 2. Process uploads if provided
    logo_url = None
    if logo and logo.filename:
        logo_url = validate_and_save_upload(logo, "logo")

    cover_url = None
    if cover_image and cover_image.filename:
        cover_url = validate_and_save_upload(cover_image, "cover")

    # 3. Save updates via Service Layer
    service = HotelDetailsService(db)
    profile = await service.update_profile(
        user_id=current_user["user_id"],
        id=id,
        schema=schema,
        logo_url=logo_url,
        cover_image_url=cover_url
    )

    return StandardResponse(
        success=True,
        message="Hotel details updated successfully.",
        data=profile
    )


@router.delete("/{id}", response_model=StandardResponse[HotelDetailsResponse])
async def delete_hotel_details(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_admin_user)
):
    """Soft delete/deactivate a hotel details profile (Admin only)"""
    service = HotelDetailsService(db)
    profile = await service.deactivate_profile(
        user_id=current_user["user_id"],
        id=id
    )
    return StandardResponse(
        success=True,
        message="Hotel details profile deactivated successfully (soft deleted).",
        data=profile
    )
