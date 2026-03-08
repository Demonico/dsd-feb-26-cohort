"""Driver manifest endpoints for daily job lookup and route generation."""

from datetime import date

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from ..auth.dependencies import require_role
from src.services.driver_manifest_service import (
    generate_driver_route_for_date,
    get_driver_manifest_for_date,
)

router = APIRouter(prefix="/driver/manifest", tags=["driver-manifest"])


class GenerateManifestPayload(BaseModel):
    service_date: date


@router.get("/")
def read_driver_manifest(
    service_date: date,
    user: dict = Depends(require_role("driver")),
):
    return get_driver_manifest_for_date(user_id=user["id"], service_date=service_date)


@router.post("/generate")
def generate_driver_manifest(
    payload: GenerateManifestPayload,
    user: dict = Depends(require_role("driver")),
):
    return generate_driver_route_for_date(user_id=user["id"], service_date=payload.service_date)
