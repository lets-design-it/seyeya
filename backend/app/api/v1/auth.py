"""
Authentication routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.schemas import UserRegisterRequest, UserLoginRequest, TokenResponse
from app.services import AuthService

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
async def register(request: UserRegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user"""
    if request.password != request.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match"
        )
    
    try:
        auth_service = AuthService(db)
        user, access_token, refresh_token = await auth_service.register_user(
            request.full_name, request.email, request.password, request.phone_number
        )
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=1800  # 30 minutes
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/login", response_model=TokenResponse)
async def login(request: UserLoginRequest, db: AsyncSession = Depends(get_db)):
    """Login user"""
    try:
        auth_service = AuthService(db)
        user, access_token, refresh_token = await auth_service.login_user(
            request.email, request.password
        )
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=1800
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request, db: AsyncSession = Depends(get_db)):
    """Refresh access token"""
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Not implemented yet"
    )
