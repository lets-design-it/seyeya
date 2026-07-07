"""
Service implementation for managing Hotel Details
"""
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import HotelDetails
from app.repositories import HotelDetailsRepository
from app.schemas import HotelDetailsCreate, HotelDetailsUpdate


class HotelDetailsService:
    """Service layer coordinating business rules for HotelDetails"""

    def __init__(self, db: AsyncSession):
        self.repository = HotelDetailsRepository(db)

    async def get_active_profile(self) -> HotelDetails:
        """Get the currently active hotel profile or throw 404"""
        profile = await self.repository.get_active()
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Active hotel profile details not found"
            )
        return profile

    async def get_by_id(self, id: int) -> HotelDetails:
        """Get hotel details by ID or throw 404"""
        profile = await self.repository.get_by_id(id)
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Hotel profile details with ID {id} not found"
            )
        return profile

    async def get_all(self, skip: int = 0, limit: int = 20) -> List[HotelDetails]:
        """Fetch all hotel profiles with pagination"""
        return await self.repository.get_all(skip=skip, limit=limit)

    async def create_profile(
        self,
        user_id: int,
        schema: HotelDetailsCreate,
        logo_url: Optional[str] = None,
        cover_image_url: Optional[str] = None
    ) -> HotelDetails:
        """Create new hotel details profile and enforce single-active profile business rule"""
        
        # Instantiate db model
        profile = HotelDetails(
            hotel_name=schema.hotel_name,
            description=schema.description,
            phone_number=schema.phone_number,
            alternative_phone_number=schema.alternative_phone_number,
            email=schema.email,
            website=schema.website,
            physical_address=schema.physical_address,
            city=schema.city,
            country=schema.country,
            postal_code=schema.postal_code,
            latitude=schema.latitude,
            longitude=schema.longitude,
            google_maps_pin=schema.google_maps_pin,
            logo_url=logo_url,
            cover_image_url=cover_image_url,
            facebook_url=schema.facebook_url,
            instagram_url=schema.instagram_url,
            x_url=schema.x_url,
            linkedin_url=schema.linkedin_url,
            youtube_url=schema.youtube_url,
            check_in_time=schema.check_in_time,
            check_out_time=schema.check_out_time,
            currency=schema.currency,
            timezone=schema.timezone,
            is_active=schema.is_active,
            created_by=user_id,
            updated_by=user_id
        )

        profile = await self.repository.create(profile)

        # Deactivate others if this profile is marked active
        if profile.is_active:
            await self.repository.deactivate_all_except(profile.id)
            # Ensure session is in sync
            profile.is_active = True

        return profile

    async def update_profile(
        self,
        user_id: int,
        id: int,
        schema: HotelDetailsUpdate,
        logo_url: Optional[str] = None,
        cover_image_url: Optional[str] = None
    ) -> HotelDetails:
        """Partially update hotel details profile and enforce single-active rule if activated"""
        profile = await self.get_by_id(id)

        # Exclude None values to allow partial updates
        update_data = schema.model_dump(exclude_unset=True, exclude_none=True)
        
        # Handle email separately if it is set as Empty / EmailStr
        if schema.email:
            update_data["email"] = schema.email

        # Update text/numeric columns
        for key, value in update_data.items():
            setattr(profile, key, value)

        # Update files if new ones were uploaded
        if logo_url:
            profile.logo_url = logo_url
        if cover_image_url:
            profile.cover_image_url = cover_image_url

        # Track modification user
        profile.updated_by = user_id

        # Update database record
        profile = await self.repository.update(profile)

        # If this profile was updated to active, deactivate all other profiles
        if profile.is_active:
            await self.repository.deactivate_all_except(profile.id)
            profile.is_active = True

        return profile

    async def deactivate_profile(self, user_id: int, id: int) -> HotelDetails:
        """Deactivate a hotel profile (Soft-delete logic)"""
        profile = await self.get_by_id(id)
        profile.is_active = False
        profile.updated_by = user_id
        return await self.repository.update(profile)
