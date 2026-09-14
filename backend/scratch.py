import asyncio
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
response = client.get("/api/v1/conference/reservations")
print(response.status_code)
print(response.text)
