"""
CRM module routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.db.database import get_db
from app.core.security import get_current_user
from app.schemas import CustomerCreate, CustomerResponse, CustomerUpdate
from app.services import CustomerService

router = APIRouter(prefix="/api/v1/crm", tags=["crm"])


@router.post("/customers", response_model=CustomerResponse)
async def create_customer(
    request: CustomerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new customer"""
    try:
        service = CustomerService(db)
        customer = await service.create_customer(
            full_name=request.full_name,
            phone_number=request.phone_number,
            email=request.email,
            customer_type=request.customer_type
        )
        return customer
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/customers/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get customer details"""
    service = CustomerService(db)
    customer = await service.get_customer(customer_id)
    
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    return customer


@router.get("/customers/lookup/{identifier}", response_model=CustomerResponse)
async def lookup_customer(
    identifier: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Lookup customer by NIN, Passport, or Phone"""
    service = CustomerService(db)
    customer = await service.lookup_customer(identifier)
    
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    return customer


@router.patch("/customers/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: int,
    request: CustomerUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update customer details"""
    service = CustomerService(db)
    customer = await service.get_customer(customer_id)
    
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )
    
    # Update only provided fields
    if request.full_name:
        customer.full_name = request.full_name
    if request.phone_number:
        customer.phone_number = request.phone_number
    if request.email:
        customer.email = request.email
    if request.address:
        customer.address = request.address
    
    db.add(customer)
    await db.commit()
    await db.refresh(customer)
    
    return customer
