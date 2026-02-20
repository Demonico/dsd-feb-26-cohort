from fastapi import APIRouter

router = APIRouter()

@router.get("/drivers")
def list_drivers():
    return {"message": "List of drivers"}