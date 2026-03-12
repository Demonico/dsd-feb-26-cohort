from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from src.services.distance_service import optimize_distance, optimize_route_from_requests, DRIVER_ORIGIN

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


class OptimizeRequestsInput(BaseModel):
    requested_for_date: str  # YYYY-MM-DD


@route.post("/optimize-requests")
async def optimize_route_for_driver(body: OptimizeRequestsInput):
    """
    Fetch pending EXTRA requests for the given date and return an optimized driving route.
    SKIP requests are excluded from the route calculation.
    """
    try:
        return optimize_route_from_requests(requested_for_date=body.requested_for_date)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@route.get("/origin")
async def get_driver_origin():
    return {"origin": DRIVER_ORIGIN}
