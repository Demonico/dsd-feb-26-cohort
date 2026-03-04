from datetime import date

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..auth.dependencies import require_role
from src.services.planning_service import plan_daily_routes

router = APIRouter(prefix="/planning", tags=["planning"])


class DailyPlanningPayload(BaseModel):
    service_date: date
    day_of_service: str | None = None
    zipcodes: list[str] | None = None
    max_stops_per_route: int = 30
    persist_routes: bool = False
    driver_ids: list[int] | None = None
    use_ors_optimization: bool = True
    vehicle_count: int | None = None
    depot_street_address: str | None = None
    depot_city: str | None = None
    depot_state: str | None = None
    depot_zipcode: str | None = None
    replace_existing_plan: bool = False


@router.post("/daily")
def build_daily_plan(
    payload: DailyPlanningPayload,
    _user: dict = Depends(require_role("driver")),
):
    return plan_daily_routes(
        service_date=payload.service_date,
        day_of_service=payload.day_of_service,
        zipcodes=payload.zipcodes,
        max_stops_per_route=payload.max_stops_per_route,
        persist_routes=payload.persist_routes,
        driver_ids=payload.driver_ids,
        use_ors_optimization=payload.use_ors_optimization,
        vehicle_count=payload.vehicle_count,
        depot_street_address=payload.depot_street_address,
        depot_city=payload.depot_city,
        depot_state=payload.depot_state,
        depot_zipcode=payload.depot_zipcode,
        replace_existing_plan=payload.replace_existing_plan,
    )
