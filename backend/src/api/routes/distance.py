from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from src.services.distance_service import calculate_distance

route = APIRouter(
    prefix="/distance",
    tags=["distance"]
)

route.post("/addresses")
async def get_distance_between_addresses():
    
    return result 