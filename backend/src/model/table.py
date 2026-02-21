from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import SQLModel, Field


class RequestType(str, Enum):
    SKIP = "SKIP"
    EXTRA = "EXTRA"


class RequestStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSED = "PROCESSED"

class Customer(SQLModel, table=True):
    __tablename__ = "customers"

    customer_id: UUID = Field(default_factory=uuid4, primary_key=True, index=True)
    customer_name: str
    address: str
    phone : str

class Location(SQLModel, table=True):
    __tablename__ = "locations"

    location_id: UUID = Field(default_factory=uuid4, primary_key=True, index=True)
    customer_id: UUID = Field(foreign_key="customers.customer_id", index=True)
    route_id: UUID = Field(foreign_key="routes.route_id", index=True)
    street_address : str
    lat : float
    long : float

class Driver(SQLModel, table=True):
    __tablename__ = "drivers"

    driver_id: UUID = Field(default_factory=uuid4, primary_key=True, index=True)
    driver_name: str

class Routes(SQLModel, table=True):
    __tablename__ = "routes"

    route_id: UUID = Field(primary_key=True, index=True)
    driver_id: UUID = Field(foreign_key="drivers.driver_id", index=True)
    service_date : datetime
    start_location_name : str
    start_lat : float
    start_long : float
    status : str #What is this for?

class Request(SQLModel, table=True):
    __tablename__ = "requests"

    request_id: UUID = Field(default_factory=uuid4, primary_key=True, index=True)
    location_id: UUID = Field(foreign_key="locations.location_id", index=True)
    request_type: RequestType = Field(index=True)
    requested_for_date: datetime = Field(index=True)
    created_at: datetime

    status: RequestStatus = Field(default=RequestStatus.PENDING, index=True)

class JobSource(str, Enum):
    SCHEDULED = "SCHEDULED"
    EXTRA_REQUEST = "EXTRA_REQUEST"

class JobStatus(str, Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"

class ServiceJob(SQLModel, table=True):
    __tablename__ = "service_jobs"

    job_id: UUID = Field(default_factory=uuid4, primary_key=True, index=True)
    location_id: UUID = Field(
        foreign_key="locations.location_id",
        index=True,
    )
    route_id: Optional[UUID] = Field(
        default=None,
        foreign_key="routes.region_id",
        index=True,
        nullable=True,
    )

    job_source: JobSource = Field(index=True)
    completed_at: Optional[datetime] = Field(default=None, index=True)
    status: JobStatus = Field(default=JobStatus.PENDING, index=True)
    failure_reason: Optional[str] = Field(default=None, nullable=True)
    proof_of_service_photo: Optional[str] = Field(default=None, nullable=True)