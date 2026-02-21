from fastapi import HTTPException, status
from ..supabase_client import supabase
from typing import Optional

async def verify_supabase_token(token: str) -> dict:
    try:
        response = supabase.auth.get_user(token)
        if not response or not response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
            )

        return {
            "id": response.user.id,
            "email": response.user.email,
            "user_metadata": response.user.user_metadata,
            "roles": response.user_metadata.get("roles", []) if response.user.user_metadata else [],
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {str(e)}",
        )

async def get_user_by_email(email: str) -> Optional[dict]:
    try:
        response = supabase.auth.admin.list_users()
        for user in response.users:
            if user.email == email:
                return {
                    "id": user.id,
                    "email": user.email,
                    "email_confirmed_at": user.email_confirmed_at,
                    "created_at": user.created_at,
                }
        return None
    except Exception as e:
        print(f"Error fetching user: {str(e)}")
        return None

async def confirm_user_email(user_id: str) -> bool:
    try:
        supabase.auth.admin.update_user_by_id(
            user_id,
            {"email_confirmed": True}
        )
        return True
    except Exception as e:
        print(f"Error confirming email: {str(e)}")
        return False

async def delete_user(user_id: str) -> bool:
    try:
        supabase.auth.admin.delete_user(user_id)
        return True
    except Exception as e:
        print(f"Error deleting user: {str(e)}")
        return False
