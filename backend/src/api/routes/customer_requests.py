from fastapi import APIRouter, HTTPException, Depends
from typing import List, Literal, Optional
from pydantic import BaseModel
from datetime import date, datetime
from src.services import customer_requests_service
from ..auth.dependencies import require_role

router = APIRouter(
    prefix="/customer_requests",
    tags=["customer_requests"]
)

class RequestBase(BaseModel):
    location_id: Optional[int] = None
    customer_id: Optional[int] = None
    request_type: Literal["NORMAL", "SKIP", "EXTRA"] | None = None
    requested_for_date: Optional[date] = None
    status: Literal["PENDING", "COMPLETED", "FAILED", "SKIPPED"] | None = None

class RequestCreate(RequestBase):
    location_id: int
    customer_id: int
    request_type: Literal["NORMAL", "SKIP", "EXTRA"]
    requested_for_date: date
    status: Literal["PENDING", "COMPLETED", "FAILED", "SKIPPED"] = "PENDING"
    created_at: Optional[datetime] = None


class CustomerRequestCreate(BaseModel):
    request_type: Literal["NORMAL", "SKIP", "EXTRA"]
    requested_for_date: date


class RequestUpdate(RequestBase):
    pass

class RequestResponse(RequestBase):
    request_id: int
    created_at: Optional[datetime] = None

@router.get("/", response_model=List[RequestResponse])
def read_requests(_user=Depends(require_role("driver"))):
    return customer_requests_service.get_all_requests()


@router.get("/request_type")
def get_request_type(_user=Depends(require_role("driver"))):
    return customer_requests_service.get_all_request_type()


@router.get("/{request_id}", response_model=RequestResponse)
def read_request(request_id: int, _user=Depends(require_role("driver"))):
    if request_id <= 0:
        raise HTTPException(status_code=400, detail="Invalid request ID")
    req = customer_requests_service.get_request(request_id)
    if req is None:
        raise HTTPException(status_code=404, detail="Request not found")
    return req


@router.post("/", response_model=RequestResponse)
def create_request(request: RequestCreate, _user=Depends(require_role("driver"))):
    if not request.created_at:
        request.created_at = datetime.now()
    try:
        return customer_requests_service.create_request(request.model_dump())
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to create request")


@router.post("/customer", response_model=RequestResponse)
def create_customer_request(
    request: CustomerRequestCreate,
    user: dict = Depends(require_role("customer")),
):
    try:
        return customer_requests_service.create_request_for_customer_user(
            user_id=user["id"],
            request_type=request.request_type,
            requested_for_date=request.requested_for_date,
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to create request")


@router.put("/{request_id}", response_model=RequestResponse)
def update_request(request_id: int, request: RequestUpdate, _user=Depends(require_role("driver"))):
    if request_id <= 0:
        raise HTTPException(status_code=400, detail="Invalid request ID")
    try:
        existing_request = customer_requests_service.get_request(request_id)
        if existing_request is None:
            raise HTTPException(status_code=404, detail="Request not found")  
        updated = customer_requests_service.update_request(
            request_id, request.model_dump(exclude_unset=True)
        )
        if updated is None:
            updated = customer_requests_service.get_request(request_id)
        return updated
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to update request")


@router.delete("/{request_id}")
def delete_request(request_id: int, _user=Depends(require_role("driver"))):
    if request_id <= 0:
        raise HTTPException(status_code=400, detail="Invalid request ID")
    try:
        deleted = customer_requests_service.delete_request(request_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Request not found")
        return {"message": "Request deleted successfully"}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to delete request")
