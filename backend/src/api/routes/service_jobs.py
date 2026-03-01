from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..auth.dependencies import require_role
from src.services.service_jobs_service import update_service_job_metadata

router = APIRouter(prefix="/service-jobs", tags=["service-jobs"])


class UpdateServiceJobMetadataPayload(BaseModel):
    sequence_order: int | None = None
    job_source: Literal["SCHEDULED", "EXTRA_REQUEST"] | None = None
    completed_at: datetime | None = None
    status: Literal["PENDING", "COMPLETED", "FAILED", "SKIPPED"] | None = None
    failure_reason: str | None = None
    proof_of_service_photo: str | None = None


@router.patch("/{job_id}/metadata")
async def patch_service_job_metadata(
    job_id: int,
    payload: UpdateServiceJobMetadataPayload,
    _user: dict = Depends(require_role("driver")),
) -> dict:
    updates = payload.model_dump(exclude_none=True)
    updated_job = update_service_job_metadata(job_id=job_id, updates=updates)
    return {"service_job": updated_job}
