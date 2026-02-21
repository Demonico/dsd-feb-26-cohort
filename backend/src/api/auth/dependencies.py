from fastapi import Depends, HTTPException, status
from .router import get_current_user


def require_role(required_role: str):
    async def role_check(user: dict = Depends(get_current_user)) -> dict:
        user_roles = user.get("roles", [])

        if required_role not in user_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Required role '{required_role}' not found. User has roles: {user_roles}",
            )

        return user

    return role_check

