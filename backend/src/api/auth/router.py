from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from typing import Literal

from .supabase_auth import upsert_user_role, verify_supabase_token

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer(auto_error=False)

class UpdateRolePayload(BaseModel):
    role: Literal["driver", "customer"]

async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict:
    if (
        credentials is None
        or credentials.scheme.lower() != "bearer"
        or not credentials.credentials.strip()
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
        )

    return await verify_supabase_token(credentials.credentials)

@router.get("/me")
async def me(user: dict = Depends(get_current_user)) -> dict:
    return user

@router.post("/role")
async def set_role(
    payload: UpdateRolePayload,
    user: dict = Depends(get_current_user),
) -> dict:
    user_row = upsert_user_role(user["id"], payload.role)
    return {"id": user["id"], "role": user_row.get("role")}
