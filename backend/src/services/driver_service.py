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
        exc_status = getattr(exc, "status", None) or getattr(exc, "status_code", None)
        if exc.status == status.HTTP_401_UNAUTHORIZED:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Unauthorized: {exc}",
            )
        elif exc.status == status.HTTP_500_INTERNAL_SERVER_ERROR:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch drivers: {exc}",
            )
        else: 
            print(f"Exception message: {str(exc)}")
    return response.data or []
