from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .supabase_auth import verify_supabase_token

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
        )

    return await verify_supabase_token(credentials.credentials)


@router.get("/verify")
async def verify_authentication(user: dict = Depends(get_current_user)) -> dict:
    return {"authenticated": True, "user": user}


@router.get("/me")
async def me(user: dict = Depends(get_current_user)) -> dict:
    return user
