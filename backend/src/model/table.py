from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from sqlmodel import SQLModel, Field


class RequestType(str, Enum):
    NORMAL = "NORMAL"
    SKIP = "SKIP"
    EXTRA = "EXTRA"


class RequestStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSED = "PROCESSED"


class UserRole(str, Enum):
    DRIVER = "driver"
    CUSTOMER = "customer"


class JobSource(str, Enum):
    SCHEDULED = "SCHEDULED"
    EXTRA_REQUEST = "EXTRA_REQUEST"


class JobStatus(str, Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    SKIPPED = "SKIPPED"


class Customer(SQLModel, table=True):
    __tablename__ = "customers"

    customer_id: int = Field(primary_key=True, index=True)
    user_id: int = Field(foreign_key="users.id", unique=True, index=True)
    customer_name: str
    billing_address: str
    phone: str


class Location(SQLModel, table=True):
    __tablename__ = "service_locations"

    location_id: int = Field(primary_key=True, index=True)
    route_id: Optional[int] = Field(
        default=None,
        foreign_key="routes.route_id",
        index=True,
        nullable=True,
    )
    customer_id: int = Field(foreign_key="customers.customer_id", index=True)
    job_id: Optional[int] = Field(
        default=None,
        foreign_key="service_jobs.job_id",
        index=True,
        nullable=True,
    )
    street_address: str
    city: str
    zipcode: str
    state: str


class Driver(SQLModel, table=True):
    __tablename__ = "drivers"

    driver_id: int = Field(primary_key=True, index=True)
    user_id: int = Field(foreign_key="users.id", unique=True, index=True)
    driver_name: str

class Routes(SQLModel, table=True):
    __tablename__ = "routes"

    route_id: int = Field(primary_key=True, index=True)
    driver_id: int = Field(foreign_key="drivers.driver_id", index=True)
    service_date: datetime
    start_location_name: str
    status: str


class ServiceJob(SQLModel, table=True):
    __tablename__ = "service_jobs"

    job_id: Optional[int] = Field(default=None, primary_key=True, index=True)
    location_id: int = Field(foreign_key="service_locations.location_id",index=True)
    route_id: Optional[int] = Field(
        default=None,
        foreign_key="routes.route_id",
        index=True,
        nullable=True,
    )
    job_source: JobSource = Field(index=True)
    completed_at: Optional[datetime] = Field(default=None, index=True)
    status: JobStatus = Field(default=JobStatus.PENDING, index=True)
    failure_reason: Optional[str] = Field(default=None, nullable=True)
    proof_of_service_photo: Optional[str] = Field(default=None, nullable=True)



class User(SQLModel, table=True):
    __tablename__ = "users"
    id: int = Field(primary_key=True, index=True, foreign_key="auth.users.id")
    driver_id: int = Field(foreign_key="drivers.driver_id", index=True)
    customer_id: int = Field(foreign_key="customers.customer_id", index=True)
    role: Optional[UserRole] = Field(default=None, index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Service_Request(SQLModel, table=True):
    __tablename__ = "requests"

    request_id: int = Field(primary_key=True, index=True)
    location_id: int = Field(foreign_key="service_locations.location_id", index=True)
    job_id: int = Field(foreign_key="service_jobs.job_id", index=True)
    request_type: RequestType = Field(index=True)
    requested_for_date: datetime = Field(index=True)
    created_at: datetime
    status: RequestStatus = Field(default=RequestStatus.PENDING, index=True)
