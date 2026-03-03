from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Literal, Optional
from datetime import date
from src.services import garbage_routes_service
from ..auth.dependencies import require_role

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
    driver_id: int
    service_date: date
    status: Literal["PENDING", "COMPLETED", "FAILED", "SKIPPED"] = "PENDING"

class GarbageRouteUpdate(GarbageRouteBase):
    pass

class GarbageRouteResponse(GarbageRouteBase):
    route_id: int


@router.get("/", response_model=List[GarbageRouteResponse])
def read_garbage_routes(_user=Depends(require_role("driver"))):
    return garbage_routes_service.get_all_garbage_routes()


@router.get("/{route_id}", response_model=GarbageRouteResponse)
def read_garbage_route(route_id: int, _user=Depends(require_role("driver"))):
    if route_id <= 0:
        raise HTTPException(status_code=400, detail="Invalid route ID")
    garbage_route = garbage_routes_service.get_garbage_route(route_id)
    if garbage_route is None:
        raise HTTPException(status_code=404, detail="Route not found")
    return garbage_route


@router.post("/", response_model=GarbageRouteResponse)
def create_garbage_route(route: GarbageRouteCreate, _user=Depends(require_role("driver"))):
    try:
        return garbage_routes_service.create_garbage_route(route.model_dump())
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to create route")


@router.put("/{route_id}", response_model=GarbageRouteResponse)
def update_garbage_route(route_id: int, route: GarbageRouteUpdate, _user=Depends(require_role("driver"))):
    if route_id <= 0:
        raise HTTPException(status_code=400, detail="Invalid route ID")
    try:
        updated = garbage_routes_service.update_garbage_route(
            route_id, route.model_dump(exclude_unset=True)
        )
        if updated is None:
            raise HTTPException(status_code=404, detail="Route not found")
        return updated
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to update route")


@router.delete("/{route_id}")
def delete_garbage_route(route_id: int, _user=Depends(require_role("driver"))):
    if route_id <= 0:
        raise HTTPException(status_code=400, detail="Invalid route ID")
    try:
        deleted = garbage_routes_service.delete_garbage_route(route_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Route not found")
        return {"message": "Route deleted successfully"}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to delete route")