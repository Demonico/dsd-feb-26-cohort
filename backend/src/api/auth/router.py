from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from typing import Literal

from .supabase_auth import upsert_profile_role, verify_supabase_token

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer(auto_error=False)

# Payload model for setting the user's role (driver or customer)
class SetRolePayload(BaseModel): # todo: rename to UpdateRolePayload
    role: Literal["driver", "customer"]

# Get current user info from the bearer token and verify it with Supabase
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

    return await verify_supabase_token(credentials.credentials) # todo: cache this result to avoid hitting Supabase on every request

# Endpoint to get the current user's info (id, email, role)
@router.get("/me")
async def me(user: dict = Depends(get_current_user)) -> dict:
    return user

# Endpoint to set the user's role (driver or customer) in the profiles table
@router.post("/role")
async def set_role(
    payload: SetRolePayload,
    user: dict = Depends(get_current_user),
) -> dict:
    profile = upsert_profile_role(user["id"], payload.role)
    return {"id": user["id"], "role": profile.get("role")}
