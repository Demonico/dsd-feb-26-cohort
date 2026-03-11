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


def list_service_jobs_for_customer_user(user_id: str) -> list[dict[str, Any]]:
    client = supabase_admin or supabase

    customer_response = (
        client.table("customers")
        .select("customer_id")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    customer_rows = customer_response.data or []
    if not customer_rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer profile not found for current user",
        )

    customer_id = customer_rows[0]["customer_id"]
    locations_response = (
        client.table("service_locations")
        .select("location_id")
        .eq("customer_id", customer_id)
        .execute()
    )
    locations = locations_response.data or []
    location_ids = [row["location_id"] for row in locations if row.get("location_id")]
    if not location_ids:
        return []

    jobs_response = (
        client.table("service_jobs")
        .select(
            "job_id,location_id,route_id,sequence_order,job_source,"
            "completed_at,status,failure_reason,proof_of_service_photo"
        )
        .in_("location_id", location_ids)
        .execute()
    )
    jobs = jobs_response.data or []
    return sorted(
        jobs,
        key=lambda row: (
            row.get("sequence_order") is None,
            row.get("sequence_order") if row.get("sequence_order") is not None else 10**9,
            row.get("job_id") if row.get("job_id") is not None else 10**9,
        ),
    )
