from fastapi import APIRouter, Depends

from ..auth.dependencies import require_role
from src.services.driver_service import list_drivers as list_drivers_service

router = APIRouter()


@router.get("/drivers")
async def list_drivers(_user: dict = Depends(require_role("driver"))):
    return {"drivers": list_drivers_service()}
