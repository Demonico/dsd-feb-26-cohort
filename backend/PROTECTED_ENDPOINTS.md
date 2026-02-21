# Protected Endpoints - Role-Based Access Control

All endpoints are protected with role-based access control using `@Depends(require_role("role_name"))` which ensures only authenticated users with the required role can access these endpoints.

## Overview

The API uses a role-based security system with two main roles:
- **driver** - For driver-specific operations
- **customer** - For customer-specific operations

## Driver Endpoints

All driver endpoints require the `"driver"` role.

### GET /drivers
- **Description**: List all drivers
- **Role Required**: driver
- **Authentication**: Bearer token required
- **Returns**: List of drivers with current user ID

**Example Request:**
```bash
curl -X GET http://localhost:8000/drivers \
  -H "Authorization: Bearer <your_driver_token>"
```

**Example Response:**
```json
{
  "message": "List of drivers",
  "current_user_id": "user-uuid-123"
}
```

## Customer Endpoints

All customer endpoints require the `"customer"` role.

### GET /customers
- **Description**: List all customers
- **Role Required**: customer
- **Authentication**: Bearer token required
- **Returns**: List of customers with current user ID

**Example Request:**
```bash
curl -X GET http://localhost:8000/customers \
  -H "Authorization: Bearer <your_customer_token>"
```

**Example Response:**
```json
{
  "message": "List of customers",
  "current_user_id": "user-uuid-456"
}
```

## Role-Based Access Control Mechanism

The `require_role()` function in `src/api/auth/dependencies.py` handles role validation:

```python
def require_role(required_role: str):
    async def role_check(user: dict = Depends(get_current_user)) -> dict:
        user_role = user.get("role")
        
        if user_role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Required role '{required_role}' not found. User role: {user_role}",
            )
        
        return user
    
    return role_check
```

## Error Handling

### 401 Unauthorized - Missing or Invalid Token
```json
{
  "detail": "Missing bearer token"
}
```

### 403 Forbidden - Insufficient Role
```json
{
  "detail": "Required role 'driver' not found. User role: customer"
}
```

**Status Code**: `403 Forbidden`

## Authentication

All protected endpoints require a valid Bearer token in the Authorization header:

```
Authorization: Bearer <your_token_here>
```

The token must be valid and the user must have the required role stored in the Supabase `profiles` table.

## Usage Examples

**Accessing driver endpoint with driver role (Success):**
```bash
curl -X GET http://localhost:8000/drivers \
  -H "Authorization: Bearer driver_token_here"
```
Response: `200 OK`

**Accessing driver endpoint with customer role (Failure):**
```bash
curl -X GET http://localhost:8000/drivers \
  -H "Authorization: Bearer customer_token_here"
```
Response: `403 Forbidden` with message: `"Required role 'driver' not found. User role: customer"`

**Missing authentication token (Failure):**
```bash
curl -X GET http://localhost:8000/drivers
```
Response: `401 Unauthorized` with message: `"Missing bearer token"`

## Adding New Protected Endpoints

To protect a new endpoint with a specific role:

```python
from fastapi import APIRouter, Depends
from ..auth.dependencies import require_role

router = APIRouter()

@router.get("/protected-resource")
async def protected_resource(user: dict = Depends(require_role("admin"))):
    """Only accessible to users with 'admin' role"""
    return {"data": "sensitive info", "user_id": user["id"]}
```

## Supported Roles

- `driver` - Driver role
- `customer` - Customer role
- Custom roles can be added as needed

