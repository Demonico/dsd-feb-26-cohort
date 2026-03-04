from __future__ import annotations

from collections import defaultdict
from datetime import date
from itertools import islice
from math import ceil
from typing import Any

import requests
from fastapi import HTTPException, status

from api.supabase_client import supabase, supabase_admin
from . import garbage_routes_service
from .distance_service import API_KEY, convert_address_to_coordinates


def _chunked(items: list[dict[str, Any]], size: int):
    iterator = iter(items)
    while True:
        chunk = list(islice(iterator, size))
        if not chunk:
            break
        yield chunk


def _normalize_zipcodes(zipcodes: list[str]) -> list[str]:
    normalized = []
    seen = set()
    for zipcode in zipcodes:
        value = (zipcode or "").strip()
        if not value or value in seen:
            continue
        seen.add(value)
        normalized.append(value)
    return normalized


def _normalize_day_of_service(day_of_service: str | None, service_date: date) -> str:
    if day_of_service:
        value = day_of_service.strip().upper()
        aliases = {
            "MONDAY": "MON",
            "TUESDAY": "TUE",
            "WEDNESDAY": "WED",
            "THURSDAY": "THU",
            "FRIDAY": "FRI",
            "SATURDAY": "SAT",
            "SUNDAY": "SUN",
        }
        value = aliases.get(value, value)
        if value in {"MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"}:
            return value
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="day_of_service must be one of MON,TUE,WED,THU,FRI,SAT,SUN",
        )
    return service_date.strftime("%a").upper()


def _fetch_locations_for_schedule(
    client,
    day_of_service: str,
    zipcodes: list[str],
) -> list[dict[str, Any]]:
    query = (
        client.table("service_locations")
        .select("location_id,street_address,city,state,zipcode,day_of_service")
        .eq("day_of_service", day_of_service)
    )
    if zipcodes:
        query = query.in_("zipcode", zipcodes)

    response = query.execute()
    return response.data or []


def _fetch_requests_for_date(client, service_date: date) -> list[dict[str, Any]]:
    response = (
        client.table("customer_requests")
        .select("location_id,request_type,status")
        .eq("requested_for_date", service_date.isoformat())
        .in_("status", ["PENDING", "PROCESSED"])
        .execute()
    )
    return response.data or []


def _resolve_driver_ids(client, requested_driver_ids: list[int] | None) -> list[int]:
    if requested_driver_ids:
        return requested_driver_ids

    response = (
        client.table("drivers")
        .select("driver_id")
        .order("driver_id")
        .execute()
    )
    drivers = response.data or []
    return [driver["driver_id"] for driver in drivers if driver.get("driver_id") is not None]


def _location_to_address(location: dict[str, Any]) -> str:
    return (
        f"{location.get('street_address', '')}, "
        f"{location.get('city', '')}, "
        f"{location.get('state', '')} "
        f"{location.get('zipcode', '')}"
    )


def _build_ors_assignment(
    *,
    locations: list[dict[str, Any]],
    vehicle_count: int,
    max_stops_per_route: int,
    depot_address: str | None,
) -> list[list[dict[str, Any]]]:
    if not locations:
        return []

    geo_cache: dict[str, list[float]] = {}

    def geocode(address: str) -> list[float]:
        if address in geo_cache:
            return geo_cache[address]
        coords = convert_address_to_coordinates(address)
        geo_cache[address] = coords
        return coords

    jobs = []
    job_id_to_location: dict[int, dict[str, Any]] = {}
    for idx, location in enumerate(locations, start=1):
        coords = geocode(_location_to_address(location))
        jobs.append({"id": idx, "location": coords, "amount": [1]})
        job_id_to_location[idx] = location

    vehicle_count = max(1, min(vehicle_count, len(locations)))
    vehicles = []
    depot_coords = geocode(depot_address) if depot_address else None
    for vehicle_id in range(1, vehicle_count + 1):
        vehicle: dict[str, Any] = {
            "id": vehicle_id,
            "profile": "driving-car",
            "capacity": [max_stops_per_route],
        }
        if depot_coords:
            vehicle["start"] = depot_coords
            vehicle["end"] = depot_coords
        vehicles.append(vehicle)

    try:
        response = requests.post(
            "https://api.openrouteservice.org/optimization",
            headers={"Authorization": API_KEY, "Content-Type": "application/json"},
            json={"jobs": jobs, "vehicles": vehicles},
            timeout=45,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"ORS optimization request failed: {exc}",
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"ORS optimization failed: {response.status_code} - {response.text}",
        )

    result = response.json()
    if result.get("unassigned"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ORS returned unassigned stops. Increase vehicles or max_stops_per_route.",
        )

    routes = result.get("routes") or []
    if not routes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ORS returned no routes",
        )

    stops_by_vehicle: dict[int, list[dict[str, Any]]] = defaultdict(list)
    for route in routes:
        vehicle_id = route.get("vehicle")
        if vehicle_id is None:
            continue
        for step in route.get("steps", []):
            step_type = step.get("type")
            if step_type not in ("job", 1):
                continue
            job_id = step.get("job", step.get("id"))
            if not isinstance(job_id, int):
                continue
            location = job_id_to_location.get(job_id)
            if location:
                stops_by_vehicle[vehicle_id].append(location)

    ordered_vehicle_ids = sorted(stops_by_vehicle.keys())
    return [stops_by_vehicle[vehicle_id] for vehicle_id in ordered_vehicle_ids]


