"""Driver manifest service for fetching and generating per-day driver routes/jobs."""

from datetime import date, timedelta

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
        .execute()
    )
    jobs = response.data or []
    return sorted(
        jobs,
        key=lambda row: (
            row.get("sequence_order") is None,
            row.get("sequence_order") if row.get("sequence_order") is not None else 10**9,
            row.get("job_id") if row.get("job_id") is not None else 10**9,
        ),
    )


def _is_actionable_request(status_value: str | None) -> bool:
    # Customer request rows should influence route composition unless they failed.
    # This allows SKIP/EXTRA rows with statuses like SKIPPED/COMPLETED to still apply.
    if status_value is None:
        return True
    return status_value.upper() != "FAILED"


def _get_requests_for_day(service_date: date) -> list[dict]:
    start = service_date.isoformat()
    end = (service_date + timedelta(days=1)).isoformat()
    response = (
        _client()
        .table("customer_requests")
        .select("request_id,location_id,request_type,status,created_at")
        .gte("requested_for_date", start)
        .lt("requested_for_date", end)
        .execute()
    )
    return response.data or []


def _resolve_location_overrides(service_date: date) -> dict[int, str]:
    requests = _get_requests_for_day(service_date)
    latest_by_location: dict[int, dict] = {}
    for request in requests:
        location_id = request.get("location_id")
        request_type = (request.get("request_type") or "").upper()
        if not location_id or request_type not in {"SKIP", "EXTRA"}:
            continue
        if not _is_actionable_request(request.get("status")):
            continue

        existing = latest_by_location.get(location_id)
        request_created_at = request.get("created_at") or ""
        existing_created_at = (existing or {}).get("created_at") or ""
        request_id = request.get("request_id") or 0
        existing_id = (existing or {}).get("request_id") or 0
        if (
            existing is None
            or request_created_at > existing_created_at
            or (request_created_at == existing_created_at and request_id > existing_id)
        ):
            latest_by_location[location_id] = request

    return {
        location_id: (payload.get("request_type") or "").upper()
        for location_id, payload in latest_by_location.items()
    }


def _locations_for_route(service_date: date) -> tuple[list[dict], dict[int, str]]:
    all_locations_response = (
        _client()
        .table("service_locations")
        .select("location_id,street_address,city,state,zipcode")
        .order("location_id")
        .execute()
    )
    all_locations = all_locations_response.data or []
    if not all_locations:
        return [], {}

    overrides = _resolve_location_overrides(service_date)
    locations_by_id = {location["location_id"]: location for location in all_locations}
    selected = [
        location
        for location in all_locations
        if overrides.get(location["location_id"]) != "SKIP"
    ]

    # Include EXTRA-request locations if they are outside the default list.
    extra_ids = [
        location_id
        for location_id, request_type in overrides.items()
        if request_type == "EXTRA" and location_id not in locations_by_id
    ]
    if extra_ids:
        extra_response = (
            _client()
            .table("service_locations")
            .select("location_id,street_address,city,state,zipcode")
            .in_("location_id", extra_ids)
            .execute()
        )
        selected.extend(extra_response.data or [])

    job_sources = {
        location["location_id"]: (
            "EXTRA_REQUEST" if overrides.get(location["location_id"]) == "EXTRA" else "SCHEDULED"
        )
        for location in selected
    }
    return selected, job_sources


def _request_counts_for_day(service_date: date) -> tuple[int, int]:
    overrides = _resolve_location_overrides(service_date)
    skip_count = sum(1 for request_type in overrides.values() if request_type == "SKIP")
    extra_count = sum(1 for request_type in overrides.values() if request_type == "EXTRA")
    return skip_count, extra_count


def _format_address(location: dict) -> str | None:
    street = (location.get("street_address") or "").strip()
    city = (location.get("city") or "").strip()
    state = (location.get("state") or "").strip()
    zipcode = (location.get("zipcode") or "").strip()
    if not street or not city:
        return None
    return f"{street}, {city}, {state} {zipcode}".strip()


def _route_origin_address(route: dict, locations: list[dict]) -> str | None:
    start_street = (route.get("start_street_address") or "").strip()
    start_city = (route.get("start_city") or "").strip()
    start_state = (route.get("start_state") or "").strip()
    start_zipcode = (route.get("start_zipcode") or "").strip()

    if start_street and start_city:
        return f"{start_street}, {start_city}, {start_state} {start_zipcode}".strip()

    for location in locations:
        address = _format_address(location)
        if address:
            return address
    return None


