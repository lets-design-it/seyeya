"""
CRM module routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.db.database import get_db
from app.core.security import get_current_user
from app.schemas import (
    CustomerCreate, CustomerResponse, CustomerUpdate,
    CustomerProfileResponse, TransactionResponse, TopCustomerResponse
)
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
            gender=request.gender,
            date_of_birth=request.date_of_birth,
            nationality=request.nationality,
            address=request.address,
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


@router.get("/customers", response_model=List[CustomerResponse])
async def list_customers(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    service = CustomerService(db)
    customers = await service.list_customers(skip=skip, limit=limit)
    return customers


@router.put("/customers/{customer_id}", response_model=CustomerResponse)
async def put_customer(
    customer_id: int,
    request: CustomerUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    service = CustomerService(db)
    updated = await service.update_customer(customer_id, request.model_dump())
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return updated


@router.delete("/customers/{customer_id}")
async def delete_customer(
    customer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    service = CustomerService(db)
    ok = await service.deactivate_customer(customer_id)
    if not ok:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return {"status": "deactivated"}


@router.get("/customers/search", response_model=List[CustomerResponse])
async def search_customers(
    q: str,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    service = CustomerService(db)
    return await service.search_customers(q, skip=skip, limit=limit)


@router.get("/customers/{customer_id}/profile", response_model=CustomerProfileResponse)
async def customer_profile(
    customer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    service = CustomerService(db)
    profile = await service.get_customer_profile(customer_id)
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")
    return profile


@router.get("/customers/{customer_id}/transactions", response_model=List[TransactionResponse])
async def customer_transactions(
    customer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    service = CustomerService(db)
    txs = await service.get_customer_transactions(customer_id)
    return txs


@router.get("/top-customers", response_model=List[TopCustomerResponse])
async def top_customers(
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    service = CustomerService(db)
    customers = await service.get_top_customers(limit=limit)
    return customers


@router.get("/vip-customers", response_model=List[CustomerResponse])
async def vip_customers(
    min_spent: Optional[float] = 1000000.0,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    service = CustomerService(db)
    customers = await service.get_vip_customers(min_spent=min_spent)
    return customers
