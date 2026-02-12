```mermaid
erDiagram
  CUSTOMERS {
    UUID customer_id PK
    string customer_name
    string subscription_tier
    string address
    string service_instructions
    UUID region_id FK
  }

  LOCATIONS {
    UUID location_id PK
    UUID customer_id FK
    UUID region_id FK
    timestamp assigned_pickup
    timestamp pickup_time
    string photos
  }

  ROUTES_REGION {
    UUID region_id PK
    UUID driver_id FK
    boolean is_active
  }

  REQUESTS {
    UUID request_id PK
    UUID customer_id FK
    UUID location_id FK
    UUID route_id FK
    string type          "SKIP|EXTRA"
    datetime requested_date
    datetime created_at
    string status        "PENDING|COMPLETED|SKIPPED_BY_USER|FAILED_BIN_MISSING"
  }

  DRIVERS {
    UUID driver_id PK
    string driver_name
  }

  %% Relationships (cardinality)
  CUSTOMERS ||--|| LOCATIONS : "has"
  CUSTOMERS ||--o{ REQUESTS  : "makes"
  LOCATIONS ||--o{ REQUESTS  : "requested_at"
  DRIVERS   ||--o{ ROUTES_REGION : "drives"
  ROUTES_REGION ||--o{ REQUESTS : "assigned"