```mermaid
erDiagram
    CUSTOMERS {
        UUID customer_id PK
        string customer_name
        string billing_address
        string phone
    }

    SERVICE_LOCATIONS {
        UUID location_id PK
        UUID route_id FK
        UUID customer_id FK
        UUID job_id FK
        string street_address
        str city
        str zipcode
        str state
    }

    DRIVERS {
        UUID driver_id PK
        string driver_name
    }

    %% Dynamic / Daily Data
    ROUTES {
        UUID route_id PK
        UUID driver_id FK
        date service_date
        string start_location_name
        string status
    }

    SERVICE_JOBS {
        UUID job_id PK
        UUID location_id FK
        UUID route_id FK
        UUID request_id FK
        int sequence_order
        string job_source "SCHEDULED|EXTRA_REQUEST"
        datetime completed_at
        string status "PENDING|COMPLETED|FAILED|SKIPPED"
        string failure_reason
        str proof_of_service_photo
    }

    SERVICE_REQUESTS {
        UUID request_id PK
        UUID location_id FK
        UUID job_id FK
        string request_type "SKIP|EXTRA"
        datetime requested_for_date
        datetime created_at
        string status "PROCESSED|PENDING"
    }

    PROFILES {
        UUID profile_id PK
        UUID user_id FK
        string role "Customer|Driver"
    }

    USERS {
        UUID user_id PK
        UUID profile_id FK
        UUID customer_id FK
        UUID driver_id FK
    }

    %% Relationships
    CUSTOMERS ||--o{ SERVICE_LOCATIONS : "owned"
    USERS ||--|| PROFILES : "assigned"
    USERS ||--|| PROFILES : "assigned_to"
    USERS ||--o| CUSTOMERS : "assigned"
    USERS ||--o| DRIVERS : "assigned"
    DRIVERS ||--o{ ROUTES : "assigned_to"
    ROUTES ||--o{ SERVICE_JOBS : "executes"
    ROUTES ||--o{ SERVICE_LOCATIONS : "belonged"
    SERVICE_JOBS ||--o| SERVICE_REQUESTS : "generates"
    SERVICE_LOCATIONS ||--o{ SERVICE_JOBS : "has_history"
    SERVICE_LOCATIONS ||--o{ SERVICE_REQUESTS : "generates"
```