import requests
import json
from dotenv import load_dotenv
import os

load_dotenv()
API_KEY = os.getenv("API_KEY")

if not API_KEY:
    raise ValueError("API_KEY is not set in environment variables")


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
    
    origin_coordinates = convert_address_to_coordinates(origin)
    jobs.append({"id": 1, "location": origin_coordinates})
    
    for i, destination in enumerate(destinations, start=2):
        destination_coordinates = convert_address_to_coordinates(destination)
        jobs.append({"id": i, "location": destination_coordinates})
    
    headers = {
        "Authorization": API_KEY,
        "Content-Type": "application/json"
    }
    
    data = {
        "vehicles": [{
            "id": 1,
            "profile": "driving-car",
            "start": origin_coordinates,  # Start in origin
            "end": origin_coordinates     # End in origin (optional)
        }],
        "jobs": jobs
    }
    
    response = requests.post(url, headers=headers, json=data)
    result = response.json()
    
    # Process the response to create a simplified format
    if "routes" not in result or not result["routes"]:
        raise ValueError("No routes found in the response")
    
    route = result["routes"][0]  # Assuming there's only one route
    steps = route["steps"]
    
    total_duration = route.get("duration", 0)  # Get total duration from the route
    
    # Create a simplified format
    simplified_route = {
        "total_duration": total_duration, # total durations in seconds 
        "routes": [
            {
                "steps": [
                    {"type": step["type"], "id": step.get("id")} for step in steps
                ]
            }
        ]
    }
    
    return simplified_route