def _fallback_zipcode_grouping(
    locations: list[dict[str, Any]], max_stops_per_route: int
) -> list[list[dict[str, Any]]]:
    grouped_by_zipcode: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for location in locations:
        zipcode = (location.get("zipcode") or "").strip() or "UNKNOWN"
        grouped_by_zipcode[zipcode].append(location)

    grouped_routes: list[list[dict[str, Any]]] = []
    for zipcode in sorted(grouped_by_zipcode.keys()):
        grouped_by_zipcode[zipcode].sort(key=lambda loc: loc.get("location_id", 0))
        for chunk in _chunked(grouped_by_zipcode[zipcode], max_stops_per_route):
            grouped_routes.append(chunk)
    return grouped_routes


def _persist_service_jobs(client, route_id: int, stops: list[dict[str, Any]]) -> None:
    payload = []
    for sequence_order, stop in enumerate(stops, start=1):
        payload.append(
            {
                "location_id": stop.get("location_id"),
                "route_id": route_id,
                "sequence_order": sequence_order,
                "job_source": stop.get("job_source"),
                "status": "PENDING",
            }
        )

    if not payload:
        return

    response = client.table("service_jobs").insert(payload).execute()
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to persist service jobs",
        )


def _clear_existing_plan_for_date(client, service_date: date) -> dict[str, int]:
    existing_routes_response = (
        client.table("garbage_routes")
        .select("route_id")
        .eq("service_date", service_date.isoformat())
        .execute()
    )
    existing_routes = existing_routes_response.data or []
    route_ids = [row["route_id"] for row in existing_routes if row.get("route_id") is not None]

    deleted_jobs = 0
    deleted_routes = 0

    if route_ids:
        deleted_jobs_response = (
            client.table("service_jobs")
            .delete()
            .in_("route_id", route_ids)
            .execute()
        )
        deleted_jobs = len(deleted_jobs_response.data or [])

        deleted_routes_response = (
            client.table("garbage_routes")
            .delete()
            .in_("route_id", route_ids)
            .execute()
        )
        deleted_routes = len(deleted_routes_response.data or [])

    return {"deleted_jobs": deleted_jobs, "deleted_routes": deleted_routes}


