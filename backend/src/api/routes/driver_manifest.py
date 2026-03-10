"""Driver manifest endpoint for daily job lookup."""

from datetime import date

from fastapi import APIRouter, Depends

from ..auth.dependencies import require_role
from src.services.driver_manifest_service import (
    get_driver_manifest_for_date,
)

router = APIRouter(prefix="/driver/manifest", tags=["driver-manifest"])


@router.get("/")
def read_driver_manifest(
    service_date: date,
    user: dict = Depends(require_role("driver")),
):
    return get_driver_manifest_for_date(user_id=user["id"], service_date=service_date)
