"""
Repository implementation for Hotel Details
"""
from typing import List, Optional
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.models import HotelDetails


class HotelDetailsRepository:
    """Repository class for CRUD operations on HotelDetails"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_active(self) -> Optional[HotelDetails]:
        """Fetch the currently active hotel details profile"""
        stmt = select(HotelDetails).where(HotelDetails.is_active == True)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_id(self, id: int) -> Optional[HotelDetails]:
        """Fetch a specific hotel details profile by ID"""
        stmt = select(HotelDetails).where(HotelDetails.id == id)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all(self, skip: int = 0, limit: int = 20) -> List[HotelDetails]:
        """Fetch all hotel profiles (both active and inactive) with pagination"""
        stmt = select(HotelDetails).order_by(HotelDetails.id.desc()).offset(skip).limit(limit)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def create(self, hotel_details: HotelDetails) -> HotelDetails:
        """Create a new hotel details profile"""
        self.db.add(hotel_details)
        await self.db.commit()
        await self.db.refresh(hotel_details)
        return hotel_details

    async def update(self, hotel_details: HotelDetails) -> HotelDetails:
        """Update an existing hotel details profile"""
        self.db.add(hotel_details)
        await self.db.commit()
        await self.db.refresh(hotel_details)
        return hotel_details

    async def deactivate_all_except(self, exclude_id: int) -> None:
        """Deactivate all other hotel profiles except the specified ID"""
        stmt = (
            update(HotelDetails)
            .where(HotelDetails.id != exclude_id)
            .values(is_active=False)
        )
        await self.db.execute(stmt)
        await self.db.commit()

    async def delete(self, hotel_details: HotelDetails) -> None:
        """Permanently delete a hotel details record from database"""
        await self.db.delete(hotel_details)
        await self.db.commit()