def plan_daily_routes(
    *,
    service_date: date,
    day_of_service: str | None,
    zipcodes: list[str] | None,
    max_stops_per_route: int,
    persist_routes: bool,
    driver_ids: list[int] | None,
    use_ors_optimization: bool,
    vehicle_count: int | None,
    depot_street_address: str | None,
    depot_city: str | None,
    depot_state: str | None,
    depot_zipcode: str | None,
    replace_existing_plan: bool,
) -> dict[str, Any]:
    if max_stops_per_route <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="max_stops_per_route must be greater than 0",
        )

    normalized_zipcodes = _normalize_zipcodes(zipcodes or [])
    normalized_day_of_service = _normalize_day_of_service(day_of_service, service_date)

    client = supabase_admin or supabase

    try:
        base_locations = _fetch_locations_for_schedule(
            client,
            normalized_day_of_service,
            normalized_zipcodes,
        )
        requests = _fetch_requests_for_date(client, service_date)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to gather planning data: {exc}",
        )

    by_location_id = {loc["location_id"]: loc for loc in base_locations if loc.get("location_id") is not None}

    extra_location_ids = set()
    skip_location_ids = set()
    for request in requests:
        location_id = request.get("location_id")
        request_type = request.get("request_type")
        if location_id is None:
            continue
        if request_type == "EXTRA":
            extra_location_ids.add(location_id)
        elif request_type == "SKIP":
            skip_location_ids.add(location_id)

    missing_extra_ids = [location_id for location_id in extra_location_ids if location_id not in by_location_id]
    if missing_extra_ids:
        extra_locations_response = (
            client.table("service_locations")
            .select("location_id,street_address,city,state,zipcode,day_of_service")
            .in_("location_id", missing_extra_ids)
            .execute()
        )
        for location in extra_locations_response.data or []:
            location_id = location.get("location_id")
            if location_id is not None:
                by_location_id[location_id] = location

    planned_locations: list[dict[str, Any]] = []
    for location_id, location in by_location_id.items():
        if location_id in skip_location_ids:
            continue
        location["job_source"] = "EXTRA_REQUEST" if location_id in extra_location_ids else "SCHEDULED"
        planned_locations.append(location)

    if not planned_locations:
        return {
            "service_date": service_date.isoformat(),
            "day_of_service": normalized_day_of_service,
            "zipcodes": normalized_zipcodes,
            "persisted": False,
            "optimization_strategy": "none",
            "optimization_fallback_reason": None,
            "planned_route_count": 0,
            "planned_routes": [],
        }

    active_driver_ids: list[int] = []
    if persist_routes:
        active_driver_ids = _resolve_driver_ids(client, driver_ids)
        if not active_driver_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No driver IDs available to persist routes",
            )

    replaced_counts = {"deleted_jobs": 0, "deleted_routes": 0}
    if persist_routes and replace_existing_plan:
        try:
            replaced_counts = _clear_existing_plan_for_date(client, service_date)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to clear existing plan for date: {exc}",
            )

    if vehicle_count is not None and vehicle_count <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="vehicle_count must be greater than 0",
        )

    target_vehicle_count = vehicle_count
    if target_vehicle_count is None:
        if persist_routes:
            target_vehicle_count = len(active_driver_ids)
        else:
            target_vehicle_count = max(1, ceil(len(planned_locations) / max_stops_per_route))

    depot_address = None
    if depot_street_address and depot_city and depot_state and depot_zipcode:
        depot_address = f"{depot_street_address}, {depot_city}, {depot_state} {depot_zipcode}"

    grouped_routes: list[list[dict[str, Any]]]
    optimization_strategy = "zipcode_fallback"
    optimization_fallback_reason = None
    if use_ors_optimization:
        try:
            grouped_routes = _build_ors_assignment(
                locations=planned_locations,
                vehicle_count=target_vehicle_count,
                max_stops_per_route=max_stops_per_route,
                depot_address=depot_address,
            )
            optimization_strategy = "ors_multi_vehicle"
        except HTTPException as exc:
            optimization_fallback_reason = str(exc.detail)
            grouped_routes = _fallback_zipcode_grouping(planned_locations, max_stops_per_route)
            optimization_strategy = "ors_failed_zipcode_fallback"
        except Exception as exc:
            optimization_fallback_reason = str(exc)
            grouped_routes = _fallback_zipcode_grouping(planned_locations, max_stops_per_route)
            optimization_strategy = "ors_failed_zipcode_fallback"
    else:
        grouped_routes = _fallback_zipcode_grouping(planned_locations, max_stops_per_route)

    planned_routes: list[dict[str, Any]] = []
    for idx, stops in enumerate(grouped_routes):
        route_id = None
        assigned_driver_id = None

        if persist_routes:
            assigned_driver_id = active_driver_ids[idx % len(active_driver_ids)]
            route_payload: dict[str, Any] = {
                "driver_id": assigned_driver_id,
                "service_date": service_date.isoformat(),
                "status": "PENDING",
            }
            if depot_street_address:
                route_payload["start_street_address"] = depot_street_address
            if depot_city:
                route_payload["start_city"] = depot_city
            if depot_state:
                route_payload["start_state"] = depot_state
            if depot_zipcode:
                route_payload["start_zipcode"] = depot_zipcode

            try:
                created_route = garbage_routes_service.create_garbage_route(route_payload)
                route_id = created_route.get("route_id")
                if route_id is None:
                    raise HTTPException(
                        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                        detail="Persisted route missing route_id",
                    )
                _persist_service_jobs(client, route_id, stops)
            except HTTPException:
                raise
            except Exception as exc:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to persist route or service jobs: {exc}",
                )

        planned_stops = []
        for sequence_order, stop in enumerate(stops, start=1):
            planned_stops.append(
                {
                    "sequence_order": sequence_order,
                    "location_id": stop.get("location_id"),
                    "zipcode": stop.get("zipcode"),
                    "street_address": stop.get("street_address"),
                    "city": stop.get("city"),
                    "state": stop.get("state"),
                    "job_source": stop.get("job_source"),
                }
            )

        planned_routes.append(
            {
                "proposed_route_number": idx + 1,
                "route_id": route_id,
                "driver_id": assigned_driver_id,
                "stop_count": len(planned_stops),
                "stops": planned_stops,
            }
        )

    return {
        "service_date": service_date.isoformat(),
        "day_of_service": normalized_day_of_service,
        "zipcodes": normalized_zipcodes,
        "persisted": persist_routes,
        "optimization_strategy": optimization_strategy,
        "optimization_fallback_reason": optimization_fallback_reason,
        "vehicle_count": target_vehicle_count,
        "max_stops_per_route": max_stops_per_route,
        "regular_location_count": len(base_locations),
        "extra_request_count": len(extra_location_ids),
        "skip_request_count": len(skip_location_ids),
        "replace_existing_plan": replace_existing_plan,
        "replaced_existing_counts": replaced_counts,
        "planned_location_count": len(planned_locations),
        "planned_route_count": len(planned_routes),
        "planned_routes": planned_routes,
    }
