from fastapi import HTTPException, status
from ..supabase_client import supabase, supabase_admin
from typing import Literal, Optional

# Helper function to fetch the user's role from the profiles table based on their user ID
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

# Verify the Supabase token and return the user's info (id, email, role) if valid, otherwise raise an HTTPException with a 401 status code
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

# Upsert the user's role in the profiles table based on their user ID
# If the profile already exists, it will update the role; if it doesn't exist, it will create a new profile with the given role
# Returns the updated or created profile data
def upsert_profile_role(user_id: str, role: Literal["driver", "customer"]) -> dict:
    client = supabase_admin or supabase
    response = (
        client.table("profiles")
        .upsert({"id": user_id, "role": role}, on_conflict="id")
        .execute()
    )

    data = response.data or []
    if not data:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upsert profile role",
        )
    return data[0]

# Admin functions to manage users in Supabase
# These functions use the admin client to list users, confirm email, and delete users
# They handle exceptions and return appropriate results or error messages
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
