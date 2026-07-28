"""
SEYEYA Courts Integrated Booking & Reservation System
Main FastAPI application
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.api.v1.auth import router as auth_router
from app.api.v1.restaurant import router as restaurant_router
from app.api.v1.accommodation import router as accommodation_router
from app.api.v1.conference import router as conference_router
from app.api.v1.payments import router as payments_router
from app.api.v1.crm import router as crm_router
from app.api.v1.roles import router as roles_router
from fastapi.staticfiles import StaticFiles
import os
from app.api.v1.payment_methods import router as payment_methods_router
from app.api.v1.hotel_details import router as hotel_details_router
from app.db.database import engine, Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown"""
    # Startup
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Seed default conference resources & meal packages if empty
    from sqlalchemy.orm import sessionmaker
    from sqlalchemy.ext.asyncio import AsyncSession
    from sqlalchemy import func, select
    from decimal import Decimal
    from app.models import ConferenceResource, ConferenceMealPackage
    
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        res_count = await session.execute(select(func.count(ConferenceResource.resource_id)))
        if res_count.scalar_one() == 0:
            session.add_all([
                ConferenceResource(resource_name="Sound PA System", daily_rate=Decimal("300000"), quantity=5, is_available=True),
                ConferenceResource(resource_name="HD Projector Display", daily_rate=Decimal("150000"), quantity=5, is_available=True),
            ])
        
        meal_count = await session.execute(select(func.count(ConferenceMealPackage.package_id)))
        if meal_count.scalar_one() == 0:
            session.add_all([
                ConferenceMealPackage(package_name="Standard Breakfast", price_per_person=Decimal("25000"), description="Breakfast Buffet", is_active=True),
                ConferenceMealPackage(package_name="Executive Full Day", price_per_person=Decimal("55000"), description="Full Day Executive Catering", is_active=True),
            ])
            
        # Seed Room Categories
        from app.models import RoomCategory, Room
        cat_count = await session.execute(select(func.count(RoomCategory.room_category_id)))
        if cat_count.scalar_one() == 0:
            c1 = RoomCategory(category_name="Seyeya Deluxe Safari Cottage", description="A luxurious private cottage overlooking the Nile...", base_rate_usd=Decimal("100"), is_active=True)
            c2 = RoomCategory(category_name="Executive Twin Room", description="Perfect for business travelers or friends traveling together...", base_rate_usd=Decimal("75"), is_active=True)
            c3 = RoomCategory(category_name="Seyeya Royal Honeymoon Suite", description="The peak of luxury. Provides a completely secluded villa feel...", base_rate_usd=Decimal("150"), is_active=True)
            session.add_all([c1, c2, c3])
            await session.commit()

            c1_id = c1.room_category_id
            c2_id = c2.room_category_id
            c3_id = c3.room_category_id

            # Seed Room Units
            r1 = Room(room_category_id=c1_id, room_number="101", floor="1st Floor", room_status="Available", max_occupancy=3, description="Charming cottage overlooking the gardens.", amenities="Nile View, AC, King Bed", is_active=True)
            r2 = Room(room_category_id=c1_id, room_number="102", floor="1st Floor", room_status="Occupied", max_occupancy=3, description="Luxury cottage close to the pool area.", amenities="Nile View, AC, King Bed", is_active=True)
            r3 = Room(room_category_id=c1_id, room_number="103", floor="1st Floor", room_status="Available", max_occupancy=3, description="Quiet cottage on the east wing.", amenities="Nile View, AC, King Bed", is_active=True)
            
            r4 = Room(room_category_id=c2_id, room_number="201", floor="2nd Floor", room_status="Available", max_occupancy=2, description="Executive style room with workstations.", amenities="Garden View, Work Station, Coffee Machine", is_active=True)
            r5 = Room(room_category_id=c2_id, room_number="202", floor="2nd Floor", room_status="Available", max_occupancy=2, description="Comfortable double beds.", amenities="Garden View, Work Station, Coffee Machine", is_active=True)
            r6 = Room(room_category_id=c2_id, room_number="203", floor="2nd Floor", room_status="Available", max_occupancy=2, description="Main road access room.", amenities="Garden View, Work Station, Coffee Machine", is_active=True)
            
            r7 = Room(room_category_id=c3_id, room_number="301", floor="3rd Floor", room_status="Reserved", max_occupancy=2, description="Exclusive honeymoon suite.", amenities="Private Jacuzzi, Champagne Bar, Panoramic Deck", is_active=True)
            r8 = Room(room_category_id=c3_id, room_number="302", floor="3rd Floor", room_status="Available", max_occupancy=2, description="Suite with plunge pool.", amenities="Private Jacuzzi, Champagne Bar, Plunge Pool", is_active=True)
            
            session.add_all([r1, r2, r3, r4, r5, r6, r7, r8])
            
        await session.commit()
        
    yield
    
    # Shutdown
    await engine.dispose()


# Create FastAPI app
app = FastAPI(
    title="SEYEYA Courts Integrated Booking System",
    description="Complete booking and reservation system for accommodation, restaurant, and conference halls",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers
app.include_router(auth_router)
app.include_router(restaurant_router)
app.include_router(accommodation_router)
app.include_router(conference_router)
app.include_router(payments_router)
app.include_router(crm_router)
app.include_router(roles_router)
app.include_router(payment_methods_router)
app.include_router(hotel_details_router)

# Mount upload directory to serve files statically
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "SEYEYA Courts Integrated Booking & Reservation System",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "database": "connected"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
