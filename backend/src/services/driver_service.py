from fastapi import HTTPException, status

from api.supabase_client import supabase, supabase_admin


def list_drivers() -> list[dict]:
    client = supabase_admin or supabase

    try:
        response = (
            client.table("drivers")
            .select("driver_id,driver_name")
            .order("driver_name")
            .execute()
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch drivers: {exc}",
        )

    return response.data or []
