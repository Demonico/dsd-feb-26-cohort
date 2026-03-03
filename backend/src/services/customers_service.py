from api.supabase_client import supabase


TABLE = "customers"


def get_all_customers():
    response = supabase.table(TABLE).select("*").execute()
    return response.data


def get_customer(customer_id: int):
    response = (
        supabase.table(TABLE)
        .select("*")
        .eq("customer_id", customer_id)
        .single()
        .execute()
    )
    return response.data


def create_customer(data: dict):
    response = supabase.table(TABLE).insert(data).execute()
    return response.data


def update_customer(customer_id: int, data: dict):
    response = (
        supabase.table(TABLE)
        .update(data)
        .eq("customer_id", customer_id)
        .execute()
    )
    return response.data


def delete_customer(customer_id: int):
    response = (
        supabase.table(TABLE)
        .delete()
        .eq("customer_id", customer_id)
        .execute()
    )
    return response.data