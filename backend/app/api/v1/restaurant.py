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
    MenuCategoryResponse, MenuCategoryCreate, MenuCategoryUpdate, MenuItemResponse, MenuItemCreate, MenuItemUpdate, MenuExtraCreate, MenuExtraResponse, CustomerReviewCreate, CustomerReviewResponse,
    MenuChoiceCreate, MenuChoiceUpdate, MenuChoiceResponse, MenuAccompanimentCreate, MenuAccompanimentUpdate, MenuAccompanimentResponse, MenuExtraUpdate,
    DeliveryPricingCreate, DeliveryPricingUpdate, DeliveryPricingResponse, DeliveryCalculationRequest, DeliveryCalculationResponse
)
from app.services import RestaurantOrderService
from app.repositories import MenuRepository, ReviewRepository

router = APIRouter(prefix="/api/v1/restaurant", tags=["restaurant"])


@router.get("/menu/categories", response_model=List[MenuCategoryResponse])
async def get_menu_categories(db: AsyncSession = Depends(get_db)):
    """Get all menu categories, auto-seeding standard ones if missing"""
    repo = MenuRepository(db)
    categories = await repo.get_all_categories()
    
    # Auto-seed standard categories if they don't exist
    standard_names = ["Local Food", "Continental", "Drinks", "Desserts"]
    existing_names = {c.category_name for c in categories}
    
    seeded = False
    for name in standard_names:
        if name not in existing_names:
            await repo.create_menu_category(
                category_name=name,
                description=f"Standard category for {name}",
                is_active=True
            )
            seeded = True
            
    if seeded:
        categories = await repo.get_all_categories()
        
    return categories


