"""
Authentication routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, List
from app.db.database import get_db
from app.schemas import (
    UserRegisterRequest, UserLoginRequest, TokenResponse, 
    RefreshTokenRequest, UserResponse, UserUpdate,
    ForgotPasswordRequest, ResetPasswordConfirm
)
from app.services import AuthService, UserService
from app.core.security import get_current_user, check_permission
from app.models import User, UserRole
from sqlalchemy import select
from sqlalchemy.orm import selectinload

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


async def build_token_response(user: User, access_token: str, refresh_token: str, db: AsyncSession) -> TokenResponse:
    """Helper to populate TokenResponse with metadata"""
    # Fetch relations (roles and customer profile)
    result = await db.execute(
        select(User)
        .where(User.user_id == user.user_id)
        .options(
            selectinload(User.customer),
            selectinload(User.roles).selectinload(UserRole.role)
        )
        .execution_options(populate_existing=True)
    )
    user_with_relations = result.scalar_one()
    
    customer_id = user_with_relations.customer.customer_id if user_with_relations.customer else None
    roles = [ur.role.role_name for ur in user_with_relations.roles if ur.role]
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=1800,  # 30 minutes
        user_id=user.user_id,
        full_name=user.full_name,
        email=user.email,
        is_staff=user.is_staff,
        customer_id=customer_id,
        roles=roles
    )


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
            request.full_name, request.email, request.password, request.phone_number, request.role_ids, request.is_staff
        )
        
        return await build_token_response(user, access_token, refresh_token, db)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/login", response_model=TokenResponse)
async def login(
    request: UserLoginRequest,
    req_obj: Request,
    db: AsyncSession = Depends(get_db)
):
    """Login user"""
    try:
        auth_service = AuthService(db)
        # Capture IP and User Agent for audit log
        ip_address = req_obj.client.host if req_obj.client else None
        user_agent = req_obj.headers.get("user-agent")
        
        user, access_token, refresh_token = await auth_service.login_user(
            email=request.email,
            password=request.password,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        return await build_token_response(user, access_token, refresh_token, db)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(request: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    """Refresh access token"""
    try:
        auth_service = AuthService(db)
        user, access_token, refresh_token = await auth_service.refresh_user_token(
            request.refresh_token
        )
        return await build_token_response(user, access_token, refresh_token, db)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )


@router.get("/me", response_model=Dict[str, Any])
async def get_me(current_user: Dict = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get profile info of the currently logged in user"""
    user_id = current_user.get("user_id")
    result = await db.execute(
        select(User)
        .where(User.user_id == user_id)
        .options(
            selectinload(User.customer),
            selectinload(User.roles).selectinload(UserRole.role)
        )
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
        
    customer_id = user.customer.customer_id if user.customer else None
    customer_code = user.customer.customer_code if user.customer else None
    roles = [ur.role.role_name for ur in user.roles if ur.role]
    
    return {
        "user_id": user.user_id,
        "full_name": user.full_name,
        "email": user.email,
        "phone_number": user.phone_number,
        "is_staff": user.is_staff,
        "is_active": user.is_active,
        "customer_id": customer_id,
        "customer_code": customer_code,
        "roles": roles
    }


@router.get("/users", response_model=List[UserResponse])
async def list_users(
    skip: int = 0,
    limit: int = 100,
    current_user: Dict = Depends(check_permission("users.view")),
    db: AsyncSession = Depends(get_db)
):
    """List all users in the system"""
    user_service = UserService(db)
    users = await user_service.list_users(skip=skip, limit=limit)
    return users


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    current_user: Dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed user information. Users can view their own profile, or staff with users.view permission can view any user."""
    is_self = current_user.get("user_id") == user_id
    
    if not is_self:
        permission_checker = check_permission("users.view")
        await permission_checker(current_user)
        
    user_service = UserService(db)
    user = await user_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    request: UserUpdate,
    current_user: Dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user information. Users can edit their own profile, or staff with users.edit permission can edit any user."""
    is_self = current_user.get("user_id") == user_id
    
    if not is_self:
        permission_checker = check_permission("users.edit")
        await permission_checker(current_user)
        
    user_service = UserService(db)
    try:
        user = await user_service.update_user(user_id, request.dict(exclude_unset=True))
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return user
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    current_user: Dict = Depends(check_permission("users.delete")),
    db: AsyncSession = Depends(get_db)
):
    """Deactivate/delete a user"""
    user_service = UserService(db)
    success = await user_service.delete_user(user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return


@router.post("/password-reset/request", status_code=status.HTTP_200_OK)
async def request_password_reset(
    request: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db)
):
    """Request a password reset link to be sent via email"""
    auth_service = AuthService(db)
    await auth_service.request_password_reset(request.email)
    return {"message": "If the email is registered in our system, a password reset link has been sent."}


@router.post("/password-reset/confirm", status_code=status.HTTP_200_OK)
async def confirm_password_reset(
    request: ResetPasswordConfirm,
    db: AsyncSession = Depends(get_db)
):
    """Reset password using the reset token received via email"""
    auth_service = AuthService(db)
    success = await auth_service.confirm_password_reset(request.token, request.new_password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token."
        )
    return {"message": "Password has been reset successfully."}
