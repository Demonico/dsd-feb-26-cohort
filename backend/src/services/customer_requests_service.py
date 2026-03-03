from api.supabase_client import supabase
from datetime import datetime

TABLE = "customer_requests"


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


def create_request(data: dict):
    if "created_at" not in data or data["created_at"] is None:
        data["created_at"] = datetime.now().isoformat()

    response = supabase.table(TABLE).insert(data).execute()
    return response.data[0]


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
