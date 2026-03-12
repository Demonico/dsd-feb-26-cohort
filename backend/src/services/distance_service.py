import requests
import json
from dotenv import load_dotenv
import os

load_dotenv()
API_KEY = os.getenv("API_KEY")

REQUEST_TYPES = ["SKIP", "EXTRA"]

if not API_KEY:
    raise ValueError("API_KEY is not set in environment variables")


def haversine_meters(coord1, coord2) -> float:
    """Calculate straight-line distance in meters between two [lon, lat] coords."""
    import math
    lon1, lat1 = coord1
    lon2, lat2 = coord2
    R = 6_371_000  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def convert_address_to_coordinates(address):
    url = "https://api.openrouteservice.org/geocode/search"
    params = {
        "api_key": API_KEY,
        "text": address
    }
    res = requests.get(url, params=params)
    
    # Check if the response is successful
    if res.status_code != 200:
        raise ValueError(f"Error from OpenRouteService API: {res.status_code} - {res.text}")
    
    data = res.json()
    
    # Check if 'features' key exists and is not empty
    if "features" not in data or not data["features"]:
        raise ValueError(f"No results found for address: {address}")
    
    coords = data["features"][0]["geometry"]["coordinates"]
    return coords 

def optimize_distance(origin, destinations):    
    url = "https://api.openrouteservice.org/optimization"

    jobs = []
    id_to_address = {}  # map job id -> address for readable output
    
    origin_coordinates = convert_address_to_coordinates(origin)
    
    for i, destination in enumerate(destinations, start=1):
        destination_coordinates = convert_address_to_coordinates(destination)
        jobs.append({"id": i, "location": destination_coordinates})
        id_to_address[i] = destination
    
    headers = {
        "Authorization": API_KEY,
        "Content-Type": "application/json"
    }
    
    data = {
        "vehicles": [{
            "id": 1,
            "profile": "driving-car",
            "start": origin_coordinates,
            "end": origin_coordinates
        }],
        "jobs": jobs
    }
    
    response = requests.post(url, headers=headers, json=data)
    result = response.json()
    
    if "routes" not in result or not result["routes"]:
        raise ValueError("No routes found in the response")
    
    route = result["routes"][0]
    steps = route["steps"]
    total_duration = route.get("duration", 0)

    # Use step coordinates to compute per-leg distance via Haversine.
    # Exclude the final "end" step so we don't count the return trip to origin.
    stops = [s for s in steps if s["type"] != "end"]
    leg_distances_map = {}  # step index -> meters from previous stop
    total_distance = 0.0
    for i in range(1, len(stops)):
        prev_loc = stops[i - 1]["location"]  # [lon, lat]
        curr_loc = stops[i]["location"]
        d = haversine_meters(prev_loc, curr_loc)
        leg_distances_map[i] = round(d, 1)
        total_distance += d

    # Build a flat index from original steps for leg distance lookup
    stop_indices = {id(s): i for i, s in enumerate(stops)}

    simplified_route = {
        "total_duration": total_duration,           # seconds
        "total_distance_meters": round(total_distance, 1),
        "total_distance_miles": round(total_distance / 1609.34, 2),
        "routes": [
            {
                "steps": [
                    {
                        "type": step["type"],
                        "id": step.get("id"),
                        "address": id_to_address.get(step.get("id"), origin if step["type"] in ("start", "end") else None),
                        "duration": step.get("duration", 0),
                        "leg_distance_meters": round(leg_distances_map.get(stop_indices[id(step)], 0), 1) if id(step) in stop_indices else 0,
                    }
                    for step in steps
                ]
            }
        ]
    }
    
    return simplified_route


def get_addresses_from_requests(requested_for_date: str) -> list[dict]:
    """Join customer_requests with customers, filter by requested_for_date
    and request_type = EXTRA, and return customer address info.
    """
    from src.api.supabase_client import supabase

    response = (
        supabase.table("customer_requests")
        .select("customer_id, request_type, requested_for_date, customers(customer_id, customer_name, billing_address)")
        .or_("request_type.eq.EXTRA,status.eq.PENDING")
        .eq("requested_for_date", requested_for_date)
        .execute()
    )

    results = []
    for row in response.data or []:
        customer = row.get("customers")
        if customer and customer.get("billing_address"):
            results.append({
                "customer_id": customer.get("customer_id"),
                "customer_name": customer.get("customer_name"),
                "billing_address": customer["billing_address"],
                "request_type": row.get("request_type"),
            })

    return results


DRIVER_ORIGIN = "7740 Ellington Drive, Dallas, TX 75241"


def get_addresses_from_service_jobs(requested_for_date: str) -> tuple[list[str], list[int]]:
    """Return (addresses, location_ids) for all PENDING service jobs on requested_for_date."""
    from src.api.supabase_client import supabase

    routes_response = (
        supabase.table("garbage_routes")
        .select("route_id")
        .eq("service_date", requested_for_date)
        .execute()
    )
    route_ids = [r["route_id"] for r in (routes_response.data or [])]
    if not route_ids:
        return [], []

    jobs_response = (
        supabase.table("service_jobs")
        .select("location_id, sequence_order")
        .in_("route_id", route_ids)
        .eq("status", "PENDING")
        .order("sequence_order")
        .execute()
    )
    jobs = jobs_response.data or []
    ordered_location_ids = [j["location_id"] for j in jobs if j.get("location_id")]
    if not ordered_location_ids:
        return [], []

    locations_response = (
        supabase.table("service_locations")
        .select("location_id, street_address, city, state, zipcode")
        .in_("location_id", ordered_location_ids)
        .execute()
    )
    locations_by_id = {row["location_id"]: row for row in (locations_response.data or [])}

    addresses = []
    result_location_ids = []
    for job in jobs:
        loc = locations_by_id.get(job["location_id"])
        if not loc:
            continue
        street = (loc.get("street_address") or "").strip()
        city = (loc.get("city") or "").strip()
        state = (loc.get("state") or "").strip()
        zipcode = (loc.get("zipcode") or "").strip()
        if street and city:
            addresses.append(f"{street}, {city}, {state} {zipcode}".strip())
            result_location_ids.append(job["location_id"])

    return addresses, result_location_ids


def optimize_route_from_requests(requested_for_date: str) -> dict:
    addresses, location_ids = get_addresses_from_service_jobs(requested_for_date)

    if not addresses:
        return {
            "message": f"No service jobs found for {requested_for_date}.",
            "routes": [],
        }

    result = optimize_distance(origin=DRIVER_ORIGIN, destinations=addresses)

    # Inject location_id into each job step so the frontend can match back to service jobs.
    id_to_location_id = {i: loc_id for i, loc_id in enumerate(location_ids, start=1)}
    for step in (result.get("routes") or [{}])[0].get("steps", []):
        if step.get("id") is not None:
            step["location_id"] = id_to_location_id.get(step["id"])

    return result