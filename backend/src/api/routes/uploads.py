from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Form
from uuid import uuid4
from typing import Optional
from ..auth.dependencies import require_role
from ..supabase_client import supabase_admin, supabase

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
    user=Depends(require_role("driver"))
):
    if supabase_admin is None:
        raise HTTPException(status_code=503, detail="Upload service not configured")

    if not file.filename or "." not in file.filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Invalid file type")

    contents = await file.read()

    if not contents:
        raise HTTPException(status_code=400, detail="Empty file")

    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large")

    if job_id:
        try:
            driver = supabase.table("drivers").select(
                "driver_id"
            ).eq("user_id", user["id"]).single().execute()

            if not driver.data:
                raise HTTPException(status_code=403, detail="Driver not found")

            driver_id = driver.data.get("driver_id")

            job = supabase.table("service_jobs").select(
                "route_id"
            ).eq("job_id", job_id).single().execute()

            if not job.data:
                raise HTTPException(status_code=404, detail="Job not found")

            route_id = job.data.get("route_id")

            route = supabase.table("garbage_routes").select(
                "driver_id"
            ).eq("route_id", route_id).single().execute()

            if not route.data or route.data.get("driver_id") != driver_id:
                raise HTTPException(status_code=403, detail="You don't have permission to upload proof for this job")

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Authorization check failed: {str(e)}")

    if job_id:
        try:
            driver = supabase.table("drivers").select(
                "driver_id"
            ).eq("user_id", user["id"]).single().execute()

            if not driver.data:
                raise HTTPException(status_code=403, detail="Driver not found")

            driver_id = driver.data.get("driver_id")

            job = supabase.table("service_jobs").select(
                "route_id"
            ).eq("job_id", job_id).single().execute()

            if not job.data:
                raise HTTPException(status_code=404, detail="Job not found")

            route_id = job.data.get("route_id")

            route = supabase.table("garbage_routes").select(
                "driver_id"
            ).eq("route_id", route_id).single().execute()

            if not route.data or route.data.get("driver_id") != driver_id:
                raise HTTPException(status_code=403, detail="You don't have permission to upload proof for this job")

        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Authorization check failed: {str(e)}")

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

    if job_id:
        try:
            supabase_admin.table("service_jobs").update(
                {"proof_of_service_photo": file_name}
            ).eq("job_id", job_id).execute()
        except Exception:
            pass

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
        # Get job
        job = supabase.table("service_jobs").select(
            "job_id, proof_of_service_photo, location_id"
        ).eq("job_id", job_id).single().execute()

        if not job.data:
            raise HTTPException(status_code=404, detail="Job not found")

        job_data = job.data
        file_name = job_data.get("proof_of_service_photo")

        if not file_name:
            raise HTTPException(status_code=404, detail="No proof image uploaded")

        location_id = job_data.get("location_id")

        if location_id:

            location = supabase.table("service_locations").select(
                "customer_id"
            ).eq("location_id", location_id).single().execute()

            customer_id = location.data.get("customer_id") if location.data else None

            if customer_id:

                customer = supabase.table("customers").select(
                    "user_id"
                ).eq("customer_id", customer_id).single().execute()

                customer_user_id = customer.data.get("user_id") if customer.data else None

                if customer_user_id != user["id"]:
                    raise HTTPException(status_code=403, detail="You don't own this job")

        signed_url = supabase_admin.storage.from_(BUCKET_NAME).create_signed_url(file_name, 3600)

        return {
            "file_name": file_name,
            "url": signed_url["signedURL"]
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve proof image: {str(e)}"
        )