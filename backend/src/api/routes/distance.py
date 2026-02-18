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
async def get_distance_between_addresses(origin: str, destination: AddressInputModel):
    return calculate_distance(origin, destination.destination)