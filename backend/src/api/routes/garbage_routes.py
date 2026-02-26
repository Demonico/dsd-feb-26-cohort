from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Literal, Optional
from datetime import date
from src.services import garbage_routes_service

router = APIRouter(
    prefix="/garbage_routes",
    tags=["garbage_routes"]
)


class GarbageRouteBase(BaseModel):
    driver_id: Optional[int] = None
    service_date: Optional[date] = None
    status: Literal["PENDING", "COMPLETED", "FAILED", "SKIPPED"] | None = None
    start_street_address: Optional[str] = None
    start_city: Optional[str] = None
    start_state: Optional[str] = None
    start_zipcode: Optional[str] = None

class GarbageRouteCreate(GarbageRouteBase):
    pass

class GarbageRouteUpdate(GarbageRouteBase):
    pass

class GarbageRouteResponse(GarbageRouteBase):
    route_id: int


@router.get("/", response_model=List[GarbageRouteResponse])
def read_garbage_routes():
    return garbage_routes_service.get_all_garbage_routes()


@router.get("/{route_id}", response_model=GarbageRouteResponse)
def read_garbage_route(route_id: int):
    garbage_route = garbage_routes_service.get_garbage_route(route_id)
    if garbage_route is None:
        raise HTTPException(status_code=404, detail="Route not found")
    return garbage_route


@router.post("/", response_model=GarbageRouteResponse)
def create_garbage_route(route: GarbageRouteCreate):
    return garbage_routes_service.create_garbage_route(route.model_dump())


@router.put("/{route_id}", response_model=GarbageRouteResponse)
def update_garbage_route(route_id: int, route: GarbageRouteUpdate):
    updated = garbage_routes_service.update_garbage_route(
        route_id, route.model_dump(exclude_unset=True)
    )
    if updated is None:
        raise HTTPException(status_code=404, detail="Route not found")
    return updated


@router.delete("/{route_id}")
def delete_garbage_route(route_id: int):
    deleted = garbage_routes_service.delete_garbage_route(route_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Route not found")
    return {"message": "Route deleted successfully"}