def _optimized_location_order(route: dict, locations: list[dict]) -> list[int]:
    default_order = [location["location_id"] for location in locations]
    if len(default_order) < 2:
        return default_order

    origin = _route_origin_address(route, locations)
    if not origin:
        return default_order

    destinations: list[str] = []
    location_ids: list[int] = []
    for location in locations:
        address = _format_address(location)
        if not address:
            return default_order
        destinations.append(address)
        location_ids.append(location["location_id"])

    try:
        # Lazy import so app startup is not coupled to API_KEY availability.
        from src.services.distance_service import optimize_distance

        optimized = optimize_distance(origin=origin, destinations=destinations)
    except Exception:
        return default_order

    steps = (((optimized.get("routes") or [{}])[0]).get("steps") or [])
    # distance_service currently assigns destination ids from 2..N.
    job_id_to_location_id = {index + 2: loc_id for index, loc_id in enumerate(location_ids)}

    ordered: list[int] = []
    for step in steps:
        job_id = step.get("id")
        location_id = job_id_to_location_id.get(job_id)
        if location_id and location_id not in ordered:
            ordered.append(location_id)

    for location_id in default_order:
        if location_id not in ordered:
            ordered.append(location_id)
    return ordered


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
                "sequence_order": job.get("sequence_order"),
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


def _sync_jobs_for_route(
    route_id: int,
    existing_jobs: list[dict],
    ordered_location_ids: list[int],
    job_sources: dict[int, str],
) -> None:
    desired_sequence = {
        location_id: index for index, location_id in enumerate(ordered_location_ids, start=1)
    }
    desired_locations = set(ordered_location_ids)

    location_to_existing: dict[int, dict] = {}
    for job in existing_jobs:
        location_id = job.get("location_id")
        if not location_id:
            continue
        if location_id not in location_to_existing:
            location_to_existing[location_id] = job

    # Remove pending jobs no longer in route after SKIP/EXTRA resolution.
    for job in existing_jobs:
        location_id = job.get("location_id")
        if not location_id or location_id in desired_locations:
            continue
        if job.get("status") == "PENDING":
            _client().table("service_jobs").delete().eq("job_id", job["job_id"]).execute()

    # Update existing pending jobs with latest sequence/source.
    for location_id, job in location_to_existing.items():
        if location_id not in desired_locations:
            continue
        if job.get("status") != "PENDING":
            continue
        _client().table("service_jobs").update(
            {
                "sequence_order": desired_sequence[location_id],
                "job_source": job_sources.get(location_id, "SCHEDULED"),
            }
        ).eq("job_id", job["job_id"]).execute()

    # Add any missing desired jobs.
    missing_location_ids = [
        location_id
        for location_id in ordered_location_ids
        if location_id not in location_to_existing
    ]
    if missing_location_ids:
        payload = [
            {
                "location_id": location_id,
                "route_id": route_id,
                "sequence_order": desired_sequence[location_id],
                "job_source": job_sources.get(location_id, "SCHEDULED"),
                "status": "PENDING",
            }
            for location_id in missing_location_ids
        ]
        _client().table("service_jobs").insert(payload).execute()


def get_driver_manifest_for_date(user_id: str, service_date: date) -> dict:
    driver = _get_driver_by_user_id(user_id)
    skip_count, extra_count = _request_counts_for_day(service_date)
    route = _get_route_for_day(driver["driver_id"], service_date)
    if route is None:
        return {
            "service_date": service_date.isoformat(),
            "driver": driver,
            "route": None,
            "jobs": [],
            "has_jobs": False,
            "skip_count": skip_count,
            "extra_count": extra_count,
        }

    jobs = _get_jobs_by_route(route["route_id"])
    enriched_jobs = _build_enriched_jobs(jobs)
    return {
        "service_date": service_date.isoformat(),
        "driver": driver,
        "route": route,
        "jobs": enriched_jobs,
        "has_jobs": len(enriched_jobs) > 0,
        "skip_count": skip_count,
        "extra_count": extra_count,
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
    locations, job_sources = _locations_for_route(service_date)
    if not locations:
        return get_driver_manifest_for_date(user_id, service_date)

    ordered_location_ids = _optimized_location_order(route, locations)
    if existing_jobs:
        _sync_jobs_for_route(
            route_id=route["route_id"],
            existing_jobs=existing_jobs,
            ordered_location_ids=ordered_location_ids,
            job_sources=job_sources,
        )
        return get_driver_manifest_for_date(user_id, service_date)

    payload = [
        {
            "location_id": location_id,
            "route_id": route["route_id"],
            "sequence_order": index,
            "job_source": job_sources.get(location_id, "SCHEDULED"),
            "status": "PENDING",
        }
        for index, location_id in enumerate(ordered_location_ids, start=1)
    ]

    _client().table("service_jobs").insert(payload).execute()
    return get_driver_manifest_for_date(user_id, service_date)
