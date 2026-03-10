from src.api.supabase_client import supabase

TABLE = "garbage_routes"


def get_all_garbage_routes():
    try:
        response = supabase.table(TABLE).select("*").execute()
        return response.data if response.data else []
    except Exception:
        return []


def get_garbage_route(route_id: int):
    try:
        response = (
            supabase.table(TABLE)
            .select("*")
            .eq("route_id", route_id)
            .single()
            .execute()
        )
        return response.data
    except Exception:
        return None


def create_garbage_route(data: dict):
    try:
        response = supabase.table(TABLE).insert(data).execute()
        return response.data[0]
    except Exception as e:
        raise Exception(f"Failed to create route: {str(e)}")


def update_garbage_route(route_id: int, data: dict):
    try:
        response = (
            supabase.table(TABLE)
            .update(data)
            .eq("route_id", route_id)
            .execute()
        )
        return response.data[0] if response.data else None
    except Exception as e:
        raise Exception(f"Failed to update route: {str(e)}")


def delete_garbage_route(route_id: int):
    try:
        response = (
            supabase.table(TABLE)
            .delete()
            .eq("route_id", route_id)
            .execute()
        )
        return bool(response.data)
    except Exception as e:
        raise Exception(f"Failed to delete route: {str(e)}")