@router.post("/menu/categories", response_model=MenuCategoryResponse)
async def create_menu_category(request: MenuCategoryCreate, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Create a menu category"""
    repo = MenuRepository(db)
    category = await repo.create_menu_category(
        category_name=request.category_name,
        description=request.description,
        image_url=request.image_url,
        sort_order=request.sort_order or 0,
        is_active=request.is_active
    )
    return category


@router.put("/menu/categories/{category_id}", response_model=MenuCategoryResponse)
async def update_menu_category(
    category_id: int,
    request: MenuCategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update a menu category"""
    repo = MenuRepository(db)
    category = await repo.get_menu_category(category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
        
    updated_category = await repo.update_menu_category(category_id, **request.model_dump(exclude_unset=True))
    return updated_category


@router.delete("/menu/categories/{category_id}", status_code=status.HTTP_200_OK)
async def delete_menu_category(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete (deactivate) a menu category, if it has no active items"""
    repo = MenuRepository(db)
    
    # 1. Check if category exists
    category = await repo.get_menu_category(category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
        
    # 2. Check if there are active menu items attached to it
    items = await repo.get_items_by_category(category_id)
    if len(items) > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete category with active menu items. Please delete the items first."
        )
        
    # 3. Perform soft delete
    success = await repo.delete_menu_category(category_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
        
    return {"status": "deleted"}


@router.get("/menu/categories/{category_id}/items", response_model=List[MenuItemResponse])
async def get_category_items(category_id: int, db: AsyncSession = Depends(get_db)):
    """Get items in a menu category"""
    repo = MenuRepository(db)
    items = await repo.get_items_by_category(category_id)
    return items


@router.get("/menu/items", response_model=List[MenuItemResponse])
async def get_all_menu_items(db: AsyncSession = Depends(get_db)):
    """Get all menu items"""
    repo = MenuRepository(db)
    items = await repo.get_all_items()
    return items


@router.post("/menu/items", response_model=MenuItemResponse)
async def create_menu_item(request: MenuItemCreate, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Create a menu item"""
    repo = MenuRepository(db)
    item = await repo.create_menu_item(
        category_id=request.category_id,
        item_name=request.item_name,
        price=request.price,
        description=request.description,
        image_url=request.image_url,
        allergen_info=request.allergen_info,
        preparation_time=request.preparation_time,
        is_available=request.is_available,
        is_active=request.is_active,
        quantity=request.quantity or 0
    )
    return item


@router.put("/menu/items/{item_id}", response_model=MenuItemResponse)
async def update_menu_item(
    item_id: int,
    request: MenuItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update a menu item"""
    repo = MenuRepository(db)
    item = await repo.get_menu_item(item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found")
        
    updated_item = await repo.update_menu_item(item_id, **request.model_dump(exclude_unset=True))
    return updated_item


@router.delete("/menu/items/{item_id}", status_code=status.HTTP_200_OK)
async def delete_menu_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete (deactivate) a menu item"""
    repo = MenuRepository(db)
    success = await repo.delete_menu_item(item_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found")
    return {"status": "deleted"}


@router.get("/menu/items/{item_id}", response_model=MenuItemResponse)
async def get_menu_item(item_id: int, db: AsyncSession = Depends(get_db)):
    """Get a single menu item with extras"""
    repo = MenuRepository(db)
    item = await repo.get_menu_item(item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found")
    return item


@router.post("/menu/items/{item_id}/extras", response_model=MenuExtraResponse)
async def add_menu_item_extra(item_id: int, request: MenuExtraCreate, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Add an extra to a menu item"""
    repo = MenuRepository(db)
    # ensure menu item exists
    item = await repo.get_menu_item(item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found")
    extra = await repo.create_menu_extra_for_item(menu_item_id=item_id, extra_name=request.extra_name, price=request.price, is_available=request.is_available)
    # set image_url if provided
    if request.image_url:
        extra.image_url = request.image_url
        db.add(extra)
        await db.commit()
        await db.refresh(extra)
    return extra


@router.patch("/menu/extras/{extra_id}", response_model=MenuExtraResponse)
async def update_menu_extra(extra_id: int, request: MenuExtraUpdate, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Update a menu item extra option"""
    repo = MenuRepository(db)
    extra = await repo.update_menu_extra(extra_id, request.model_dump(exclude_unset=True))
    if not extra:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu extra not found")
    return extra


@router.delete("/menu/extras/{extra_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_menu_extra(extra_id: int, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Delete a menu item extra option"""
    repo = MenuRepository(db)
    success = await repo.delete_menu_extra(extra_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu extra not found")


@router.get("/menu/items/{item_id}/choices", response_model=List[MenuChoiceResponse])
async def get_menu_item_choices(item_id: int, db: AsyncSession = Depends(get_db)):
    """Get all choices/options for a menu item"""
    repo = MenuRepository(db)
    item = await repo.get_menu_item(item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found")
    return item.choices


@router.post("/menu/items/{item_id}/choices", response_model=MenuChoiceResponse, status_code=status.HTTP_201_CREATED)
async def add_menu_item_choice(item_id: int, request: MenuChoiceCreate, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Add a choice option to a menu item"""
    repo = MenuRepository(db)
    item = await repo.get_menu_item(item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found")
    choice = await repo.create_menu_choice_for_item(menu_item_id=item_id, choice_name=request.choice_name, price=request.price, is_available=request.is_available)
    return choice


@router.patch("/menu/choices/{choice_id}", response_model=MenuChoiceResponse)
async def update_menu_choice(choice_id: int, request: MenuChoiceUpdate, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Update a menu item choice option"""
    repo = MenuRepository(db)
    choice = await repo.update_menu_choice(choice_id, request.model_dump(exclude_unset=True))
    if not choice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu choice not found")
    return choice


@router.delete("/menu/choices/{choice_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_menu_choice(choice_id: int, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Delete a menu item choice option"""
    repo = MenuRepository(db)
    success = await repo.delete_menu_choice(choice_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu choice not found")


@router.get("/menu/items/{item_id}/accompaniments", response_model=List[MenuAccompanimentResponse])
async def get_menu_item_accompaniments(item_id: int, db: AsyncSession = Depends(get_db)):
    """Get all accompaniments for a menu item"""
    repo = MenuRepository(db)
    item = await repo.get_menu_item(item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found")
    return item.accompaniments


@router.post("/menu/items/{item_id}/accompaniments", response_model=MenuAccompanimentResponse, status_code=status.HTTP_201_CREATED)
async def add_menu_item_accompaniment(item_id: int, request: MenuAccompanimentCreate, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Add an accompaniment option to a menu item"""
    repo = MenuRepository(db)
    item = await repo.get_menu_item(item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu item not found")
    accompaniment = await repo.create_menu_accompaniment_for_item(menu_item_id=item_id, accompaniment_name=request.accompaniment_name, price=request.price, is_available=request.is_available)
    return accompaniment


@router.patch("/menu/accompaniments/{accompaniment_id}", response_model=MenuAccompanimentResponse)
async def update_menu_accompaniment(accompaniment_id: int, request: MenuAccompanimentUpdate, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Update a menu item accompaniment option"""
    repo = MenuRepository(db)
    accompaniment = await repo.update_menu_accompaniment(accompaniment_id, request.model_dump(exclude_unset=True))
    if not accompaniment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu accompaniment not found")
    return accompaniment


@router.delete("/menu/accompaniments/{accompaniment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_menu_accompaniment(accompaniment_id: int, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Delete a menu item accompaniment option"""
    repo = MenuRepository(db)
    success = await repo.delete_menu_accompaniment(accompaniment_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Menu accompaniment not found")


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
            delivery_option=request.delivery_option,
            delivery_lat=request.delivery_lat,
            delivery_lng=request.delivery_lng,
            delivery_charge=request.delivery_charge,
            delivery_address=request.delivery_address,
            preferred_time=request.preferred_time,
            special_instr=request.special_instr,
            seating_location=request.seating_location,
            allergy_info=request.allergy_info,
            assigned_waiter=request.assigned_waiter
        )
        
        # Trigger notification event for restaurant order
        try:
            from app.services.notifications import NotificationService
            notif_service = NotificationService(db)
            await notif_service.create_event(
                event_type="Order Placed",
                reference_type="RestaurantOrder",
                reference_id=str(order.order_id)
            )
        except Exception:
            pass
            
        return await service.get_order(order.order_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/orders", response_model=List[RestaurantOrderResponse])
async def list_orders(
    customer_id: Optional[int] = None,
    skip: int = 0,
    limit: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """List all restaurant orders, optionally filtered by customer_id"""
    service = RestaurantOrderService(db)
    if customer_id is not None:
        orders = await service.get_customer_orders(customer_id, skip=skip, limit=limit)
    else:
        orders = await service.get_all_orders(skip=skip, limit=limit)
    return orders


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
            
        update_fields = [
            "seating_location", "delivery_option", "delivery_address",
            "delivery_lat", "delivery_lng", "delivery_charge",
            "preferred_time", "special_instr", "allergy_info",
            "assigned_waiter", "tracking_number"
        ]
        for field in update_fields:
            val = getattr(request, field, None)
            if val is not None:
                setattr(order, field, val)
        
        db.add(order)
        await db.commit()
        
        return await service.get_order(order.order_id)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/orders/{order_id}", response_model=RestaurantOrderResponse)
async def cancel_restaurant_order(
    order_id: int,
    reason: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Cancel (soft delete) a restaurant order"""
    try:
        service = RestaurantOrderService(db)
        order = await service.cancel_order(order_id, reason)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        return order
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/orders/{order_id}/hard", response_model=dict)
async def delete_restaurant_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Hard delete a restaurant order"""
    try:
        service = RestaurantOrderService(db)
        deleted = await service.delete_order(order_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        return {"status": "success", "message": "Order deleted successfully"}
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


# =====================================================================
# Delivery Pricing Endpoints
# =====================================================================

@router.get("/delivery-pricing/active", response_model=DeliveryPricingResponse)
async def get_active_delivery_pricing(db: AsyncSession = Depends(get_db)):
    """Get the active delivery pricing configuration (public/app endpoint)"""
    from sqlalchemy.future import select
    from app.models import DeliveryPricing
    res = await db.execute(select(DeliveryPricing).where(DeliveryPricing.is_active == True).order_by(DeliveryPricing.pricing_id.desc()))
    pricing = res.scalars().first()
    if not pricing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active delivery pricing found")
    return pricing


@router.post("/delivery-pricing/calculate", response_model=DeliveryCalculationResponse)
async def calculate_delivery_pricing(request: DeliveryCalculationRequest, db: AsyncSession = Depends(get_db)):
    """Calculate the delivery fee for a given location"""
    from sqlalchemy.future import select
    from app.models import DeliveryPricing
    from app.utils.haversine import get_driving_distance_km
    from decimal import Decimal
    
    res = await db.execute(select(DeliveryPricing).where(DeliveryPricing.is_active == True).order_by(DeliveryPricing.pricing_id.desc()))
    pricing = res.scalars().first()
    
    if not pricing:
        return DeliveryCalculationResponse(
            is_deliverable=False,
            message="Delivery is currently unavailable (no active pricing)"
        )
        
    distance_km = await get_driving_distance_km(
        float(pricing.restaurant_lat), float(pricing.restaurant_lng),
        float(request.delivery_lat), float(request.delivery_lng)
    )
    
    if pricing.maximum_delivery_distance_km and Decimal(distance_km) > pricing.maximum_delivery_distance_km:
        return DeliveryCalculationResponse(
            is_deliverable=False,
            distance_km=round(Decimal(distance_km), 2),
            message=f"Delivery address is too far. Maximum delivery distance is {pricing.maximum_delivery_distance_km} km"
        )
        
    if distance_km < 1.0:
        calculated_fee = pricing.minimum_delivery_fee or Decimal(0)
    else:
        calculated_fee = Decimal(distance_km) * pricing.price_per_km
        if pricing.minimum_delivery_fee and calculated_fee < pricing.minimum_delivery_fee:
            calculated_fee = pricing.minimum_delivery_fee
        
    return DeliveryCalculationResponse(
        is_deliverable=True,
        distance_km=round(Decimal(distance_km), 2),
        price_per_km=pricing.price_per_km,
        delivery_charge=round(calculated_fee, 2),
        message="Delivery available"
    )


@router.get("/admin/delivery-pricing", response_model=List[DeliveryPricingResponse])
async def get_all_delivery_pricing(db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Get all delivery pricing configurations (admin)"""
    from sqlalchemy.future import select
    from app.models import DeliveryPricing
    res = await db.execute(select(DeliveryPricing).order_by(DeliveryPricing.pricing_id.desc()))
    return res.scalars().all()


@router.post("/admin/delivery-pricing", response_model=DeliveryPricingResponse, status_code=status.HTTP_201_CREATED)
async def create_delivery_pricing(request: DeliveryPricingCreate, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Create a new delivery pricing configuration (admin)"""
    from sqlalchemy.future import select
    from sqlalchemy import update
    from app.models import DeliveryPricing
    
    # If this is active, deactivate all others
    if request.is_active:
        await db.execute(
            update(DeliveryPricing).values(is_active=False)
        )
        
    pricing = DeliveryPricing(**request.model_dump())
    db.add(pricing)
    await db.commit()
    await db.refresh(pricing)
    return pricing


@router.put("/admin/delivery-pricing/{pricing_id}", response_model=DeliveryPricingResponse)
async def update_delivery_pricing(pricing_id: int, request: DeliveryPricingUpdate, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Update a delivery pricing configuration (admin)"""
    from sqlalchemy.future import select
    from sqlalchemy import update
    from app.models import DeliveryPricing
    
    res = await db.execute(select(DeliveryPricing).where(DeliveryPricing.pricing_id == pricing_id))
    pricing = res.scalar_one_or_none()
    
    if not pricing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delivery pricing not found")
        
    # If making this active, deactivate all others
    update_data = request.model_dump(exclude_unset=True)
    if update_data.get('is_active') is True:
        await db.execute(
            update(DeliveryPricing).where(DeliveryPricing.pricing_id != pricing_id).values(is_active=False)
        )
        
    for key, value in update_data.items():
        setattr(pricing, key, value)
        
    await db.commit()
    await db.refresh(pricing)
    return pricing


@router.delete("/admin/delivery-pricing/{pricing_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_delivery_pricing(pricing_id: int, db: AsyncSession = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """Delete a delivery pricing configuration (admin)"""
    from sqlalchemy.future import select
    from app.models import DeliveryPricing
    
    res = await db.execute(select(DeliveryPricing).where(DeliveryPricing.pricing_id == pricing_id))
    pricing = res.scalar_one_or_none()
    
    if not pricing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delivery pricing not found")
        
    await db.delete(pricing)
    await db.commit()

