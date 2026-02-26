from fastapi import APIRouter, HTTPException
from typing import List, Literal, Optional
from pydantic import BaseModel
from datetime import date, datetime
from src.services import customer_requests_service

router = APIRouter(
    prefix="/customer_requests",
    tags=["customer_requests"]
)

class RequestBase(BaseModel):
    location_id: Optional[int] = None
    customer_id: Optional[int] = None
    request_type: Literal["SKIP", "EXTRA"] | None = None
    requested_for_date: Optional[date] = None
    status: Literal["PENDING", "COMPLETED", "FAILED", "SKIPPED"] | None = None

class RequestCreate(RequestBase):
    created_at: Optional[datetime] = None

class RequestUpdate(RequestBase):
    pass

class RequestResponse(RequestBase):
    request_id: int
    created_at: Optional[datetime] = None

@router.get("/", response_model=List[RequestResponse])
def read_requests():
    return customer_requests_service.get_all_requests()


@router.get("/request_type")
def get_request_type():
    return customer_requests_service.get_all_request_type()


@router.get("/{request_id}", response_model=RequestResponse)
def read_request(request_id: int):
    req = customer_requests_service.get_request(request_id)
    if req is None:
        raise HTTPException(status_code=404, detail="Request not found")
    return req


@router.post("/", response_model=RequestResponse)
def create_request(request: RequestCreate):
    if not request.created_at:
        request.created_at = datetime.now()
    return customer_requests_service.create_request(request.model_dump())


@router.put("/{request_id}", response_model=RequestResponse)
def update_request(request_id: int, request: RequestUpdate):
    updated = customer_requests_service.update_request(
        request_id, request.model_dump(exclude_unset=True)
    )
    if updated is None:
        raise HTTPException(status_code=404, detail="Request not found")
    return updated


@router.delete("/{request_id}")
def delete_request(request_id: int):
    deleted = customer_requests_service.delete_request(request_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Request not found")
    return {"message": "Request deleted successfully"}