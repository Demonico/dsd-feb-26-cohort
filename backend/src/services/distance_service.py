from geopy.geocoders import Nominatim
import geopy.distance
import requests

def convert_address_to_coordinates(address):
    geolocator = Nominatim(user_agent="Waste Management App")
    location = geolocator.geocode(address)
    
    return [location.latitude, location.longitude]    
    

def calculate_distance(origin, destinations):    
    coordinates = []
    
    origin_coordinates = convert_address_to_coordinates(origin)
    coordinates.append(origin_coordinates)
    
    for destination in destinations:
        destination_coordinates = convert_address_to_coordinates(destination)
        coordinates.append(destination_coordinates)
    
    print(coordinates)
    
      
    payload = {
        "locations": coordinates,
        "metrics": ["distance"],
        "units": "miles"
    }
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjMwZTA0NmI0YTUxZTQxOTFhN2Q0YTgyMjcxYzIzNjc5IiwiaCI6Im11cm11cjY0In0="
    }
    
    url = "https://api.openrouteservice.org/v2/matrix/driving-car"
    response = requests.post(url, json=payload, headers=headers)
    #return geopy.distance.geodesic(origin_coordinates, destination_coordinates).miles
