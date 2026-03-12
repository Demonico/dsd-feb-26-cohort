"""Driver manifest endpoint for daily job lookup."""

from datetime import date

from fastapi import APIRouter, Depends

from ..auth.dependencies import require_role
from src.services.driver_manifest_service import (
    get_driver_manifest_for_date,
    generate_driver_route_for_date,
    get_jobs_for_date,
)

router = APIRouter(prefix="/driver/manifest", tags=["driver-manifest"])


@router.get("/")
def read_driver_manifest(
    service_date: date,
    user: dict = Depends(require_role("driver")),
):
    return get_driver_manifest_for_date(user_id=user["id"], service_date=service_date)


@router.post("/generate")
def generate_driver_manifest(
    service_date: date,
    user: dict = Depends(require_role("driver")),
):
    """
    Pull all service locations from the DB, optimize order using the map API,
    persist sequence_order on service_jobs, and return the manifest.
    """
    return generate_driver_route_for_date(user_id=user["id"], service_date=service_date)


@router.get("/jobs")
def list_manifest_jobs(
    service_date: date,
    user: dict = Depends(require_role("driver")),
):
    """Return jobs with customer data sorted by sequence_order, no route optimization."""
    return get_jobs_for_date(user_id=user["id"], service_date=service_date)
