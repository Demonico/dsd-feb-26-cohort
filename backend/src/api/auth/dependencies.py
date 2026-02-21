from fastapi import Depends, HTTPException, status
from .router import get_current_user


def require_role(required_role: str):
    async def role_check(user: dict = Depends(get_current_user)) -> dict:
        user_role = user.get("role")

        if user_role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Required role '{required_role}' not found. User role: {user_role}",
            )

        return user

    return role_check
