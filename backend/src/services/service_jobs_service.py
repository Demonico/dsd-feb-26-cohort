from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status

from src.api.supabase_client import supabase, supabase_admin


def _client():
    return supabase_admin or supabase


def _attach_location_details(jobs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not jobs:
        return []

    location_ids = list({job["location_id"] for job in jobs if job.get("location_id")})
    if not location_ids:
        return jobs

    locations_response = (
        _client()
        .table("service_locations")
        .select("location_id,street_address,city,state,zipcode")
        .in_("location_id", location_ids)
        .execute()
    )
    locations = {
        row["location_id"]: row for row in (locations_response.data or []) if row.get("location_id")
    }

    enriched_jobs: list[dict[str, Any]] = []
    for job in jobs:
        location = locations.get(job.get("location_id"), {})
        enriched_jobs.append(
            {
                **job,
                "address": {
                    "street_address": location.get("street_address"),
                    "city": location.get("city"),
                    "state": location.get("state"),
                    "zipcode": location.get("zipcode"),
                },
            }
        )

    return enriched_jobs


def _enrich_customer_jobs(jobs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return _attach_location_details(jobs)


def update_service_job_metadata(job_id: int, updates: dict[str, Any]) -> dict[str, Any]:
    if not updates:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one metadata field is required",
        )

    if "completed_at" in updates and isinstance(updates["completed_at"], datetime):
        updates["completed_at"] = updates["completed_at"].isoformat()
    
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

    return _enrich_customer_jobs(data)[0]


def list_service_jobs_for_driver(user_id: str) -> list[dict[str, Any]]:
    client = supabase_admin or supabase

    try:
        driver_response = (
            client.table("drivers")
            .select("driver_id")
            .eq("user_id", user_id)
            .limit(1)
            .execute()
        )
        
        driver_data = driver_response.data or []
        if not driver_data:
            return []
        
        driver_id = driver_data[0]["driver_id"]
        
        route_response = (
            client.table("garbage_routes")
            .select("route_id")
            .eq("driver_id", driver_id)
            .execute()
        )
        
        route_data = route_response.data or []
        if not route_data:
            return []
        
        route_ids = [r["route_id"] for r in route_data]
        
        response = (
            client.table("service_jobs")
            .select(
                "job_id,location_id,route_id,sequence_order,job_source,"
                "completed_at,status,failure_reason,proof_of_service_photo,"
                "service_locations(street_address,city,state,zipcode,customers(customer_name))"
            )
            .in_("route_id", route_ids)
            .execute()
        )
        return response.data or []
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch service jobs: {exc}",
        )


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
    return _enrich_customer_jobs(
        sorted(
            jobs,
            key=lambda row: (
                row.get("sequence_order") is None,
                row.get("sequence_order")
                if row.get("sequence_order") is not None
                else 10**9,
                row.get("job_id") if row.get("job_id") is not None else 10**9,
            ),
        )
    )
