from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from src.services.distance_service import calculate_distance

route = APIRouter(
    prefix="/distance",
    tags=["distance"]
)

class AddressInputModel(BaseModel):
    destination: str
    
@route.post("/addresses")
async def get_distance_between_addresses(origin: str, destinations: list[AddressInputModel]):
    parsed_destinations = []
    
    for destination in destinations:
        address_parts = [addr.strip() for addr in destination.destination.split(",")]
        if len(address_parts) % 4 != 0:
            raise HTTPException(status_code=400, detail=f"Invalid address format for destination: {destination.destination}. Expected format: 'street, city, state, zip'")
        
        for i in range(0, len(address_parts), 4):
            parsed_address = ", ".join(address_parts[i:i+4])
            parsed_destinations.append(parsed_address)
        
        
    return calculate_distance(origin, destinations)
