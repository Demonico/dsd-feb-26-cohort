```mermaid
erDiagram
  CUSTOMERS {
    UUID customer_id PK
    string customer_name
    string subscription_tier
    string address
  }

  LOCATIONS {
    UUID location_id PK
    UUID customer_id FK
    string coordinates
    string service_instructions
  }

  ROUTES {
    UUID id PK
    UUID driver_id FK
    string vehicle_id FK
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

  VEHICLES {
    string vehicle_id PK
    string plate_number
  }
