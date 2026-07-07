"""
File upload and validation utilities
"""
import os
import uuid
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings


def validate_and_save_upload(file: UploadFile, subfolder: str = "hotel") -> str:
    """
    Validates the uploaded file size and content type, renames it with a UUID,
    saves it to the configured uploads folder, and returns the relative file path.
    """
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file uploaded"
        )

    # 1. Validate file extension/mime type
    content_type = file.content_type
    if content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '{content_type}' is not allowed. Allowed types: {', '.join(settings.ALLOWED_IMAGE_TYPES)}"
        )

    # 2. Check file size
    # Read the file content to measure its size without losing the stream pointer
    file.file.seek(0, os.SEEK_END)
    file_size = file.file.tell()
    file.file.seek(0)  # Reset pointer to start

    if file_size > settings.MAX_UPLOAD_SIZE:
        max_mb = settings.MAX_UPLOAD_SIZE / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds the limit of {max_mb:.1f}MB"
        )

    # 3. Create target directories if they do not exist
    target_dir = os.path.join(settings.UPLOAD_DIR, subfolder)
    os.makedirs(target_dir, exist_ok=True)

    # 4. Generate unique filename to prevent collision
    ext = os.path.splitext(file.filename)[1].lower()
    if not ext:
        # Fallback to content type mapping if extension is missing
        if content_type == "image/png":
            ext = ".png"
        elif content_type in ["image/jpeg", "image/jpg"]:
            ext = ".jpg"
        elif content_type == "image/webp":
            ext = ".webp"
        else:
            ext = ".jpg"

    unique_filename = f"{uuid.uuid4()}{ext}"
    file_path = os.path.join(target_dir, unique_filename)

    # 5. Write the file stream to disk
    try:
        with open(file_path, "wb") as f:
            f.write(file.file.read())
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )

    # Return relative URL/path suitable for serving static files
    # E.g. "/uploads/hotel/<uuid>.jpg"
    return f"/{settings.UPLOAD_DIR}/{subfolder}/{unique_filename}"
