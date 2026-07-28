"""
Unit and integration tests for the Centralized Notification & Event Management system.
"""
import pytest
import uuid
from datetime import datetime
from unittest.mock import MagicMock, AsyncMock
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import app
from app.db.database import get_db
from app.core.security import get_current_user, get_current_admin_user
from app.schemas import (
    NotificationResponse, NotificationPreferenceUpdate, 
    AdminSendNotificationRequest, AdminBroadcastNotificationRequest
)
from app.services.notifications import NotificationService
from app.models import Notification, NotificationPreference

client = TestClient(app)


# =====================================================================
# 1. SCHEMA VALIDATION TESTS
# =====================================================================

def test_notification_preference_update_schema():
    # Valid payload
    data = {
        "email_enabled": False,
        "in_app_enabled": True,
        "reservation_notifications": True,
        "order_notifications": False
    }
    schema = NotificationPreferenceUpdate(**data)
    assert schema.email_enabled is False
    assert schema.in_app_enabled is True
    assert schema.reservation_notifications is True
    assert schema.order_notifications is False
    assert schema.payment_notifications is None  # Unset remains None

def test_admin_send_notification_schema():
    # Valid payload
    data = {
        "recipient_id": 42,
        "title": "System Update",
        "message": "The system will undergo maintenance tonight at 10 PM.",
        "category": "System",
        "priority": "HIGH",
        "channel": "BOTH"
    }
    schema = AdminSendNotificationRequest(**data)
    assert schema.recipient_id == 42
    assert schema.priority == "HIGH"
    assert schema.channel == "BOTH"


# =====================================================================
# 2. REST API ENDPOINT TESTS
# =====================================================================

def test_list_notifications(monkeypatch):
    # Setup mocks
    mock_db = MagicMock()
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: {"user_id": 1, "email": "user@example.com"}

    mock_notif_id = uuid.uuid4()
    mock_notifications = [
        Notification(
            id=mock_notif_id,
            recipient_id=1,
            title="Welcome",
            message="Welcome to SEYEYA Courts!",
            category="Account",
            priority="NORMAL",
            channel="IN_APP",
            status="UNREAD",
            is_read=False,
            created_at=datetime.utcnow()
        )
    ]

    async def mock_get_notifications(self, user_id, status=None, category=None, priority=None, limit=20, offset=0):
        assert user_id == 1
        return mock_notifications

    monkeypatch.setattr(NotificationService, "get_notifications", mock_get_notifications)

    response = client.get("/api/v1/notifications")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Welcome"
    assert data[0]["id"] == str(mock_notif_id)

    app.dependency_overrides.clear()

def test_get_unread_count(monkeypatch):
    mock_db = MagicMock()
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: {"user_id": 1}

    async def mock_get_unread_count(self, user_id):
        assert user_id == 1
        return 5

    monkeypatch.setattr(NotificationService, "get_unread_count", mock_get_unread_count)

    response = client.get("/api/v1/notifications/unread-count")
    assert response.status_code == 200
    assert response.json()["unread_count"] == 5

    app.dependency_overrides.clear()

def test_mark_as_read(monkeypatch):
    mock_db = MagicMock()
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: {"user_id": 1}

    mock_notif_id = uuid.uuid4()
    mock_notif = Notification(
        id=mock_notif_id,
        recipient_id=1,
        title="Welcome",
        message="Body",
        category="Account",
        priority="NORMAL",
        channel="IN_APP",
        status="READ",
        is_read=True,
        created_at=datetime.utcnow()
    )

    async def mock_mark_as_read(self, notification_id, user_id):
        assert notification_id == mock_notif_id
        assert user_id == 1
        return mock_notif

    monkeypatch.setattr(NotificationService, "mark_as_read", mock_mark_as_read)

    response = client.patch(f"/api/v1/notifications/{mock_notif_id}/read")
    assert response.status_code == 200
    assert response.json()["is_read"] is True

    app.dependency_overrides.clear()

def test_get_preferences(monkeypatch):
    mock_db = MagicMock()
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: {"user_id": 1}

    mock_pref = NotificationPreference(
        id=uuid.uuid4(),
        user_id=1,
        email_enabled=True,
        in_app_enabled=True,
        updated_at=datetime.utcnow()
    )

    async def mock_get_prefs(self, user_id):
        return mock_pref

    monkeypatch.setattr(NotificationService, "get_preferences", mock_get_prefs)

    response = client.get("/api/v1/notifications/preferences")
    assert response.status_code == 200
    assert response.json()["email_enabled"] is True
    assert response.json()["in_app_enabled"] is True

    app.dependency_overrides.clear()

def test_update_preferences(monkeypatch):
    mock_db = MagicMock()
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: {"user_id": 1}

    mock_pref = NotificationPreference(
        id=uuid.uuid4(),
        user_id=1,
        email_enabled=False,
        in_app_enabled=True,
        updated_at=datetime.utcnow()
    )

    async def mock_update_prefs(self, user_id, updates):
        assert updates["email_enabled"] is False
        return mock_pref

    monkeypatch.setattr(NotificationService, "update_preferences", mock_update_prefs)

    response = client.put("/api/v1/notifications/preferences", json={"email_enabled": False})
    assert response.status_code == 200
    assert response.json()["email_enabled"] is False

    app.dependency_overrides.clear()


# =====================================================================
# 3. ADMINISTRATIVE ENDPOINT TESTS
# =====================================================================

def test_admin_send_notification(monkeypatch):
    mock_db = MagicMock()
    mock_db.commit = AsyncMock()
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_admin_user] = lambda: {"user_id": 999, "role": "admin"}

    mock_notif_id = uuid.uuid4()
    mock_notif = Notification(
        id=mock_notif_id,
        recipient_id=5,
        title="Admin Alert",
        message="Notice from admin",
        category="General",
        priority="NORMAL",
        channel="IN_APP",
        status="UNREAD",
        is_read=False,
        created_at=datetime.utcnow()
    )

    async def mock_create_notification(self, recipient_id, title, message, category, notification_type=None, priority="NORMAL", channel="IN_APP", action_url=None, reference_type=None, reference_id=None, event_id=None, expires_at=None, background_tasks=None):
        return mock_notif

    monkeypatch.setattr(NotificationService, "create_notification", mock_create_notification)

    payload = {
        "recipient_id": 5,
        "title": "Admin Alert",
        "message": "Notice from admin",
        "channel": "IN_APP"
    }

    response = client.post("/api/v1/notifications/admin/send", json=payload)
    assert response.status_code == 200
    assert response.json()["title"] == "Admin Alert"
    assert response.json()["recipient_id"] == 5

    app.dependency_overrides.clear()

def test_admin_broadcast_notification(monkeypatch):
    mock_db = MagicMock()
    mock_db.commit = AsyncMock()
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_admin_user] = lambda: {"user_id": 999, "role": "admin"}

    async def mock_broadcast_notification(self, title, message, category, priority, channel, recipient_group, role_name=None, action_url=None, background_tasks=None):
        assert recipient_group == "all_customers"
        return 10  # Mock 10 users notified

    monkeypatch.setattr(NotificationService, "broadcast_notification", mock_broadcast_notification)

    payload = {
        "recipient_group": "all_customers",
        "title": "Broadcast Test",
        "message": "System wide alert",
        "channel": "IN_APP"
    }

    response = client.post("/api/v1/notifications/admin/broadcast", json=payload)
    assert response.status_code == 200
    assert "Sent 10 notifications" in response.json()["message"]

    app.dependency_overrides.clear()
