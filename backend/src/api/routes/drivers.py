from fastapi import APIRouter, Depends

from ..auth.dependencies import require_role

router = APIRouter()

@router.get("/drivers")
async def list_drivers(user: dict = Depends(require_role("driver"))):
    return {"message": "List of drivers", "current_user": user["id"]}
