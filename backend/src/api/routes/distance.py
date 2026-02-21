from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from src.services.distance_service import optimize_distance

route = APIRouter(
    prefix="/distance",
    tags=["distance"]
)

class DestinationInputModel(BaseModel):
    street: str
    city: str
    state: str
    zip: str
class OriginInputModel(BaseModel):
    street: str
    city: str
    state: str
    zip: str
    
@route.post("/addresses")
async def get_distance_between_addresses(origin: OriginInputModel, destinations: list[DestinationInputModel]): 
    parsed_destinations = [
        f"{destination.street}, {destination.city}, {destination.state} {destination.zip}"
        for destination in destinations
    ]   
    return optimize_distance(
        origin=f"{origin.street}, {origin.city}, {origin.state} {origin.zip}", 
        destinations=parsed_destinations
    )
