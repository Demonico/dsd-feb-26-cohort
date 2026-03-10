from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from uuid import uuid4
from ..auth.dependencies import require_role
from src.api.supabase_client import supabase_admin

router = APIRouter(
    prefix="/uploads",
    tags=["uploads"]
)

BUCKET_NAME = "proof_of_service_photo"
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

@router.post("/image")
async def upload_image(file: UploadFile = File(...), _=Depends(require_role("driver"))):
    if supabase_admin is None:
        raise HTTPException(status_code=503, detail="Upload service not configured")
    
    if not file.filename or "." not in file.filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    contents = await file.read()
    
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty file")
    
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large")
    
    file_ext = file.filename.split(".")[-1].lower()
    file_name = f"{uuid4()}.{file_ext}"
    
    try:
        supabase_admin.storage.from_(BUCKET_NAME).upload(
            file_name,
            contents,
            {"content-type": file.content_type, "upsert": "false"}
        )
    except Exception:
        raise HTTPException(status_code=503, detail="Upload service unavailable")
    
    try:
        signed_url = supabase_admin.storage.from_(BUCKET_NAME).create_signed_url(file_name, 3600)
        return {
            "file_name": file_name,
            "url": signed_url["signedURL"]
        }
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to generate URL")