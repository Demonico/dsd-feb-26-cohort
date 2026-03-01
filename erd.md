```mermaid
erDiagram
    CUSTOMERS {
        int8 customer_id PK
        int8 user_id FK
        string customer_name
        string billing_address
        string phone
    }

    SERVICE_LOCATIONS {
        int8 location_id PK
        int8 route_id FK
        int8 customer_id FK
        int8 job_id FK
        string street_address
        str city
        str zipcode
        str state
    }

    DRIVERS {
        int8 driver_id PK
        int8 user_id FK
        string driver_name
    }

    %% Dynamic / Daily Data
    ROUTES {
        int8 route_id PK
        int8 driver_id FK
        date service_date
        string start_location_name
        string status
    }

    SERVICE_JOBS {
        int8 job_id PK
        int8 location_id FK
        int8 route_id FK
        int8 request_id FK
        int sequence_order
        string job_source "SCHEDULED|EXTRA_REQUEST"
        datetime completed_at
        string status "PENDING|COMPLETED|FAILED|SKIPPED"
        string failure_reason
        str proof_of_service_photo
    }

    SERVICE_REQUESTS {
        int8 request_id PK
        int8 location_id FK
        int8 job_id FK
        string request_type "SKIP|EXTRA"
        datetime requested_for_date
        datetime created_at
        string status "PROCESSED|PENDING"
    }

    USERS {
        int8 id PK
        int8 driver_id FK
        int8 customer_id FK
        string role "driver|customer"
        datetime created_at
    }

    %% Relationships
    CUSTOMERS ||--o{ SERVICE_LOCATIONS : "owned"
    USERS ||--o| CUSTOMERS : "assigned"
    USERS ||--o| DRIVERS : "assigned"
    DRIVERS ||--o{ ROUTES : "assigned_to"
    ROUTES ||--o{ SERVICE_JOBS : "executes"
    ROUTES ||--o{ SERVICE_LOCATIONS : "belonged"
    SERVICE_JOBS ||--o| SERVICE_REQUESTS : "generates"
    SERVICE_LOCATIONS ||--o{ SERVICE_JOBS : "has_history"
    SERVICE_LOCATIONS ||--o{ SERVICE_REQUESTS : "generates"
```
