from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status

from src.api.supabase_client import supabase, supabase_admin


def _client():
    return supabase_admin or supabase


def _request_type_for_job_source(job_source: str | None) -> str | None:
    if job_source == "EXTRA_REQUEST":
        return "EXTRA"
    if job_source == "SCHEDULED":
        return "SKIP"
    return None


def _attach_request_dates(jobs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not jobs:
        return []

    location_ids = list({job["location_id"] for job in jobs if job.get("location_id")})
    if not location_ids:
        return jobs

    requests_response = (
        _client()
        .table("customer_requests")
        .select("request_id,location_id,request_type,requested_for_date,created_at")
        .in_("location_id", location_ids)
        .execute()
    )
    requests = requests_response.data or []

    latest_by_key: dict[tuple[int, str], dict[str, Any]] = {}
    for request in requests:
        location_id = request.get("location_id")
        request_type = request.get("request_type")
        if not location_id or not request_type:
            continue

        key = (location_id, request_type)
        existing = latest_by_key.get(key)
        request_created_at = request.get("created_at") or ""
        existing_created_at = (existing or {}).get("created_at") or ""
        request_id = request.get("request_id") or 0
        existing_id = (existing or {}).get("request_id") or 0
        if (
            existing is None
            or request_created_at > existing_created_at
            or (request_created_at == existing_created_at and request_id > existing_id)
        ):
            latest_by_key[key] = request

    enriched_jobs: list[dict[str, Any]] = []
    for job in jobs:
        request_type = _request_type_for_job_source(job.get("job_source"))
        request = (
            latest_by_key.get((job["location_id"], request_type))
            if request_type and job.get("location_id")
            else None
        )
        enriched_jobs.append(
            {
                **job,
                "requested_for_date": (request or {}).get("requested_for_date"),
            }
        )

    return enriched_jobs


def update_service_job_metadata(job_id: int, updates: dict[str, Any]) -> dict[str, Any]:
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one metadata field is required",
        )

    if updates.get("status") == "COMPLETED" and "completed_at" not in updates:
        updates["completed_at"] = datetime.now(timezone.utc).isoformat()

    client = _client()

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

    return _attach_request_dates(data)[0]


def list_service_jobs_for_customer_user(user_id: str) -> list[dict[str, Any]]:
    client = _client()

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
    return _attach_request_dates(
        sorted(
        jobs,
        key=lambda row: (
            row.get("sequence_order") is None,
            row.get("sequence_order") if row.get("sequence_order") is not None else 10**9,
            row.get("job_id") if row.get("job_id") is not None else 10**9,
        ),
    )
    )
