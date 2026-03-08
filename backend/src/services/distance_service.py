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
        .eq("request_type", "EXTRA")
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


def optimize_route_from_requests(origin: str, requested_for_date: str) -> dict:
    """Build an optimized route for the driver using EXTRA requests for the given date."""
    extra_requests = get_addresses_from_requests(requested_for_date)

    if not extra_requests:
        return {
            "message": f"No EXTRA requests found for {requested_for_date}.",
            "routes": [],
        }

    addresses = [r["billing_address"] for r in extra_requests]
    return optimize_distance(origin=origin, destinations=addresses)