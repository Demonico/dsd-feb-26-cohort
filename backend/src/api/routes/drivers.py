from fastapi import APIRouter, Depends

from api.auth.router import get_current_user
from services.driver_service import list_drivers as list_drivers_service

router = APIRouter(prefix="/drivers", tags=["drivers"])


@router.get("")
async def list_drivers(_user: dict = Depends(get_current_user)):
    return {"drivers": list_drivers_service()}
