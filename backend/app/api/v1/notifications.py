"""
Notification and Event Management REST Endpoints
"""
import uuid
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from sqlalchemy import select, desc, func, and_
from app.core.security import get_current_user, get_current_admin_user
from app.services.notifications import NotificationService
from app.models import Notification, NotificationEvent
from app.schemas import (
    NotificationResponse, NotificationPreferenceResponse,
    NotificationPreferenceUpdate, AdminSendNotificationRequest,
    AdminBroadcastNotificationRequest, NotificationStatistics,
    NotificationEventResponse, DeviceTokenRegister, DeviceTokenResponse
)

router = APIRouter(prefix="/api/v1/notifications", tags=["notifications"])

@router.get("", response_model=List[NotificationResponse])
async def list_notifications(
    status: Optional[str] = None,
    category: Optional[str] = None,
    priority: Optional[str] = None,
    all_recipients: bool = False,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Retrieve notifications for the authenticated user, or system-wide if staff and all_recipients=True"""
    service = NotificationService(db)
    is_staff = bool(current_user.get("is_staff", False) or current_user.get("payload", {}).get("is_admin", False))
    target_uid = None if (all_recipients and is_staff) else current_user["user_id"]
    notifications = await service.get_notifications(
        user_id=target_uid,
        status=status,
        category=category,
        priority=priority,
        limit=limit,
        offset=offset
    )
    return notifications

@router.get("/unread", response_model=List[NotificationResponse])
async def list_unread_notifications(
    all_recipients: bool = False,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Retrieve unread notifications for the authenticated user, or system-wide if staff and all_recipients=True"""
    service = NotificationService(db)
    is_staff = bool(current_user.get("is_staff", False) or current_user.get("payload", {}).get("is_admin", False))
    target_uid = None if (all_recipients and is_staff) else current_user["user_id"]
    notifications = await service.get_notifications(
        user_id=target_uid,
        status="UNREAD",
        limit=limit,
        offset=offset
    )
    return notifications

@router.get("/count", response_model=Dict[str, int])
async def get_notifications_count(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get total count of active notifications"""
    service = NotificationService(db)
    stats = await service.get_notification_counts(current_user["user_id"])
    return {"count": stats["total_count"]}

@router.get("/unread-count", response_model=Dict[str, int])
async def get_unread_notifications_count(
    all_recipients: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get total count of unread notifications, or system-wide if staff and all_recipients=True"""
    service = NotificationService(db)
    is_staff = bool(current_user.get("is_staff", False) or current_user.get("payload", {}).get("is_admin", False))
    target_uid = None if (all_recipients and is_staff) else current_user["user_id"]
    unread = await service.get_unread_count(target_uid)
    return {"unread_count": unread}

@router.get("/preferences", response_model=NotificationPreferenceResponse)
async def get_notification_preferences(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Retrieve user's notification preferences"""
    service = NotificationService(db)
    pref = await service.get_preferences(current_user["user_id"])
    return pref

@router.put("/preferences", response_model=NotificationPreferenceResponse)
async def update_notification_preferences(
    request: NotificationPreferenceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update user's notification preferences"""
    service = NotificationService(db)
    pref = await service.update_preferences(
        user_id=current_user["user_id"],
        updates=request.model_dump(exclude_unset=True)
    )
    return pref

@router.get("/{id}", response_model=NotificationResponse)
async def get_notification_by_id(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get a single notification by ID (Must be the recipient or admin)"""
    from sqlalchemy import select
    stmt = select(Notification).where(Notification.id == id)
    res = await db.execute(stmt)
    notification = res.scalar_one_or_none()
    
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
        
    # Security check: Recipient only, unless Super Admin
    if notification.recipient_id != current_user["user_id"]:
        # Check roles
        is_admin = False
        from app.models import UserRole, Role
        stmt_admin = select(UserRole).join(Role).where(
            UserRole.user_id == current_user["user_id"],
            Role.role_name == "Super Admin"
        )
        admin_res = await db.execute(stmt_admin)
        if not admin_res.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view this notification"
            )

    return notification

@router.patch("/{id}/read", response_model=NotificationResponse)
async def mark_notification_read(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Mark a specific notification as read"""
    service = NotificationService(db)
    notification = await service.mark_as_read(id, current_user["user_id"])
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found or not owned by user"
        )
    return notification

@router.patch("/read-all")
async def mark_all_notifications_read(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Mark all active notifications for user as read"""
    service = NotificationService(db)
    await service.mark_all_as_read(current_user["user_id"])
    return {"message": "All notifications marked as read"}

@router.delete("/{id}")
async def delete_notification(
    id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Soft-delete a notification"""
    service = NotificationService(db)
    success = await service.delete_notification(id, current_user["user_id"])
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    return {"message": "Notification deleted"}


@router.post("/device-token", response_model=DeviceTokenResponse)
async def register_device_token(
    request: DeviceTokenRegister,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Register or update a mobile push notification device token (FCM / APNs)"""
    uid = current_user["user_id"]
    from app.models import DeviceToken
    stmt = select(DeviceToken).where(
        DeviceToken.user_id == uid,
        DeviceToken.token == request.token
    )
    res = await db.execute(stmt)
    existing = res.scalar_one_or_none()
    if existing:
        existing.is_active = True
        existing.platform = request.platform
    else:
        dt = DeviceToken(
            user_id=uid,
            token=request.token,
            platform=request.platform,
            is_active=True
        )
        db.add(dt)
    await db.commit()
    return {"message": "Device token registered successfully", "status": "success"}


@router.delete("/device-token", response_model=DeviceTokenResponse)
async def unregister_device_token(
    token: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Unregister a mobile device token (e.g. on user logout)"""
    from app.models import DeviceToken
    from sqlalchemy import delete
    stmt = delete(DeviceToken).where(
        DeviceToken.user_id == current_user["user_id"],
        DeviceToken.token == token
    )
    await db.execute(stmt)
    await db.commit()
    return {"message": "Device token unregistered successfully", "status": "success"}


# =====================================================================
# ADMINISTRATIVE ENDPOINTS
# =====================================================================

@router.post("/admin/send", response_model=NotificationResponse)
async def admin_send_notification(
    request: AdminSendNotificationRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_admin_user)
):
    """Admin endpoint to send a direct notification to a specific user"""
    service = NotificationService(db)
    
    # If channel is BOTH, we create both IN_APP and EMAIL, returning the IN_APP one
    if request.channel == "BOTH":
        await service.create_notification(
            recipient_id=request.recipient_id,
            title=request.title,
            message=request.message,
            category=request.category,
            notification_type=request.notification_type,
            priority=request.priority,
            channel="EMAIL",
            action_url=request.action_url,
            background_tasks=background_tasks
        )
        notif = await service.create_notification(
            recipient_id=request.recipient_id,
            title=request.title,
            message=request.message,
            category=request.category,
            notification_type=request.notification_type,
            priority=request.priority,
            channel="IN_APP",
            action_url=request.action_url,
            background_tasks=background_tasks
        )
    else:
        notif = await service.create_notification(
            recipient_id=request.recipient_id,
            title=request.title,
            message=request.message,
            category=request.category,
            notification_type=request.notification_type,
            priority=request.priority,
            channel=request.channel,
            action_url=request.action_url,
            background_tasks=background_tasks
        )
        
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Notification was not generated (user preferences disabled for this channel/category)"
        )
        
    await db.commit()
    return notif

@router.post("/admin/broadcast")
async def admin_broadcast_notification(
    request: AdminBroadcastNotificationRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_admin_user)
):
    """Admin endpoint to broadcast notifications to a targeted user role or group"""
    service = NotificationService(db)
    
    channels = ["IN_APP", "EMAIL"] if request.channel == "BOTH" else [request.channel]
    total_sent = 0
    for channel in channels:
        sent = await service.broadcast_notification(
            title=request.title,
            message=request.message,
            category=request.category,
            priority=request.priority,
            channel=channel,
            recipient_group=request.recipient_group,
            role_name=request.role_name,
            action_url=request.action_url,
            background_tasks=background_tasks
        )
        total_sent += sent
        
    return {"message": f"Broadcast completed. Sent {total_sent} notifications across group: {request.recipient_group}"}

@router.get("/admin/list", response_model=List[NotificationResponse])
async def admin_list_notifications(
    recipient_id: Optional[int] = None,
    status: Optional[str] = None,
    category: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_admin_user)
):
    """Admin endpoint to audit all notifications in the system"""
    from sqlalchemy import select, desc
    conditions = []
    if recipient_id:
        conditions.append(Notification.recipient_id == recipient_id)
    if status:
        conditions.append(Notification.status == status)
    if category:
        conditions.append(Notification.category == category)
        
    stmt = select(Notification)
    if conditions:
        stmt = stmt.where(and_(*conditions))
    stmt = stmt.order_by(desc(Notification.created_at)).offset(offset).limit(limit)
    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/admin/statistics", response_model=NotificationStatistics)
async def admin_notification_statistics(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_admin_user)
):
    """Admin endpoint to retrieve system-wide notification metrics and category breakdowns"""
    from sqlalchemy import select, func
    total = int((await db.execute(select(func.count(Notification.id)))).scalar_one())
    unread = int((await db.execute(select(func.count(Notification.id)).where(Notification.status == "UNREAD"))).scalar_one())
    read = int((await db.execute(select(func.count(Notification.id)).where(Notification.status == "READ"))).scalar_one())
    archived = int((await db.execute(select(func.count(Notification.id)).where(Notification.status == "ARCHIVED"))).scalar_one())
    deleted = int((await db.execute(select(func.count(Notification.id)).where(Notification.status == "DELETED"))).scalar_one())
    
    cat_res = (await db.execute(select(Notification.category, func.count(Notification.id)).group_by(Notification.category))).all()
    category_counts = {cat: count for cat, count in cat_res}
    
    return {
        "total_count": total,
        "unread_count": unread,
        "read_count": read,
        "archived_count": archived,
        "deleted_count": deleted,
        "category_counts": category_counts
    }

@router.get("/admin/events", response_model=List[NotificationEventResponse])
async def admin_list_notification_events(
    event_type: Optional[str] = None,
    reference_type: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_admin_user)
):
    """Admin endpoint to audit all system-wide notification events tracked by the engine"""
    conditions = []
    if event_type:
        conditions.append(NotificationEvent.event_type == event_type)
    if reference_type:
        conditions.append(NotificationEvent.reference_type == reference_type)

    stmt = select(NotificationEvent)
    if conditions:
        stmt = stmt.where(and_(*conditions))
    stmt = stmt.order_by(desc(NotificationEvent.created_at)).offset(offset).limit(limit)
    res = await db.execute(stmt)
    return res.scalars().all()

