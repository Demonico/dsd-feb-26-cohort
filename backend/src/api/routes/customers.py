from fastapi import APIRouter, Depends

from ..auth.dependencies import require_role

router = APIRouter()

# placeholder for customer-related endpoints
@router.get("/customers")
async def list_customers(user: dict = Depends(require_role("customer"))):
    return {"message": "List of customers", "current_user_id": user["id"]}