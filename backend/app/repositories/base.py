"""
Base repository class for database operations
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from typing import Generic, TypeVar, Optional, List, Any
from pydantic import BaseModel

T = TypeVar("T")  # Database model
S = TypeVar("S")  # Pydantic schema


class BaseRepository(Generic[T]):
    """Base repository for CRUD operations"""
    
    def __init__(self, db: AsyncSession, model: type[T]):
        self.db = db
        self.model = model
    
    async def create(self, obj_in: BaseModel) -> T:
        """Create a new record"""
        obj_data = obj_in.model_dump()
        db_obj = self.model(**obj_data)
        self.db.add(db_obj)
        await self.db.commit()
        await self.db.refresh(db_obj)
        return db_obj
    
    async def get_by_id(self, id: int) -> Optional[T]:
        """Get record by ID"""
        result = await self.db.execute(
            select(self.model).where(self.model.id == id)
        )
        return result.scalar_one_or_none()
    
    async def get_all(self, skip: int = 0, limit: int = 100) -> List[T]:
        """Get all records with pagination"""
        result = await self.db.execute(
            select(self.model).offset(skip).limit(limit)
        )
        return result.scalars().all()
    
    async def update(self, id: int, obj_in: BaseModel) -> Optional[T]:
        """Update a record"""
        obj_data = obj_in.model_dump(exclude_unset=True)
        await self.db.execute(
            update(self.model).where(self.model.id == id).values(**obj_data)
        )
        await self.db.commit()
        return await self.get_by_id(id)
    
    async def delete(self, id: int) -> bool:
        """Delete a record"""
        await self.db.execute(
            delete(self.model).where(self.model.id == id)
        )
        await self.db.commit()
        return True
