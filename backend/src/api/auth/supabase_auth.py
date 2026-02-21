from fastapi import HTTPException, status
from ..supabase_client import supabase, supabase_admin
from typing import Optional


def _get_role_from_profiles(user_id: str) -> Optional[str]:
    client = supabase_admin or supabase
    response = (
        client.table("profiles")
        .select("role")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )

    data = response.data or []
    if not data:
        return None

    role = data[0].get("role")
    if isinstance(role, str) and role in {"driver", "customer"}:
        return role
    return None


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
            "role": _get_role_from_profiles(response.user.id),
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
