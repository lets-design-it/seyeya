"""
Generic file upload API endpoints for application-wide photo management.
"""
from fastapi import APIRouter, Depends, File, UploadFile, Query, HTTPException, status
from typing import List
from app.core.security import get_current_user
from app.utils.upload import validate_and_save_upload

router = APIRouter(prefix="/api/v1/uploads", tags=["uploads"])

ALLOWED_SUBFOLDERS = {"rooms", "menu", "conference", "hotel", "users", "general"}


@router.post("/image")
async def upload_single_image(
    file: UploadFile = File(...),
    subfolder: str = Query("rooms", description="Target upload subfolder: rooms, menu, conference, hotel, users"),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload a single image file into an organized module subfolder inside /uploads.
    Returns relative image URL path (e.g. /uploads/rooms/<uuid>.jpg).
    """
    clean_subfolder = subfolder.strip().lower()
    if clean_subfolder not in ALLOWED_SUBFOLDERS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid subfolder '{subfolder}'. Allowed subfolders: {', '.join(sorted(ALLOWED_SUBFOLDERS))}"
        )

    relative_url = validate_and_save_upload(file, subfolder=clean_subfolder)
    return {
        "url": relative_url,
        "filename": relative_url.split("/")[-1],
        "subfolder": clean_subfolder
    }


@router.post("/images")
async def upload_multiple_images(
    files: List[UploadFile] = File(...),
    subfolder: str = Query("rooms", description="Target upload subfolder: rooms, menu, conference, hotel, users"),
    current_user: dict = Depends(get_current_user)
):
    """
    Upload multiple images in a single batch request.
    Returns list of relative URL paths.
    """
    clean_subfolder = subfolder.strip().lower()
    if clean_subfolder not in ALLOWED_SUBFOLDERS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid subfolder '{subfolder}'. Allowed subfolders: {', '.join(sorted(ALLOWED_SUBFOLDERS))}"
        )

    if not files:
        raise HTTPException(status_code=400, detail="No files provided for upload")

    saved_urls = []
    for file in files:
        url = validate_and_save_upload(file, subfolder=clean_subfolder)
        saved_urls.append(url)

    return {
        "urls": saved_urls,
        "uploaded_count": len(saved_urls),
        "subfolder": clean_subfolder
    }
