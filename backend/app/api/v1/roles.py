"""
Roles and permissions CRUD router
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Dict, Any
from app.db.database import get_db
from app.schemas import (
    RoleResponse, RoleCreate, RoleUpdate, 
    PermissionResponse, PermissionGroupResponse,
    UserRoleAssign, RolePermissionAssign
)
from app.services import RoleService
from app.core.security import check_permission

router = APIRouter(prefix="/api/v1/roles", tags=["roles"])


@router.get("", response_model=List[RoleResponse])
async def list_roles(
    current_user: Dict = Depends(check_permission("roles.view")),
    db: AsyncSession = Depends(get_db)
):
    """List all system roles with assigned permissions"""
    role_service = RoleService(db)
    roles = await role_service.list_roles()
    return roles


@router.get("/permissions", response_model=List[PermissionResponse])
async def list_permissions(
    current_user: Dict = Depends(check_permission("roles.view")),
    db: AsyncSession = Depends(get_db)
):
    """List all available permissions"""
    role_service = RoleService(db)
    perms = await role_service.list_permissions()
    return perms


@router.get("/permissions/groups", response_model=List[PermissionGroupResponse])
async def list_permission_groups(
    current_user: Dict = Depends(check_permission("roles.view")),
    db: AsyncSession = Depends(get_db)
):
    """List all permission groups with child permissions"""
    role_service = RoleService(db)
    groups = await role_service.list_permission_groups()
    return groups


@router.get("/{role_id}", response_model=RoleResponse)
async def get_role(
    role_id: int,
    current_user: Dict = Depends(check_permission("roles.view")),
    db: AsyncSession = Depends(get_db)
):
    """Get a detailed role representation"""
    role_service = RoleService(db)
    role = await role_service.get_role_by_id(role_id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    return role


@router.post("", response_model=RoleResponse, status_code=status.HTTP_201_CREATED)
async def create_role(
    request: RoleCreate,
    current_user: Dict = Depends(check_permission("roles.manage")),
    db: AsyncSession = Depends(get_db)
):
    """Create a new role with optional permission IDs"""
    role_service = RoleService(db)
    try:
        role = await role_service.create_role(
            role_name=request.role_name,
            description=request.description,
            parent_role_id=request.parent_role_id,
            is_active=request.is_active,
            is_system_role=request.is_system_role,
            permission_ids=request.permission_ids
        )
        return role
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.put("/{role_id}", response_model=RoleResponse)
async def update_role(
    role_id: int,
    request: RoleUpdate,
    current_user: Dict = Depends(check_permission("roles.manage")),
    db: AsyncSession = Depends(get_db)
):
    """Update role details and permissions"""
    role_service = RoleService(db)
    try:
        role = await role_service.update_role(role_id, request.dict(exclude_unset=True))
        if not role:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Role not found"
            )
        return role
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_role(
    role_id: int,
    current_user: Dict = Depends(check_permission("roles.manage")),
    db: AsyncSession = Depends(get_db)
):
    """Delete a system role"""
    role_service = RoleService(db)
    success = await role_service.delete_role(role_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    return


@router.post("/{role_id}/permissions", status_code=status.HTTP_200_OK)
async def assign_permissions_to_role(
    role_id: int,
    request: RolePermissionAssign,
    current_user: Dict = Depends(check_permission("roles.manage")),
    db: AsyncSession = Depends(get_db)
):
    """Update the exact permissions assigned to a role"""
    role_service = RoleService(db)
    role = await role_service.get_role_by_id(role_id)
    if not role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role not found"
        )
    user_id = current_user.get("user_id")
    await role_service.assign_permissions_to_role(role_id, request.permission_ids, granted_by=user_id)
    return {"message": "Permissions updated successfully"}


@router.post("/users/{user_id}/roles", status_code=status.HTTP_200_OK)
async def assign_role_to_user(
    user_id: int,
    request: UserRoleAssign,
    current_user: Dict = Depends(check_permission("roles.manage")),
    db: AsyncSession = Depends(get_db)
):
    """Assign a role to a user"""
    role_service = RoleService(db)
    assigned_by = current_user.get("user_id")
    try:
        await role_service.assign_role_to_user(
            user_id=user_id,
            role_id=request.role_id,
            assigned_by=assigned_by,
            expires_at=request.expires_at
        )
        return {"message": "Role assigned successfully"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/users/{user_id}/roles/{role_id}", status_code=status.HTTP_200_OK)
async def remove_user_role(
    user_id: int,
    role_id: int,
    current_user: Dict = Depends(check_permission("roles.manage")),
    db: AsyncSession = Depends(get_db)
):
    """Remove a role assignment from a user"""
    role_service = RoleService(db)
    success = await role_service.remove_user_role(user_id, role_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Role assignment not found"
        )
    return {"message": "Role assignment removed successfully"}
