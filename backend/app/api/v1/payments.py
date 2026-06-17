"""
Payments module routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.core.security import get_current_user, get_current_admin_user
from app.schemas import PaymentCreate, PaymentResponse
from app.services import PaymentService

router = APIRouter(prefix="/api/v1/payments", tags=["payments"])


@router.post("/", response_model=PaymentResponse)
async def create_payment(
    request: PaymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Initiate a payment"""
    try:
        service = PaymentService(db)
        payment = await service.create_payment(
            customer_id=request.customer_id if hasattr(request, 'customer_id') else None,
            payment_type=request.payment_type,
            reference_type=request.reference_type,
            reference_id=request.reference_id,
            payment_method=request.payment_method,
            amount_paid=request.amount_paid,
            is_deposit=request.is_deposit
        )
        return payment
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get payment details"""
    service = PaymentService(db)
    payment = await service.repo.get_by_id(payment_id)
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    return payment


@router.post("/{payment_id}/verify", response_model=PaymentResponse)
async def verify_payment(
    payment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_admin_user)
):
    """Verify a payment (admin only)"""
    service = PaymentService(db)
    payment = await service.verify_payment(payment_id, current_user["user_id"])
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found"
        )
    
    return payment
