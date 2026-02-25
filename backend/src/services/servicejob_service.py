from fastapi import HTTPException, status

from api.supabase_client import supabase, supabase_admin


def list_service_jobs_by_location(location_id: str) -> list[dict]:
    client = supabase_admin or supabase

    try:
        response = (
            client.table("service_jobs")
            .select("*")
            .eq("location_id", location_id)
            .execute()
        )
    except Exception as exc:
        if exc.status == status.HTTP_401_UNAUTHORIZED:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Unauthorized: {exc}",
            )
        elif exc.status == status.HTTP_500_INTERNAL_SERVER_ERROR:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to fetch service jobs: {exc}",
            )
        else: 
            raise HTTPException(
                detail=f"Error: {exc}",
            )
    return response.data or []
