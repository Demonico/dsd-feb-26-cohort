from geopy.geocoders import Nominatim
import geopy.distance

def convert_address_to_coordinates(address):
    geolocator = Nominatim(user_agent="Waste Management App")
    location = geolocator.geocode(address)
    
    return (location.latitude, location.longitude)

def calculate_distance(origin, destination):    
    
    origin_coordinates = convert_address_to_coordinates(origin)
    destination_coordinates = convert_address_to_coordinates(destination)
    
    return geopy.distance.geodesic(origin_coordinates, destination_coordinates).miles
