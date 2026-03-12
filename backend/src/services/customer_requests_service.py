from datetime import date, datetime

from fastapi import HTTPException, status

from src.api.supabase_client import supabase, supabase_admin

TABLE = "customer_requests"


def _client():
    return supabase_admin or supabase


def get_all_requests():
    response = supabase.table(TABLE).select("*").execute()
    return response.data if response.data else []

def get_all_request_type():
    response = (
        supabase.table(TABLE)
        .select("request_type, customers(customer_id, customer_name)")
        .execute()
    )
    return response.data if response.data else []

def get_request(request_id: int):
    response = (
        supabase.table(TABLE)
        .select("*")
        .eq("request_id", request_id)
        .execute()
    )
    if response.data and len(response.data) > 0:
        return response.data[0]
    return None


def _get_customer_context_for_user(user_id: str) -> tuple[int, int]:
    client = _client()

    customer_response = (
        client.table("customers")
        .select("customer_id")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    customer_rows = customer_response.data or []
    if not customer_rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer profile not found for current user",
        )

    customer_id = customer_rows[0]["customer_id"]
    location_response = (
        client.table("service_locations")
        .select("location_id")
        .eq("customer_id", customer_id)
        .order("location_id")
        .limit(1)
        .execute()
    )
    location_rows = location_response.data or []
    if not location_rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service location not found for current user",
        )

    return customer_id, location_rows[0]["location_id"]


def create_request(data: dict):
    if "created_at" not in data or data["created_at"] is None:
        data["created_at"] = datetime.now().isoformat()

    response = _client().table(TABLE).insert(data).execute()
    return response.data[0]


def _get_pending_request_for_customer_date(
    *,
    customer_id: int,
    location_id: int,
    requested_for_date: date,
):
    response = (
        _client()
        .table(TABLE)
        .select("*")
        .eq("customer_id", customer_id)
        .eq("location_id", location_id)
        .eq("requested_for_date", requested_for_date.isoformat())
        .eq("status", "PENDING")
        .order("request_id", desc=True)
        .limit(1)
        .execute()
    )
    rows = response.data or []
    return rows[0] if rows else None


def create_request_for_customer_user(
    *,
    user_id: str,
    request_type: str,
    requested_for_date: date,
) -> dict:
    customer_id, location_id = _get_customer_context_for_user(user_id)
    existing_request = _get_pending_request_for_customer_date(
        customer_id=customer_id,
        location_id=location_id,
        requested_for_date=requested_for_date,
    )
    if existing_request:
        if existing_request.get("request_type") == request_type:
            return existing_request

        updated_request = update_request(
            existing_request["request_id"],
            {
                "request_type": request_type,
                "status": "PENDING",
            },
        )
        if updated_request is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update existing customer request",
            )
        return updated_request

    return create_request(
        {
            "customer_id": customer_id,
            "location_id": location_id,
            "request_type": request_type,
            "requested_for_date": requested_for_date.isoformat(),
            "status": "PENDING",
        }
    )


def update_request(request_id: int, data: dict):
    response = (
        supabase.table(TABLE)
        .update(data)
        .eq("request_id", request_id)
        .execute()
    )
    if response.data and len(response.data) > 0:
        return response.data[0]
    return None


def delete_request(request_id: int):
    response = (
        supabase.table(TABLE)
        .delete()
        .eq("request_id", request_id)
        .execute()
    )
    return response.data
