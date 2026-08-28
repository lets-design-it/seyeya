"""
Tests for application-wide file upload endpoints (app/api/v1/uploads.py) and static file serving (/uploads/...)
"""
import pytest
import pytest_asyncio
import io
from httpx import AsyncClient
from app.main import app
from app.core.security import create_access_token


@pytest_asyncio.fixture
async def async_client():
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client


@pytest.mark.asyncio
async def test_upload_single_image(async_client: AsyncClient):
    token = create_access_token(data={"sub": "1", "role": "Admin"})
    headers = {"Authorization": f"Bearer {token}"}

    # Fake JPEG image bytes
    fake_img = io.BytesIO(b"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xFF\xDB\x00C\x00")
    files = {"file": ("test_room.jpg", fake_img, "image/jpeg")}

    res = await async_client.post(
        "/api/v1/uploads/image?subfolder=rooms",
        files=files,
        headers=headers
    )
    assert res.status_code == 200, f"Upload failed: {res.text}"
    data = res.json()
    assert "url" in data
    assert data["url"].startswith("/uploads/rooms/")
    assert data["subfolder"] == "rooms"

    # Verify static file serving via GET request
    file_url = data["url"]
    static_res = await async_client.get(file_url)
    assert static_res.status_code == 200


@pytest.mark.asyncio
async def test_upload_multiple_images(async_client: AsyncClient):
    token = create_access_token(data={"sub": "1", "role": "Admin"})
    headers = {"Authorization": f"Bearer {token}"}

    fake_img1 = io.BytesIO(b"\xFF\xD8\xFF\xE0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xFF\xDB\x00C\x00")
    fake_img2 = io.BytesIO(b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01")

    files = [
        ("files", ("menu1.jpg", fake_img1, "image/jpeg")),
        ("files", ("menu2.png", fake_img2, "image/png"))
    ]

    res = await async_client.post(
        "/api/v1/uploads/images?subfolder=menu",
        files=files,
        headers=headers
    )
    assert res.status_code == 200, f"Bulk upload failed: {res.text}"
    data = res.json()
    assert "urls" in data
    assert len(data["urls"]) == 2
    assert data["urls"][0].startswith("/uploads/menu/")
    assert data["urls"][1].startswith("/uploads/menu/")


@pytest.mark.asyncio
async def test_invalid_subfolder_and_mime(async_client: AsyncClient):
    token = create_access_token(data={"sub": "1", "role": "Admin"})
    headers = {"Authorization": f"Bearer {token}"}

    fake_img = io.BytesIO(b"test")
    files = {"file": ("test.jpg", fake_img, "image/jpeg")}

    # Test invalid subfolder -> 400
    res1 = await async_client.post(
        "/api/v1/uploads/image?subfolder=invalid_folder",
        files=files,
        headers=headers
    )
    assert res1.status_code == 400
    assert "Invalid subfolder" in res1.json()["detail"]

    # Test disallowed file mime type -> 400
    bad_file = {"file": ("script.py", io.BytesIO(b"print('test')"), "text/x-python")}
    res2 = await async_client.post(
        "/api/v1/uploads/image?subfolder=rooms",
        files=bad_file,
        headers=headers
    )
    assert res2.status_code == 400
    assert "File type" in res2.json()["detail"]
