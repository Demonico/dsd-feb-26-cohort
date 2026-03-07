from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form
from uuid import uuid4
from typing import Optional
from ..auth.dependencies import require_role
from api.supabase_client import supabase_admin, supabase

router = APIRouter(
    prefix="/uploads",
    tags=["uploads"]
)

BUCKET_NAME = "proof_of_service_photo"
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    job_id: Optional[int] = Form(None),
    _=Depends(require_role("driver"))
):
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
    
    # Save file_name to database if job_id provided
    if job_id:
        try:
            supabase_admin.table("service_jobs").update(
                {"proof_of_service_photo": file_name}
            ).eq("job_id", job_id).execute()
        except Exception:
            pass  # Continue even if DB update fails
    
    try:
        signed_url = supabase_admin.storage.from_(BUCKET_NAME).create_signed_url(file_name, 3600)
        return {
            "file_name": file_name,
            "url": signed_url["signedURL"]
        }
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to generate URL")

@router.get("/job/{job_id}/proof")
async def get_job_proof(job_id: int, user=Depends(require_role("customer"))):
    if supabase_admin is None:
        raise HTTPException(status_code=503, detail="Service not configured")
    
    if job_id <= 0:
        raise HTTPException(status_code=400, detail="Invalid job ID")
    
    try:
        # Get job with location_id
        job_response = supabase.table("service_jobs").select(
            "job_id, proof_of_service_photo, location_id"
        ).eq("job_id", job_id).execute()
        
        if not job_response.data:
            raise HTTPException(status_code=404, detail="Job not found")
        
        job = job_response.data[0]
        location_id = job.get("location_id")
        
        # Verify ownership through location -> customer -> user chain
        if location_id:
            location_response = supabase.table("service_locations").select(
                "customer_id"
            ).eq("location_id", location_id).execute()
            
            if location_response.data:
                customer_id = location_response.data[0].get("customer_id")
                if customer_id:
                    customer_response = supabase.table("customers").select(
                        "user_id"
                    ).eq("customer_id", customer_id).execute()
                    
                    if customer_response.data:
                        customer_user_id = customer_response.data[0].get("user_id")
                        if customer_user_id != user["id"]:
                            raise HTTPException(status_code=403, detail="You don't own this job")
        
        file_name = job.get("proof_of_service_photo")
        if not file_name:
            raise HTTPException(status_code=404, detail="No proof image uploaded")
        
        signed_url = supabase_admin.storage.from_(BUCKET_NAME).create_signed_url(file_name, 3600)
        return {
            "file_name": file_name,
            "url": signed_url["signedURL"]
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve proof image: {str(e)}")