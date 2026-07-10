"""
Repository implementation for PaymentMethod database operations
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, and_
from typing import Optional, List
from app.models import PaymentMethod


class PaymentMethodRepository:
    """Repository for managing PaymentMethod records"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
        
    async def get_by_id(self, payment_method_id: int) -> Optional[PaymentMethod]:
        """Retrieve a payment method by its primary key ID"""
        result = await self.db.execute(
            select(PaymentMethod).where(PaymentMethod.id == payment_method_id)
        )
        return result.scalar_one_or_none()
        
    async def get_all_by_user(self, user_id: int) -> List[PaymentMethod]:
        """Retrieve all payment methods for a specific user"""
        result = await self.db.execute(
            select(PaymentMethod)
            .where(PaymentMethod.user_id == user_id)
            .order_by(PaymentMethod.is_default.desc(), PaymentMethod.created_at.desc())
        )
        return result.scalars().all()
        
    async def get_by_hash(self, user_id: int, unique_hash: str) -> Optional[PaymentMethod]:
        """Retrieve a payment method by user_id and unique_hash (duplicate detection)"""
        if not unique_hash:
            return None
        result = await self.db.execute(
            select(PaymentMethod).where(
                and_(
                    PaymentMethod.user_id == user_id,
                    PaymentMethod.unique_hash == unique_hash
                )
            )
        )
        return result.scalar_one_or_none()
        
    async def create(self, payment_method: PaymentMethod) -> PaymentMethod:
        """Create a new payment method"""
        self.db.add(payment_method)
        await self.db.commit()
        await self.db.refresh(payment_method)
        return payment_method
        
    async def update(self, payment_method: PaymentMethod) -> PaymentMethod:
        """Persist updates to a payment method"""
        self.db.add(payment_method)
        await self.db.commit()
        await self.db.refresh(payment_method)
        return payment_method
        
    async def delete(self, payment_method: PaymentMethod) -> bool:
        """Delete a payment method"""
        await self.db.delete(payment_method)
        await self.db.commit()
        return True
        
    async def unset_other_defaults(self, user_id: int, exclude_id: Optional[int] = None) -> None:
        """Set is_default = False for all other payment methods of the user"""
        query = update(PaymentMethod).where(
            and_(
                PaymentMethod.user_id == user_id,
                PaymentMethod.is_default == True
            )
        )
        if exclude_id is not None:
            query = query.where(PaymentMethod.id != exclude_id)
            
        await self.db.execute(query.values(is_default=False))
        await self.db.commit()
