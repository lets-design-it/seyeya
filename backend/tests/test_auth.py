"""
Unit and integration tests for authentication endpoints.
"""
import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from app.main import app
from app.db.database import get_db
from app.core.security import get_current_user
from app.services import AuthService

client = TestClient(app)

def test_logout_unauthenticated():
    # If no auth header, get_current_user dependency fails
    response = client.post("/api/v1/auth/logout", json={"refresh_token": "some-token"})
    assert response.status_code == 403  # HTTPBearer returns 403 Forbidden without token

def test_logout_success(monkeypatch):
    app.dependency_overrides[get_db] = lambda: MagicMock()
    app.dependency_overrides[get_current_user] = lambda: {"user_id": 1, "payload": {"sub": "1"}}
    
    async def mock_logout_user(self, refresh_token):
        assert refresh_token == "valid-refresh-token"
        return True
        
    monkeypatch.setattr(AuthService, "logout_user", mock_logout_user)
    
    payload = {"refresh_token": "valid-refresh-token"}
    response = client.post("/api/v1/auth/logout", json=payload)
    
    assert response.status_code == 200
    assert response.json()["message"] == "Logged out successfully."
    
    app.dependency_overrides.clear()

def test_logout_invalid_token(monkeypatch):
    app.dependency_overrides[get_db] = lambda: MagicMock()
    app.dependency_overrides[get_current_user] = lambda: {"user_id": 1, "payload": {"sub": "1"}}
    
    async def mock_logout_user(self, refresh_token):
        return False
        
    monkeypatch.setattr(AuthService, "logout_user", mock_logout_user)
    
    payload = {"refresh_token": "invalid-refresh-token"}
    response = client.post("/api/v1/auth/logout", json=payload)
    
    assert response.status_code == 400
    assert "invalid or already deactivated" in response.json()["detail"].lower()
    
    app.dependency_overrides.clear()
