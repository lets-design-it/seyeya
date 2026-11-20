"""
Payment methods API endpoints
"""
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.core.security import get_current_user
from app.schemas import PaymentMethodCreate, PaymentMethodUpdate, PaymentMethodResponse
from app.services import PaymentMethodService

router = APIRouter(prefix="/api/v1/payment-methods", tags=["payment-methods"])


@router.post("", response_model=PaymentMethodResponse, status_code=status.HTTP_201_CREATED, response_model_exclude_none=True)
async def create_payment_method(
    request: PaymentMethodCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Add a new payment method for the authenticated user"""
    user_id = current_user["user_id"]
    service = PaymentMethodService(db)
    return await service.create(user_id, request)


@router.get("", response_model=List[PaymentMethodResponse], response_model_exclude_none=True)
async def list_payment_methods(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Retrieve all payment methods for the authenticated user"""
    user_id = current_user["user_id"]
    service = PaymentMethodService(db)
    return await service.get_all_by_user(user_id)


@router.get("/{id}", response_model=PaymentMethodResponse, response_model_exclude_none=True)
async def get_payment_method(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Retrieve a specific payment method by ID (ownership verified)"""
    user_id = current_user["user_id"]
    service = PaymentMethodService(db)
    return await service.get_by_id(user_id, id)


@router.put("/{id}", response_model=PaymentMethodResponse, response_model_exclude_none=True)
async def update_payment_method(
    id: int,
    request: PaymentMethodUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update a payment method where applicable (nickname, defaults, expiry)"""
    user_id = current_user["user_id"]
    service = PaymentMethodService(db)
    return await service.update(user_id, id, request)


@router.delete("/{id}", status_code=status.HTTP_200_OK)
async def delete_payment_method(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete a payment method"""
    user_id = current_user["user_id"]
    service = PaymentMethodService(db)
    await service.delete(user_id, id)
    return {"detail": "Payment method deleted successfully"}


@router.patch("/{id}/default", response_model=PaymentMethodResponse, response_model_exclude_none=True)
async def set_default_payment_method(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Set a payment method as the default"""
    user_id = current_user["user_id"]
    service = PaymentMethodService(db)
    return await service.set_default(user_id, id)

