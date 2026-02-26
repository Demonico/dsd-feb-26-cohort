from fastapi import HTTPException, status
from uuid import UUID
from api.supabase_client import supabase, supabase_admin


def list_service_jobs_by_location(location_id: UUID) -> list[dict]:
    client = supabase_admin or supabase

    try:
        response = (
            client.table("service_jobs")
            .select("*")
            .eq("location_id", UUID) 
            .execute()
        )
    except Exception as exc:
        exc_status = getattr(exc, "status", None) or getattr(exc, "status_code", None)
        if exc_status == status.HTTP_401_UNAUTHORIZED:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Unauthorized: {exc}",
            )
        elif exc_status == status.HTTP_500_INTERNAL_SERVER_ERROR:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch service jobs: {exc}",
            )
        else: 
            print(f"Exception message: {str(exc)}")
    return response.data or []
