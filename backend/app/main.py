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
from app.db.database import engine, Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown"""
    # Startup
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
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
    allow_origins=["*"],
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
