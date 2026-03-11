from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..auth.dependencies import require_role
from src.services.service_jobs_service import (
    list_service_jobs_for_customer_user,
    list_service_jobs_for_driver,
    update_service_job_metadata,
)

router = APIRouter(prefix="/service-jobs", tags=["service-jobs"])


class UpdateServiceJobMetadataPayload(BaseModel):
    sequence_order: int | None = None
    job_source: Literal["SCHEDULED", "EXTRA_REQUEST"] | None = None
    completed_at: datetime | None = None
    status: Literal["PENDING", "COMPLETED", "FAILED", "SKIPPED"] | None = None
    failure_reason: Literal["IMPROPER_PLACEMENT", "CONTAMINATED_BIN", "BIN_NOT_OUT", "SAFETY_ISSUE"] | None = None
    proof_of_service_photo: str | None = None


@router.get("/")
async def read_driver_service_jobs(
    user: dict = Depends(require_role("driver")),
) -> dict:
    service_jobs = list_service_jobs_for_driver(user_id=user["id"])
    return {"service_jobs": service_jobs}


@router.get("/customer")
async def read_customer_service_jobs(
    user: dict = Depends(require_role("customer")),
) -> dict:
    service_jobs = list_service_jobs_for_customer_user(user_id=user["id"])
    return {"service_jobs": service_jobs}


@router.get("/my-jobs")
async def read_my_jobs(
    user: dict = Depends(require_role("customer")),
) -> list:
    return list_service_jobs_for_customer_user(user_id=user["id"])


@router.patch("/{job_id}/metadata")
async def patch_service_job_metadata(
    job_id: int,
    payload: UpdateServiceJobMetadataPayload,
    _user: dict = Depends(require_role("driver")),
) -> dict:
    updates = payload.model_dump(exclude_none=True)
    updated_job = update_service_job_metadata(job_id=job_id, updates=updates)
    return {"service_job": updated_job}
