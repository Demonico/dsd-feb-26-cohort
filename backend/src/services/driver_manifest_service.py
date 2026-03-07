"""Driver manifest service for fetching and generating per-day driver routes/jobs."""

from datetime import date

from fastapi import HTTPException, status

from api.supabase_client import supabase, supabase_admin


def _client():
    return supabase_admin or supabase


def _get_driver_by_user_id(user_id: str) -> dict:
    response = (
        _client()
        .table("drivers")
        .select("driver_id,driver_name")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Driver profile not found for current user",
        )
    return rows[0]


def _get_route_for_day(driver_id: int, service_date: date) -> dict | None:
    response = (
        _client()
        .table("garbage_routes")
        .select("*")
        .eq("driver_id", driver_id)
        .eq("service_date", service_date.isoformat())
        .limit(1)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


def _get_jobs_by_route(route_id: int) -> list[dict]:
    response = (
        _client()
        .table("service_jobs")
        .select("*")
        .eq("route_id", route_id)
        .order("job_id")
        .execute()
    )
    return response.data or []


def _build_enriched_jobs(jobs: list[dict]) -> list[dict]:
    if not jobs:
        return []

    location_ids = list({job["location_id"] for job in jobs if job.get("location_id")})
    locations_response = (
        _client()
        .table("service_locations")
        .select("location_id,customer_id,street_address,city,state,zipcode")
        .in_("location_id", location_ids)
        .execute()
    )
    locations = {row["location_id"]: row for row in (locations_response.data or [])}

    customer_ids = list(
        {
            location["customer_id"]
            for location in locations.values()
            if location.get("customer_id")
        }
    )
    customers = {}
    if customer_ids:
        customers_response = (
            _client()
            .table("customers")
            .select("customer_id,customer_name")
            .in_("customer_id", customer_ids)
            .execute()
        )
        customers = {row["customer_id"]: row for row in (customers_response.data or [])}

    enriched = []
    for job in jobs:
        location = locations.get(job.get("location_id"), {})
        customer = customers.get(location.get("customer_id"), {})
        enriched.append(
            {
                "job_id": job.get("job_id"),
                "location_id": job.get("location_id"),
                "status": job.get("status", "PENDING"),
                "job_source": job.get("job_source", "SCHEDULED"),
                "completed_at": job.get("completed_at"),
                "address": {
                    "street_address": location.get("street_address"),
                    "city": location.get("city"),
                    "state": location.get("state"),
                    "zipcode": location.get("zipcode"),
                },
                "customer_name": customer.get("customer_name"),
            }
        )

    return enriched


def get_driver_manifest_for_date(user_id: str, service_date: date) -> dict:
    driver = _get_driver_by_user_id(user_id)
    route = _get_route_for_day(driver["driver_id"], service_date)
    if route is None:
        return {
            "service_date": service_date.isoformat(),
            "driver": driver,
            "route": None,
            "jobs": [],
            "has_jobs": False,
        }

    jobs = _get_jobs_by_route(route["route_id"])
    enriched_jobs = _build_enriched_jobs(jobs)
    return {
        "service_date": service_date.isoformat(),
        "driver": driver,
        "route": route,
        "jobs": enriched_jobs,
        "has_jobs": len(enriched_jobs) > 0,
    }


def generate_driver_route_for_date(user_id: str, service_date: date) -> dict:
    driver = _get_driver_by_user_id(user_id)
    route = _get_route_for_day(driver["driver_id"], service_date)

    if route is None:
        created = (
            _client()
            .table("garbage_routes")
            .insert(
                {
                    "driver_id": driver["driver_id"],
                    "service_date": service_date.isoformat(),
                    "status": "PENDING",
                }
            )
            .execute()
        )
        route_rows = created.data or []
        if not route_rows:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create route",
            )
        route = route_rows[0]

    existing_jobs = _get_jobs_by_route(route["route_id"])
    if existing_jobs:
        return get_driver_manifest_for_date(user_id, service_date)

    locations_response = (
        _client()
        .table("service_locations")
        .select("location_id")
        .execute()
    )
    locations = locations_response.data or []
    if not locations:
        return get_driver_manifest_for_date(user_id, service_date)

    payload = [
        {
            "location_id": location["location_id"],
            "route_id": route["route_id"],
            "job_source": "SCHEDULED",
            "status": "PENDING",
        }
        for location in locations
    ]

    _client().table("service_jobs").insert(payload).execute()
    return get_driver_manifest_for_date(user_id, service_date)
