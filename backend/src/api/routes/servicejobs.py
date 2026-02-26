from fastapi import APIRouter, Depends
from src.services.servicejob_service import list_service_jobs_by_location

router = APIRouter()

@router.get("/service-jobs/{location_id}")
def list_service_jobs(location_id: UUID):
    return {"service_jobs": list_service_jobs_by_location(location_id)}
