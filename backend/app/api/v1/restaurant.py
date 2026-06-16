"""
Restaurant module routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from app.db.database import get_db
from app.core.security import get_current_user
from app.schemas import (
    RestaurantOrderCreate, RestaurantOrderResponse, RestaurantOrderUpdate,
    MenuCategoryResponse, MenuItemResponse, CustomerReviewCreate, CustomerReviewResponse
)
from app.services import RestaurantOrderService
from app.repositories import MenuRepository, ReviewRepository

router = APIRouter(prefix="/api/v1/restaurant", tags=["restaurant"])


@router.get("/menu/categories", response_model=List[MenuCategoryResponse])
async def get_menu_categories(db: AsyncSession = Depends(get_db)):
    """Get all menu categories"""
    repo = MenuRepository(db)
    categories = await repo.get_all_categories()
    return categories


@router.get("/menu/categories/{category_id}/items", response_model=List[MenuItemResponse])
async def get_category_items(category_id: int, db: AsyncSession = Depends(get_db)):
    """Get items in a menu category"""
    repo = MenuRepository(db)
    items = await repo.get_items_by_category(category_id)
    return items


@router.post("/orders", response_model=RestaurantOrderResponse)
async def create_order(
    request: RestaurantOrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new restaurant order"""
    try:
        service = RestaurantOrderService(db)
        order = await service.create_order(
            customer_id=request.customer_id,
            items_data=[item.model_dump() for item in request.items],
            delivery_option=request.delivery_option
        )
        
        # Set additional fields
        order.seating_location = request.seating_location
        order.delivery_address = request.delivery_address
        order.preferred_time = request.preferred_time
        order.special_instr = request.special_instr
        
        db.add(order)
        await db.commit()
        await db.refresh(order)
        
        return order
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/orders/{order_id}", response_model=RestaurantOrderResponse)
async def get_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get order details"""
    service = RestaurantOrderService(db)
    order = await service.get_order(order_id)
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    return order


@router.patch("/orders/{order_id}", response_model=RestaurantOrderResponse)
async def update_order(
    order_id: int,
    request: RestaurantOrderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update order status and payment"""
    try:
        service = RestaurantOrderService(db)
        order = await service.get_order(order_id)
        
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        if request.order_status:
            order.order_status = request.order_status
        
        if request.payment_status:
            order.payment_status = request.payment_status
        
        if request.amount_paid is not None:
            order.amount_paid = request.amount_paid
            order.balance_due = order.total_amount - request.amount_paid
        
        db.add(order)
        await db.commit()
        await db.refresh(order)
        
        return order
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/orders/{order_id}/reviews", response_model=CustomerReviewResponse)
async def create_review(
    order_id: int,
    request: CustomerReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a review for an order"""
    try:
        repo = ReviewRepository(db)
        review = await repo.create_review(
            customer_id=current_user["user_id"],
            review_type="Restaurant",
            reference_id=order_id,
            rating=request.rating,
            comment=request.comment
        )
        return review
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/orders/{order_id}/reviews", response_model=List[CustomerReviewResponse])
async def get_order_reviews(
    order_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get reviews for an order"""
    repo = ReviewRepository(db)
    reviews = await repo.get_for_reference("Restaurant", order_id)
    return reviews
