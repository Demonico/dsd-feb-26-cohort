from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from api.auth.router import get_current_user
from api.supabase_client import supabase_admin

router = APIRouter(prefix="/drivers", tags=["drivers"])


class DriverUpsert(BaseModel):
    driver_name: str


def _require_supabase_admin():
    if supabase_admin is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SUPABASE_SERVICE_ROLE_KEY not configured on backend",
        )


async def _require_driver_role(user_id: str) -> None:
    _require_supabase_admin()
    res = (
        supabase_admin.table("profiles")
        .select("role")
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    role = (res.data or {}).get("role")
    if role != "driver":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Driver role required",
        )


@router.get("/me")
async def get_my_driver(user: dict = Depends(get_current_user)):
    _require_supabase_admin()
    user_id = user["id"]

    await _require_driver_role(user_id)

    res = (
        supabase_admin.table("drivers")
        .select("*")
        .eq("user_id", user_id)
        .single()
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Driver record not found")
    return res.data


@router.post("/me")
async def upsert_my_driver(payload: DriverUpsert, user: dict = Depends(get_current_user)):
    _require_supabase_admin()
    user_id = user["id"]

    await _require_driver_role(user_id)

    res = (
        supabase_admin.table("drivers")
        .upsert({"user_id": user_id, "driver_name": payload.driver_name}, on_conflict="user_id")
        .execute()
    )
    return {"ok": True, "driver": res.data}