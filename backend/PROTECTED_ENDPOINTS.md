# Driver Endpoints - Role-Protected Routes

All driver endpoints are now protected with `@Depends(require_role("driver"))` which ensures only authenticated users with the "driver" role can access these endpoints.

## Protected Endpoints

### 1. **GET /drivers**
- **Description**: List all drivers
- **Role Required**: driver
- **Query Parameters**: None
- **Returns**: List of all drivers with their availability status

### 2. **GET /drivers/me**
- **Description**: Get current driver's profile
- **Role Required**: driver
- **Query Parameters**: None
- **Returns**: Current user's driver profile including rating, trips, and availability status

### 3. **GET /drivers/{driver_id}**
- **Description**: Get specific driver's details
- **Role Required**: driver
- **Path Parameters**: 
  - `driver_id` (string): The ID of the driver to retrieve
- **Returns**: Driver details including rating and trip count

### 4. **PUT /drivers/me**
- **Description**: Update current driver's profile
- **Role Required**: driver
- **Request Body**:
  ```json
  {
    "name": "string (optional)",
    "phone": "string (optional)",
    "vehicle_type": "string (optional)",
    "is_available": "boolean (optional)"
  }
  ```
- **Returns**: Confirmation of updated fields

### 5. **PATCH /drivers/me/availability**
- **Description**: Update driver availability status
- **Role Required**: driver
- **Query Parameters**: 
  - `is_available` (boolean, required): Set driver as available or offline
- **Returns**: Confirmation of availability update

### 6. **GET /drivers/me/trips**
- **Description**: Get current driver's trip history
- **Role Required**: driver
- **Query Parameters**: 
  - `limit` (integer, default=10): Maximum number of trips to return
- **Returns**: List of driver's recent trips with earnings and ratings

## Error Handling

If a user without the "driver" role attempts to access these endpoints, they will receive:

```json
{
  "detail": "Required role 'driver' not found. User has roles: [list of user's roles]"
}
```

HTTP Status Code: **403 Forbidden**

## Authentication

All endpoints require a valid Bearer token in the Authorization header:

```
Authorization: Bearer <your_token_here>
```

The token must belong to a user with the "driver" role in their user metadata in Supabase.

## Usage Example

```bash
curl -X GET http://localhost:8000/drivers \
  -H "Authorization: Bearer your_valid_token_here"
```

If the user has the "driver" role, they will receive the list of drivers. Otherwise, they'll get a 403 Forbidden error.

