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
from app.api.v1.notifications import router as notifications_router
from app.api.v1.uploads import router as uploads_router
from app.api.v1.currencies import router as currencies_router
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
            
        # Seed Room Categories & Units with Child Data
        from app.models import (
            RoomCategory, Room, RoomBed, RoomView, RoomBathroomFeature, RoomFacility, RoomImage
        )
        cat_count = await session.execute(select(func.count(RoomCategory.room_category_id)))
        if cat_count.scalar_one() == 0:
            c1 = RoomCategory(category_name="Seyeya Deluxe Safari Cottage", description="A luxurious private cottage overlooking the Nile...", base_rate=Decimal("100"), is_active=True)
            c2 = RoomCategory(category_name="Executive Twin Room", description="Perfect for business travelers or friends traveling together...", base_rate=Decimal("75"), is_active=True)
            c3 = RoomCategory(category_name="Seyeya Royal Honeymoon Suite", description="The peak of luxury. Provides a completely secluded villa feel...", base_rate=Decimal("150"), is_active=True)
            session.add_all([c1, c2, c3])
            await session.commit()

            c1_id = c1.room_category_id
            c2_id = c2.room_category_id
            c3_id = c3.room_category_id

            # Seed Room Units
            r1 = Room(room_category_id=c1_id, room_number="101", room_name="Deluxe Cottage 101", building="Main Cottage", wing="East Wing", floor="1st Floor", room_size=45.0, room_size_unit="m²", room_status="Available", max_occupancy=3, description="Charming cottage overlooking the gardens.", amenities="Nile View, AC, King Bed", is_active=True)
            r2 = Room(room_category_id=c1_id, room_number="102", room_name="Deluxe Cottage 102", building="Main Cottage", wing="East Wing", floor="1st Floor", room_status="Occupied", max_occupancy=3, description="Luxury cottage close to the pool area.", amenities="Nile View, AC, King Bed", is_active=True)
            r3 = Room(room_category_id=c1_id, room_number="103", room_name="Deluxe Cottage 103", building="Main Cottage", wing="East Wing", floor="1st Floor", room_status="Available", max_occupancy=3, description="Quiet cottage on the east wing.", amenities="Nile View, AC, King Bed", is_active=True)

            r4 = Room(room_category_id=c2_id, room_number="201", room_name="Executive Room 201", building="Executive Block", wing="North Wing", floor="2nd Floor", room_size=35.0, room_size_unit="m²", room_status="Available", max_occupancy=2, description="Executive style room with workstations.", amenities="Garden View, Work Station, Coffee Machine", is_active=True)
            r5 = Room(room_category_id=c2_id, room_number="202", room_name="Executive Room 202", building="Executive Block", wing="North Wing", floor="2nd Floor", room_size=35.0, room_size_unit="m²", room_status="Available", max_occupancy=2, description="Comfortable double beds.", amenities="Garden View, Work Station, Coffee Machine", is_active=True)
            r6 = Room(room_category_id=c2_id, room_number="203", room_name="Executive Room 203", building="Executive Block", wing="North Wing", floor="2nd Floor", room_size=35.0, room_size_unit="m²", room_status="Available", max_occupancy=2, description="Main road access room.", amenities="Garden View, Work Station, Coffee Machine", is_active=True)

            r7 = Room(room_category_id=c3_id, room_number="301", room_name="Royal Suite 301", building="Royal Villa", wing="West Wing", floor="3rd Floor", room_size=75.0, room_size_unit="m²", room_status="Reserved", max_occupancy=2, description="Exclusive honeymoon suite.", amenities="Private Jacuzzi, Champagne Bar, Panoramic Deck", is_active=True)
            r8 = Room(room_category_id=c3_id, room_number="302", room_name="Royal Suite 302", building="Royal Villa", wing="West Wing", floor="3rd Floor", room_size=75.0, room_size_unit="m²", room_status="Available", max_occupancy=2, description="Suite with plunge pool.", amenities="Private Jacuzzi, Champagne Bar, Plunge Pool", is_active=True)

            session.add_all([r1, r2, r3, r4, r5, r6, r7, r8])
            await session.commit()

            # Seed child records for Deluxe Cottages (r1, r2, r3)
            for room_obj in [r1, r2, r3]:
                session.add_all([
                    RoomBed(room_id=room_obj.room_id, bed_type="King Bed", quantity=1),
                    RoomView(room_id=room_obj.room_id, view_name="Nile River View"),
                    RoomView(room_id=room_obj.room_id, view_name="Garden View"),
                    RoomBathroomFeature(room_id=room_obj.room_id, feature_name="Rain Shower"),
                    RoomBathroomFeature(room_id=room_obj.room_id, feature_name="Free-standing Bathtub"),
                    RoomFacility(room_id=room_obj.room_id, facility_name="High-Speed Wi-Fi"),
                    RoomFacility(room_id=room_obj.room_id, facility_name="Air Conditioning"),
                    RoomFacility(room_id=room_obj.room_id, facility_name="Private Patio"),
                    RoomFacility(room_id=room_obj.room_id, facility_name="Mini Fridge"),
                    RoomImage(room_id=room_obj.room_id, image_url="https://images.unsplash.com/photo-1566665797739-1674de7a421a", display_order=0, is_primary=True, caption="Cottage Exterior & Deck"),
                    RoomImage(room_id=room_obj.room_id, image_url="https://images.unsplash.com/photo-1590490360182-c33d57733427", display_order=1, is_primary=False, caption="Bedroom Interior")
                ])

            # Seed child records for Executive Rooms (r4, r5, r6)
            for room_obj in [r4, r5, r6]:
                session.add_all([
                    RoomBed(room_id=room_obj.room_id, bed_type="Twin Bed", quantity=2),
                    RoomView(room_id=room_obj.room_id, view_name="Garden View"),
                    RoomBathroomFeature(room_id=room_obj.room_id, feature_name="Glass Walk-in Shower"),
                    RoomBathroomFeature(room_id=room_obj.room_id, feature_name="Hair Dryer"),
                    RoomFacility(room_id=room_obj.room_id, facility_name="High-Speed Wi-Fi"),
                    RoomFacility(room_id=room_obj.room_id, facility_name="Ergonomic Work Desk"),
                    RoomFacility(room_id=room_obj.room_id, facility_name="Espresso Coffee Machine"),
                    RoomImage(room_id=room_obj.room_id, image_url="https://images.unsplash.com/photo-1618773928121-c32242e63f39", display_order=0, is_primary=True, caption="Executive Bedroom"),
                    RoomImage(room_id=room_obj.room_id, image_url="https://images.unsplash.com/photo-1582719478250-c89cae4dc85b", display_order=1, is_primary=False, caption="Workstation Area")
                ])

            # Seed child records for Royal Suites (r7, r8)
            for room_obj in [r7, r8]:
                session.add_all([
                    RoomBed(room_id=room_obj.room_id, bed_type="Super King Bed", quantity=1),
                    RoomView(room_id=room_obj.room_id, view_name="Panoramic Nile View"),
                    RoomView(room_id=room_obj.room_id, view_name="Sunset Deck View"),
                    RoomBathroomFeature(room_id=room_obj.room_id, feature_name="Hydro-massage Jacuzzi"),
                    RoomBathroomFeature(room_id=room_obj.room_id, feature_name="Double Vanity"),
                    RoomBathroomFeature(room_id=room_obj.room_id, feature_name="Luxury Bathrobes"),
                    RoomFacility(room_id=room_obj.room_id, facility_name="Private Plunge Pool"),
                    RoomFacility(room_id=room_obj.room_id, facility_name="Champagne Mini Bar"),
                    RoomFacility(room_id=room_obj.room_id, facility_name="Smart Home Automation"),
                    RoomFacility(room_id=room_obj.room_id, facility_name="Free High-Speed Wi-Fi"),
                    RoomImage(room_id=room_obj.room_id, image_url="https://images.unsplash.com/photo-1578683010236-d716f9a3f461", display_order=0, is_primary=True, caption="Royal Suite Master Bedroom"),
                    RoomImage(room_id=room_obj.room_id, image_url="https://images.unsplash.com/photo-1584622650111-993a426fbf0a", display_order=1, is_primary=False, caption="Private Jacuzzi & Balcony")
                ])

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
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"],
    allow_origin_regex=r"https?://.*",
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
app.include_router(notifications_router)
app.include_router(uploads_router)
app.include_router(currencies_router)

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
