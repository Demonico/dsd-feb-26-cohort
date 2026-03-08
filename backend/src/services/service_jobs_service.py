from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status

from src.api.supabase_client import supabase, supabase_admin


def update_service_job_metadata(job_id: int, updates: dict[str, Any]) -> dict[str, Any]:
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one metadata field is required",
        )

    if updates.get("status") == "COMPLETED" and "completed_at" not in updates:
        updates["completed_at"] = datetime.now(timezone.utc).isoformat()

    client = supabase_admin or supabase

    try:
        update_response = (
            client.table("service_jobs")
            .update(updates)
            .eq("job_id", job_id)
            .execute()
        )

        updated_rows = update_response.data or []
        if not updated_rows:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Service job not found: {job_id}",
            )

        response = (
            client.table("service_jobs")
            .select(
                "job_id,location_id,route_id,sequence_order,job_source,"
                "completed_at,status,failure_reason,proof_of_service_photo"
            )
            .eq("job_id", job_id)
            .limit(1)
            .execute()
        )
    except Exception as exc:
        if isinstance(exc, HTTPException):
            raise exc
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update service job metadata: {exc}",
        )

    data = response.data or []
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Service job not found: {job_id}",
        )

    return data[0]
