# CRUD API Reference - Quick Guide

Complete reference for all Area CRUD endpoints with examples, responses, and error codes.

---

## 📋 Table of Contents

- [Endpoint Summary](#endpoint-summary)
- [Create (POST)](#create-post)
- [Read (GET)](#read-get)
- [Update (PATCH)](#update-patch)
- [Delete (DELETE)](#delete-delete)
- [Bulk Operations](#bulk-operations)
- [Error Codes](#error-codes)
- [Response Format](#response-format)

---

## 📊 Endpoint Summary

| Operation | Method | Endpoint | Status | Use Case |
|-----------|--------|----------|--------|----------|
| List all areas | GET | `/api/areas` | 200 | Display dropdown, filter list |
| Get area by ID | GET | `/api/areas/:id` | 200/404 | Edit form, detail view |
| Search areas | GET | `/api/areas?search=north` | 200 | Find specific area |
| Create area | POST | `/api/areas` | 201 | Add new area to system |
| Update area | PATCH | `/api/areas/:id` | 200 | Modify area properties |
| Delete area | DELETE | `/api/areas/:id` | 204 | Remove area (soft delete) |
| Bulk create | POST | `/api/areas/bulk/create` | 207 | Import multiple areas |
| Bulk delete | DELETE | `/api/areas/bulk/delete` | 200 | Delete multiple areas |
| Get stats | GET | `/api/areas/stats` | 200 | Analytics, dashboard |

---

## 🔵 CREATE (POST)

### Create Single Area

**Endpoint**
```
POST /api/areas
Content-Type: application/json
```

**Request**
```json
{
  "name": "North Region",
  "description": "Northern territories"
}
```

**Response (201 Created)**
```json
{
  "success": true,
  "data": {
    "id": "area-uuid-12345",
    "name": "North Region",
    "description": "Northern territories",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  },
  "message": "Area created successfully"
}
```

**Headers in Response**
```
Location: /api/areas/area-uuid-12345
Cache-Control: no-cache (newly created, don't cache)
```

**Validations**
```
name:
  - Required: ✓
  - Type: string
  - Min length: 1
  - Max length: 100
  - Trimmed: ✓

description:
  - Required: ✗ (optional)
  - Type: string
  - Max length: 500
```

**Error Responses**

| Scenario | Status | Response |
|----------|--------|----------|
| Missing name | 400 | `{ "success": false, "error": "Field 'name' is required" }` |
| Duplicate name | 409 | `{ "success": false, "error": "Area name 'North Region' already exists" }` |
| Name too long | 400 | `{ "success": false, "error": "Name cannot exceed 100 characters" }` |
| Invalid JSON | 400 | `{ "success": false, "error": "Invalid JSON" }` |
| DB connection error | 500 | `{ "success": false, "error": "Internal server error" }` |

**cURL Example**
```bash
curl -X POST http://localhost:3000/api/areas \
  -H "Content-Type: application/json" \
  -d '{
    "name": "North Region",
    "description": "Northern territories"
  }'
```

**JavaScript Example**
```javascript
const response = await fetch('/api/areas', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'North Region',
    description: 'Northern territories'
  })
});

if (response.status === 201) {
  const data = await response.json();
  console.log('Created area:', data.data);
} else if (response.status === 409) {
  console.error('Area already exists');
} else {
  console.error('Failed to create area');
}
```

---

## 🟢 READ (GET)

### List All Areas

**Endpoint**
```
GET /api/areas
```

**Query Parameters**
```
onlyActive: boolean (optional) - Show only active areas
  Default: false
  Example: ?onlyActive=true

search: string (optional) - Filter by name/description
  Example: ?search=north

page: number (optional) - Pagination page
page: ?page=1

limit: number (optional) - Results per page
  Example: ?page=1&limit=10
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": [
    {
      "id": "area-1",
      "name": "North",
      "status": "active",
      "createdAt": "2024-01-10T00:00:00Z"
    },
    {
      "id": "area-2",
      "name": "South",
      "status": "active",
      "createdAt": "2024-01-11T00:00:00Z"
    }
  ],
  "count": 2,
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2
  }
}
```

**Examples**

```bash
# All areas
GET /api/areas

# Only active areas
GET /api/areas?onlyActive=true

# Search for "north"
GET /api/areas?search=north

# Combined: active areas containing "north"
GET /api/areas?onlyActive=true&search=north

# With pagination
GET /api/areas?page=2&limit=20
```

---

### Get Single Area by ID

**Endpoint**
```
GET /api/areas/:id
```

**Parameters**
```
id: string (required) - Area unique identifier
  Example: /api/areas/area-uuid-12345
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "area-uuid-12345",
    "name": "North Region",
    "description": "Northern territories",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses**

| Scenario | Status | Response |
|----------|--------|----------|
| ID not provided | 400 | `{ "error": "Area ID is required" }` |
| ID not found | 404 | `{ "error": "Area not found" }` |
| Invalid ID format | 400 | `{ "error": "Area ID is required" }` |
| DB error | 500 | `{ "error": "Internal server error" }` |

**cURL Example**
```bash
curl -X GET http://localhost:3000/api/areas/area-uuid-12345
```

**JavaScript Example**
```javascript
const areaId = 'area-uuid-12345';
const response = await fetch(`/api/areas/${areaId}`);

if (response.status === 200) {
  const data = await response.json();
  console.log('Area:', data.data);
} else if (response.status === 404) {
  console.error('Area not found');
}
```

---

### Get Area by Name

**Endpoint**
```
GET /api/areas/by-name?name=North%20Region
```

**Query Parameters**
```
name: string (required) - Area name to search
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "area-uuid-12345",
    "name": "North Region",
    "description": "Northern territories",
    "status": "active"
  }
}
```

---

## 🟡 UPDATE (PATCH)

### Update Area

**Endpoint**
```
PATCH /api/areas/:id
Content-Type: application/json
```

**Parameters**
```
id: string (required) - Area unique identifier
```

**Request Body** (any combination of these fields)
```json
{
  "name": "Updated North",
  "description": "Updated description",
  "status": "archived"
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "id": "area-uuid-12345",
    "name": "Updated North",
    "description": "Updated description",
    "status": "archived",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:35:00Z"
  },
  "message": "Area updated successfully"
}
```

**Validations**
```
name (if provided):
  - Type: string
  - Check for duplicates (cannot rename to existing name)
  - Must be different from current value (no empty updates)

status (if provided):
  - Must be: 'active' or 'archived'

description (if provided):
  - Max length: 500 characters
```

**Error Responses**

| Scenario | Status | Response |
|----------|--------|----------|
| Area not found | 404 | `{ "error": "Area not found" }` |
| Empty body | 400 | `{ "error": "At least one field to update is required" }` |
| Duplicate name | 409 | `{ "error": "Area name already in use" }` |
| Invalid ID | 400 | `{ "error": "Area ID is required" }` |
| Invalid status value | 400 | `{ "error": "Status must be 'active' or 'archived'" }` |

**cURL Example**
```bash
curl -X PATCH http://localhost:3000/api/areas/area-uuid-12345 \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description",
    "status": "archived"
  }'
```

**JavaScript Example**
```javascript
const areaId = 'area-uuid-12345';
const response = await fetch(`/api/areas/${areaId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    description: 'Updated description',
    status: 'archived'
  })
});

const result = await response.json();
if (response.ok) {
  console.log('Updated area:', result.data);
}
```

---

## 🔴 DELETE (DELETE)

### Delete Single Area

**Endpoint**
```
DELETE /api/areas/:id
```

**Parameters**
```
id: string (required) - Area unique identifier
```

**Response (204 No Content)**
```
(Empty body - successful deletion)
```

**What Happens?**
```
- Status changed to 'archived' (soft delete)
- Data still exists in database
- Marked as deleted via status field
- If area has active references (projects):
  └─ Returns 409 Conflict instead
```

**Error Responses**

| Scenario | Status | Response |
|----------|--------|----------|
| Area not found | 404 | `{ "error": "Area not found" }` |
| Has active references | 409 | `{ "error": "Cannot delete area with active projects. Archive instead." }` |
| Invalid ID | 400 | `{ "error": "Area ID is required" }` |
| DB error | 500 | `{ "error": "Internal server error" }` |

**cURL Example**
```bash
curl -X DELETE http://localhost:3000/api/areas/area-uuid-12345
```

**JavaScript Example**
```javascript
const areaId = 'area-uuid-12345';
const response = await fetch(`/api/areas/${areaId}`, {
  method: 'DELETE'
});

if (response.status === 204) {
  console.log('Area deleted successfully');
} else if (response.status === 404) {
  console.error('Area not found');
} else if (response.status === 409) {
  console.error('Cannot delete - area has active projects');
}
```

---

## 📦 BULK OPERATIONS

### Bulk Create Areas

**Endpoint**
```
POST /api/areas/bulk/create
Content-Type: application/json
```

**Request** (array of area objects)
```json
[
  {
    "name": "North",
    "description": "North region"
  },
  {
    "name": "East",
    "description": "East region"
  },
  {
    "name": "South",
    "description": "South region"
  }
]
```

**Response (207 Multi-Status)**
```json
{
  "success": true,
  "data": {
    "created": [
      {
        "id": "area-1",
        "name": "North",
        "status": "active",
        "createdAt": "2024-01-15T10:30:00Z"
      },
      {
        "id": "area-2",
        "name": "East",
        "status": "active",
        "createdAt": "2024-01-15T10:31:00Z"
      }
    ],
    "skipped": [
      {
        "name": "South",
        "reason": "Duplicate name"
      }
    ]
  },
  "summary": {
    "total": 3,
    "created": 2,
    "skipped": 1
  }
}
```

**Why 207?**
```
- Not all succeeded (some duplicates skipped)
- Not all failed (some were created)
- Status 207 means "Multi-Status" - mix of successes/failures
- Always returns what was created and what was skipped
```

**JavaScript Example**
```javascript
const areas = [
  { name: 'North', description: 'North region' },
  { name: 'East', description: 'East region' },
  { name: 'South', description: 'South region' }
];

const response = await fetch('/api/areas/bulk/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(areas)
});

const result = await response.json();
console.log(`Created: ${result.summary.created}`);
console.log(`Skipped: ${result.summary.skipped}`);

result.data.created.forEach(area => {
  console.log(`✓ ${area.name}`);
});

result.data.skipped.forEach(area => {
  console.log(`✗ ${area.name} - ${area.reason}`);
});
```

---

### Bulk Delete Areas

**Endpoint**
```
DELETE /api/areas/bulk/delete
Content-Type: application/json
```

**Request** (array of IDs)
```json
{
  "ids": ["area-1", "area-2", "area-3"]
}
```

**Response (200 OK)**
```json
{
  "success": true,
  "data": {
    "deleted": 3
  },
  "message": "3 areas deleted successfully"
}
```

**Error Responses**

| Scenario | Status | Response |
|----------|--------|----------|
| Empty IDs array | 400 | `{ "error": "Request must include array of IDs" }` |
| IDs not array | 400 | `{ "error": "Request must include array of IDs" }` |
| Some IDs not found | 404 | `{ "error": "Area not found" }` |

**JavaScript Example**
```javascript
const idsToDelete = ['area-1', 'area-2', 'area-3'];

const response = await fetch('/api/areas/bulk/delete', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ids: idsToDelete })
});

const result = await response.json();
console.log(`${result.data.deleted} areas deleted`);
```

---

## ⚠️ Error Codes

### HTTP Status Codes

```
2xx SUCCESS CODES
─────────────────
200 OK                  GET, PATCH, DELETE (bulk) successful
201 Created             POST successful, resource created
204 No Content          DELETE successful, no body to return
207 Multi-Status        Bulk operation with mixed results


4xx CLIENT ERROR CODES
─────────────────────
400 Bad Request         Invalid input, missing required fields
401 Unauthorized        Authentication required (if implemented)
403 Forbidden           Not permitted to perform operation
404 Not Found           Resource doesn't exist
409 Conflict            Duplicate data or dependency exists


5xx SERVER ERROR CODES
──────────────────────
500 Internal Error      Unexpected server error
503 Service Unavailable Database connection failed
```

### Error Response Format

**All errors follow this format:**

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "name",
    "issue": "duplicate"
  }
}
```

**Common Error Codes**

```
VALIDATION_ERROR       - Input validation failed
DUPLICATE_RESOURCE    - Resource already exists
NOT_FOUND             - Resource doesn't exist
CONSTRAINT_VIOLATION  - Database constraint violated
UNAUTHORIZED          - Missing authentication
FORBIDDEN             - Not permitted
DATABASE_ERROR        - Database operation failed
```

---

## 📨 Response Format

### Success Response

```json
{
  "success": true,
  "data": { /* actual data */ },
  "message": "Operation completed successfully",
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0"
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {},
  "meta": {
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### Paginated Response

```json
{
  "success": true,
  "data": [ /* array of items */ ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "hasMore": true
  }
}
```

---

## 🎯 Common Use Cases & Recommended Endpoints

### Use Case: Display area dropdown in form
```
GET /api/areas?onlyActive=true
├─ Fetch all active areas
└─ Display in <select> dropdown
```

### Use Case: Search for specific area
```
GET /api/areas?search=north&onlyActive=true
├─ Search by name
└─ Display matching results
```

### Use Case: Edit area details
```
GET /api/areas/:id                ← Load current data
PATCH /api/areas/:id              ← Submit changes
```

### Use Case: Import areas from CSV
```
POST /api/areas/bulk/create       ← Send array of areas
├─ Returns what was created
└─ Returns what failed with reasons
```

### Use Case: Clean up obsolete areas
```
DELETE /api/areas/bulk/delete     ← Send array of IDs
└─ Returns count deleted
```

### Use Case: Get analytics/dashboard data
```
GET /api/areas/stats              ← Get total, active, archived counts
```

---

## 💡 Best Practices

### When Creating Areas
```javascript
// ✓ DO: Validate on client first
if (!name || name.trim().length === 0) {
  showError('Name is required');
  return;
}

// ✓ DO: Show user feedback
showLoading(true);
try {
  const response = await createArea(name);
  showSuccess(`Area "${name}" created`);
} catch (error) {
  if (error.status === 409) {
    showError('Area already exists');
  } else {
    showError('Failed to create area');
  }
} finally {
  showLoading(false);
}

// ✗ DON'T: Send request without validation
// ✗ DON'T: Ignore error responses
// ✗ DON'T: Leave user without feedback
```

### When Fetching Areas
```javascript
// ✓ DO: Cache results (if appropriate)
const areas = useCallback(async () => {
  const cached = localStorage.getItem('areas');
  if (cached) return JSON.parse(cached);
  
  const response = await fetch('/api/areas');
  localStorage.setItem('areas', JSON.stringify(response.data));
  return response.data;
}, []);

// ✓ DO: Handle errors gracefully
try {
  const areas = await getAreas();
} catch (error) {
  console.error('Failed to load areas');
  setAreas([]); // Empty fallback
}

// ✗ DON'T: Make request on every render
// ✗ DON'T: Ignore loading state
```

### When Updating Areas
```javascript
// ✓ DO: Only send changed fields
const updates = {};
if (name !== original.name) updates.name = name;
if (description !== original.description) updates.description = description;

if (Object.keys(updates).length > 0) {
  await updateArea(id, updates);
}

// ✓ DO: Show optimistic updates (update UI before confirmation)
setArea({ ...area, ...updates });
try {
  await updateArea(id, updates);
} catch (error) {
  // Revert if failed
  setArea(original);
  showError('Failed to update');
}
```

### When Deleting Areas
```javascript
// ✓ DO: Confirm before deleting
const confirmed = confirm('Delete area? This cannot be undone.');
if (!confirmed) return;

// ✓ DO: Handle dependency check
try {
  await deleteArea(id);
} catch (error) {
  if (error.status === 409) {
    showError('Cannot delete - area has active projects');
  }
}

// ✗ DON'T: Delete without confirmation
// ✗ DON'T: Ignore 409 Conflict errors
```

---

## 📞 Support

For issues or questions:
- Check [CRUD_DATAFLOW.md](CRUD_DATAFLOW.md) for detailed explanations
- Review [ARCHITECTURE_OVERVIEW.md](ARCHITECTURE_OVERVIEW.md) for design patterns
- Check error codes in [Error Codes](#error-codes) section
