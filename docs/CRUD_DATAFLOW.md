# Area CRUD - Complete Data Flow Guide

## Overview: Full Request-Response Lifecycle

This document explains how data flows through the application for each CRUD operation (Create, Read, Update, Delete) on the Area entity.

---

## 🏗️ Architecture Layers & Data Flow

```
┌────────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (HTTP Interface)                           │
│  - Controllers handle HTTP requests/responses                  │
│  - Validate input parameters                                   │
│  - Format JSON responses                                       │
└────────────────────────┬─────────────────────────────────────┘
                         │ Data In (Request Body/Params)
                         │ Data Out (Formatted Response)
                         ▼
┌────────────────────────────────────────────────────────────────┐
│  APPLICATION LAYER (Business Logic)                            │
│  - Services orchestrate operations                             │
│  - Enforce business rules (duplicates, validations)            │
│  - Transform data (Entity ↔ DTO)                               │
│  - Cross-cutting concerns (logging, events)                    │
└────────────────────────┬─────────────────────────────────────┘
                         │ Data In (Validated Request)
                         │ Data Out (Domain Entities)
                         ▼
┌────────────────────────────────────────────────────────────────┐
│  DOMAIN LAYER (Business Rules)                                 │
│  - Entities define data structure                              │
│  - Interfaces define contracts                                 │
│  - Exceptions represent errors                                 │
└────────────────────────┬─────────────────────────────────────┘
                         │ Data In (Parameters)
                         │ Data Out (Domain Objects)
                         ▼
┌────────────────────────────────────────────────────────────────┐
│  INFRASTRUCTURE LAYER (Database Access)                        │
│  - Repository executes SQL queries                             │
│  - Maps database rows → domain entities                        │
│  - Handles connection pooling                                  │
│  - Transaction management                                      │
└────────────────────────┬─────────────────────────────────────┘
                         │ Data In (SQL Parameters)
                         │ Data Out (Database Rows)
                         ▼
                    [SQLite Database]
```

---

## 📥 CREATE: Insert New Area

### 1️⃣ Request Entry Point

```
POST /api/areas
Content-Type: application/json

{
  "name": "North Region",
  "description": "Northern territories"
}
```

### 2️⃣ Complete Data Flow (Step by Step)

```
STEP 1: HTTP REQUEST RECEIVED
        ├─ Express receives POST request
        ├─ Body parser extracts JSON
        └─ Routing matches /api/areas endpoint

        Request Data:
        {
          "name": "North Region",
          "description": "Northern territories"
        }

                    │
                    ▼

STEP 2: CONTROLLER (AreaController.createArea)
        ├─ Extract request.body
        ├─ Validate: body exists? ✓
        ├─ Validate: name is string? ✓
        ├─ Validate: name not empty? ✓
        ├─ Trim whitespace: "North Region" → "North Region"
        └─ Call areaService.createArea()

        Controller Data:
        {
          name: "North Region",
          description: "Northern territories"
        }

                    │
                    ▼

STEP 3: SERVICE (AreaService.createArea)
        ├─ Check for duplicate name
        │  └─ Query: SELECT * FROM areas WHERE LOWER(name) = LOWER(?)
        │     └─ Result: undefined (no duplicate)
        │
        ├─ Create entity using factory
        │  └─ createNewArea(input)
        │     ├─ Generate unique ID: "area-uuid-12345"
        │     ├─ Set status: "active"
        │     ├─ Record timestamps:
        │     │  ├─ createdAt: 2024-01-15T10:30:00Z
        │     │  └─ updatedAt: 2024-01-15T10:30:00Z
        │     └─ Return complete entity
        │
        └─ Call areaRepository.create(entity)

        Entity in Service:
        {
          id: "area-uuid-12345",
          name: "North Region",
          description: "Northern territories",
          status: "active",
          createdAt: 2024-01-15T10:30:00Z,
          updatedAt: 2024-01-15T10:30:00Z
        }

                    │
                    ▼

STEP 4: REPOSITORY (AreaRepository.create)
        ├─ Get database connection
        ├─ Execute INSERT statement with parameters:
        │  SQL: INSERT INTO areas 
        │       (id, name, description, status, created_at, updated_at)
        │       VALUES (?, ?, ?, ?, ?, ?)
        │
        │  Parameters:
        │  ├─ $1: "area-uuid-12345"
        │  ├─ $2: "North Region"
        │  ├─ $3: "Northern territories"
        │  ├─ $4: "active"
        │  ├─ $5: 2024-01-15T10:30:00Z
        │  └─ $6: 2024-01-15T10:30:00Z
        │
        ├─ Database inserts row
        └─ Return created entity with database-assigned ID

        Database Operation:
        INSERT INTO areas (id, name, description, status, created_at, updated_at)
        VALUES ('area-uuid-12345', 'North Region', 'Northern territories', 'active', 
                '2024-01-15T10:30:00Z', '2024-01-15T10:30:00Z')

                    │
                    ▼

STEP 5: RESPONSE PROPAGATES BACK UP

        Repository returns → Service → Controller → HTTP Response

        Status 201 Created
        Location: /api/areas/area-uuid-12345
        
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

### 3️⃣ Error Scenarios - CREATE

| Scenario | Where Caught | Response |
|----------|--------------|----------|
| Missing name field | Controller | 400 Bad Request: "Field name is required" |
| Duplicate name | Service | 409 Conflict: "Area name already exists" |
| Database error | Repository | 500 Internal Server Error: "Failed to create area" |
| Invalid JSON | Express parser | 400 Bad Request: "Invalid JSON" |

---

## 📖 READ: Retrieve Area(s)

### Pattern 1: Get All Areas

```
GET /api/areas?onlyActive=true&search=north
```

#### Data Flow:

```
REQUEST:
GET /api/areas?onlyActive=true&search=north

                    │
                    ▼

CONTROLLER (AreaController.getAllAreasFiltered)
├─ Parse query parameters:
│  ├─ onlyActive: "true" → boolean true
│  └─ search: "north"
├─ Call areaService.getAllAreasWithFilter({ 
│     onlyActive: true, 
│     search: "north" 
│   })

                    │
                    ▼

SERVICE (AreaService.getAllAreasWithFilter)
├─ Call areaRepository.findAll()
│  └─ Fetches ALL areas from database
│
├─ Apply client-side filtering:
│  ├─ Filter 1 - Only Active:
│  │  areas = areas.filter(a => a.status === 'active')
│  │  └─ Removes archived areas
│  │
│  ├─ Filter 2 - Search:
│  │  areas = areas.filter(a => 
│  │    a.name.toLowerCase().includes('north')
│  │  )
│  │  └─ Returns only areas with "north" in name
│  │
│  └─ Result: filtered array

                    │
                    ▼

REPOSITORY (AreaRepository.findAll)
├─ Execute query:
│  SQL: SELECT DISTINCT area FROM project_area_map ORDER BY area
│
├─ Database returns rows:
│  [
│    { area: "North" },
│    { area: "East" },
│    { area: "South" },
│    { area: "West" }
│  ]
│
├─ Map each row to entity using createArea(row):
│  {
│    name: "North",
│    ... (other properties)
│  }
│
└─ Return entities array

                    │
                    ▼

RESPONSE (HTTP 200)
{
  "success": true,
  "data": [
    {
      "name": "North",
      "status": "active"
    }
  ],
  "count": 1
}
```

### Pattern 2: Get Single Area by ID

```
GET /api/areas/area-uuid-12345
```

#### Data Flow:

```
REQUEST: GET /api/areas/area-uuid-12345

                    │
                    ▼

CONTROLLER (AreaController.getAreaById)
├─ Extract URL parameter: id = "area-uuid-12345"
├─ Validate: id exists and is string ✓
└─ Call areaService.getAreaById(id)

                    │
                    ▼

SERVICE (AreaService.getAreaById)
├─ Call areaRepository.findById("area-uuid-12345")
├─ Check result:
│  ├─ If found: return area entity
│  └─ If NOT found:
│     └─ Throw NotFoundException('Area', id)

                    │
                    ▼

REPOSITORY (AreaRepository.findById)
├─ Execute query:
│  SQL: SELECT * FROM areas WHERE id = ? LIMIT 1
│  Parameters: ["area-uuid-12345"]
│
├─ Database lookup:
│  ├─ Find row where id = "area-uuid-12345"
│  └─ Return first match only
│
├─ Map row to entity:
│  Row from DB:
│  {
│    id: "area-uuid-12345",
│    name: "North Region",
│    status: "active",
│    created_at: "2024-01-15T10:30:00Z",
│    updated_at: "2024-01-15T10:30:00Z"
│  }
│
│  Transform to entity:
│  {
│    id: "area-uuid-12345",
│    name: "North Region",
│    status: "active",
│    createdAt: new Date("2024-01-15T10:30:00Z"),
│    updatedAt: new Date("2024-01-15T10:30:00Z")
│  }
│
└─ Return entity (or undefined if not found)

                    │
                    ▼

ERROR HANDLING (Service)
├─ Check if result is undefined
├─ If undefined:
│  └─ throw new NotFoundException('Area', 'area-uuid-12345')
│     └─ Error middleware catches → 404 response

                    │
                    ▼

RESPONSE (HTTP 200)
{
  "success": true,
  "data": {
    "id": "area-uuid-12345",
    "name": "North Region",
    "status": "active",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### 3️⃣ Error Scenarios - READ

| Scenario | Where Caught | Response |
|----------|--------------|----------|
| Invalid ID format | Controller | 400 Bad Request: "Area ID is required" |
| Area not found | Service | 404 Not Found: "Area not found" |
| Database error | Repository | 500 Internal Server Error |
| Invalid search syntax | Service | 400 Bad Request (if implemented) |

---

## ✏️ UPDATE: Modify Existing Area

```
PATCH /api/areas/area-uuid-12345
Content-Type: application/json

{
  "description": "Updated description",
  "status": "archived"
}
```

### Complete Data Flow:

```
REQUEST:
PATCH /api/areas/area-uuid-12345
{
  "description": "Updated description",
  "status": "archived"
}

                    │
                    ▼

CONTROLLER (AreaController.updateArea)
├─ Extract URL parameter: id = "area-uuid-12345"
├─ Extract body updates:
│  {
│    description: "Updated description",
│    status: "archived"
│  }
├─ Validate: id not empty ✓
├─ Validate: body not empty ✓
└─ Call areaService.updateArea(id, updates)

                    │
                    ▼

SERVICE (AreaService.updateArea)
├─ Step 1: Verify area exists
│  └─ Call getAreaById(id)
│     └─ Throws NotFoundException if not found
│
│  existing = {
│    id: "area-uuid-12345",
│    name: "North Region",
│    description: "Original description",
│    status: "active",
│    createdAt: "2024-01-15T10:30:00Z",
│    updatedAt: "2024-01-15T10:30:00Z"
│  }
│
├─ Step 2: Check for business rule violations
│  ├─ If updating name:
│  │  ├─ Check if new name already exists
│  │  ├─ If duplicate AND different ID:
│  │  │  └─ throw Error("Area name already in use")
│  │  └─ else: continue
│  │
│  └─ (Other validations as needed)
│
├─ Step 3: Create merged entity
│  updateArea(existing, updates):
│  ├─ Merge: {...existing, ...updates}
│  ├─ Update timestamp: updatedAt = new Date()
│  └─ Preserve: id, createdAt, createdBy
│
│  Result:
│  {
│    id: "area-uuid-12345",           ← unchanged
│    name: "North Region",             ← unchanged
│    description: "Updated description" ← changed
│    status: "archived",                ← changed
│    createdAt: "2024-01-15T10:30:00Z" ← unchanged
│    updatedAt: "2024-01-15T10:35:00Z" ← updated
│  }
│
└─ Call areaRepository.update(id, updates)

                    │
                    ▼

REPOSITORY (AreaRepository.update)
├─ Build dynamic UPDATE statement:
│  ├─ Fields to update: "description", "status", "updated_at"
│  ├─ Generate SQL:
│  │  UPDATE areas
│  │  SET description = ?,
│  │      status = ?,
│  │      updated_at = ?
│  │  WHERE id = ?
│  │
│  │  Parameters: [
│  │    "Updated description",
│  │    "archived",
│  │    "2024-01-15T10:35:00Z",
│  │    "area-uuid-12345"
│  │  ]
│
├─ Execute UPDATE:
│  └─ Database modifies 1 row (changes = 1)
│
├─ Fetch updated record:
│  └─ Call findById(id) to retrieve fresh data
│
└─ Return complete updated entity

                    │
                    ▼

DATABASE STATE BEFORE:
┌─────┬──────────────┬─────────────────────────┬─────────┬──────────────┬──────────────┐
│ id  │ name         │ description             │ status  │ created_at   │ updated_at   │
├─────┼──────────────┼─────────────────────────┼─────────┼──────────────┼──────────────┤
│ ... │ North Region │ Original description    │ active  │ 2024-01-15.. │ 2024-01-15.. │
└─────┴──────────────┴─────────────────────────┴─────────┴──────────────┴──────────────┘

DATABASE STATE AFTER:
┌─────┬──────────────┬─────────────────────────┬─────────┬──────────────┬──────────────┐
│ id  │ name         │ description             │ status  │ created_at   │ updated_at   │
├─────┼──────────────┼─────────────────────────┼─────────┼──────────────┼──────────────┤
│ ... │ North Region │ Updated description     │archive  │ 2024-01-15.. │ 2024-01-15.. │
└─────┴──────────────┴─────────────────────────┴─────────┴──────────────┴──────────────┘

                    │
                    ▼

RESPONSE (HTTP 200)
{
  "success": true,
  "data": {
    "id": "area-uuid-12345",
    "name": "North Region",
    "description": "Updated description",
    "status": "archived",
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:35:00Z"
  },
  "message": "Area updated successfully"
}
```

### Error Scenarios - UPDATE

| Scenario | Where Caught | Response |
|----------|--------------|----------|
| Area not found | Service | 404 Not Found |
| Duplicate name conflict | Service | 409 Conflict |
| Empty update body | Controller | 400 Bad Request |
| Invalid field type | Validation Middleware | 400 Bad Request |
| Database constraint violation | Repository | 500 Internal Server Error |

---

## 🗑️ DELETE: Remove Area

```
DELETE /api/areas/area-uuid-12345
```

### Complete Data Flow:

```
REQUEST: DELETE /api/areas/area-uuid-12345

                    │
                    ▼

CONTROLLER (AreaController.deleteArea)
├─ Extract URL parameter: id = "area-uuid-12345"
├─ Validate: id not empty ✓
└─ Call areaService.deleteArea(id)

                    │
                    ▼

SERVICE (AreaService.deleteArea)
├─ Step 1: Verify area exists
│  └─ Call getAreaById(id)
│     └─ If not found: throw NotFoundException
│
├─ Step 2: Check for active references
│  └─ Call areaRepository.hasActiveReferences(id)
│     └─ Query: SELECT COUNT(*) FROM project_area_map WHERE area_id = ?
│        └─ Returns: 0 (no active references) ✓
│
├─ Step 3: Check if can be deleted
│  ├─ If hasReferences > 0:
│  │  └─ throw Error(
│  │      "Cannot delete area with active projects. Archive instead."
│  │    )
│  │
│  └─ Else: proceed to delete
│
└─ Call areaRepository.delete(id)

                    │
                    ▼

REPOSITORY (AreaRepository.delete)
├─ Execute SOFT DELETE (safer than hard delete):
│  SQL: UPDATE areas
│       SET status = 'archived',
│           updated_at = ?
│       WHERE id = ?
│
│  Parameters: ["2024-01-15T10:40:00Z", "area-uuid-12345"]
│
├─ Database updates row:
│  ├─ Sets status to "archived"
│  ├─ Updates timestamp
│  └─ Changes = 1 (one row affected)
│
└─ Return: success boolean (changes > 0)

                    │
                    ▼

DATABASE STATE BEFORE:
┌──────────────────────────────────────────────┐
│ Areas Table                                  │
├─────┬──────────────┬─────────┬──────────────┤
│ id  │ name         │ status  │ updated_at   │
├─────┼──────────────┼─────────┼──────────────┤
│ 123 │ North Region │ active  │ 2024-01-15.. │
└─────┴──────────────┴─────────┴──────────────┘

DATABASE STATE AFTER:
┌──────────────────────────────────────────────┐
│ Areas Table (Soft Delete)                    │
├─────┬──────────────┬──────────┬──────────────┤
│ id  │ name         │ status   │ updated_at   │
├─────┼──────────────┼──────────┼──────────────┤
│ 123 │ North Region │ archived │ 2024-01-15.. │
└─────┴──────────────┴──────────┴──────────────┘
        (Data still exists, just marked as deleted)

                    │
                    ▼

RESPONSE (HTTP 204)
(No Content - successful deletion)

```

### Why Soft Delete (Archive) Instead of Hard Delete?

```
SOFT DELETE (Archive - RECOMMENDED)
├─ Sets status = 'archived'
├─ Data still exists in database
├─ Benefits:
│  ├─ Preserves audit trail (can see history)
│  ├─ Maintains referential integrity
│  ├─ Can "undelete" if mistake made
│  ├─ Complies with regulations (GDPR, etc.)
│  └─ Allows analysis of deleted data
│
└─ Query: SELECT * FROM areas WHERE status != 'archived'

HARD DELETE (Permanent Removal - DANGEROUS)
├─ DELETE FROM areas WHERE id = ?
├─ Data is permanently gone
├─ Risks:
│  ├─ Cannot recover if accidental delete
│  ├─ May violate audit requirements
│  ├─ Could break referential integrity
│  └─ Compliance issues
│
└─ Only use when legally required
```

### Error Scenarios - DELETE

| Scenario | Where Caught | Response |
|----------|--------------|----------|
| Area not found | Service | 404 Not Found |
| Area has active references | Service | 409 Conflict |
| Invalid ID format | Controller | 400 Bad Request |
| Database error | Repository | 500 Internal Server Error |

---

## 📦 BULK OPERATIONS: Multiple Records

### Bulk Create

```
POST /api/areas/bulk/create
[
  { "name": "North", "description": "North region" },
  { "name": "East", "description": "East region" },
  { "name": "South", "description": "South region" }
]
```

#### Data Flow:

```
REQUEST: Array of 3 area objects

                    │
                    ▼

CONTROLLER (AreaController.createBulkAreas)
├─ Validate request is array ✓
├─ Call areaService.createBulkAreas(areas)

                    │
                    ▼

SERVICE (AreaService.createBulkAreas)
├─ Initialize tracking:
│  ├─ created: []
│  ├─ skipped: []
│  └─ existingNames: Set()
│
├─ Fetch ALL existing areas (optimization):
│  └─ Pre-load all names to avoid N+1 queries
│
├─ Loop through each input area:
│  ├─ Area 1: { name: "North", description: "North region" }
│  │  ├─ Check if name exists in Set: NO ✓
│  │  ├─ Create area (calls createArea method)
│  │  ├─ Add to created[]
│  │  └─ Add name to existingNames Set
│  │
│  ├─ Area 2: { name: "East", description: "East region" }
│  │  ├─ Check if name exists: NO ✓
│  │  ├─ Create area
│  │  └─ Add to created[], existingNames
│  │
│  ├─ Area 3: { name: "North", description: "Different" }
│  │  ├─ Check if name exists: YES (already added) ✗
│  │  ├─ Skip this area
│  │  └─ Add to skipped[] with reason "Duplicate name"
│  │
│  └─ ... continue for remaining areas
│
└─ Return { created, skipped }

                    │
                    ▼

REPOSITORY (AreaRepository.createBatch)
├─ Get database connection
├─ BEGIN TRANSACTION (all-or-nothing)
│
├─ Loop and execute INSERTs:
│  ├─ INSERT area 1
│  ├─ INSERT area 2
│  └─ ... all areas
│
├─ COMMIT TRANSACTION
│  └─ All inserts succeed atomically
│
└─ Return created entities

Benefits of Batch vs Individual:
├─ Speed: 1 transaction vs 3 transactions
├─ Consistency: All or nothing (ACID compliance)
├─ Network: Fewer database round-trips
└─ Performance: ~5-10x faster for large batches

RESPONSE (HTTP 207 Multi-Status)
{
  "success": true,
  "data": {
    "created": [
      { id: "uuid1", name: "North", ... },
      { id: "uuid2", name: "East", ... }
    ],
    "skipped": [
      { name: "North", reason: "Duplicate name" }
    ]
  },
  "summary": {
    "total": 3,
    "created": 2,
    "skipped": 1
  }
}
```

### Bulk Delete

```
DELETE /api/areas/bulk/delete
{
  "ids": ["area-uuid-1", "area-uuid-2", "area-uuid-3"]
}
```

#### Data Flow:

```
REQUEST: Array of 3 IDs

                    │
                    ▼

CONTROLLER (AreaController.deleteBulkAreas)
├─ Extract IDs from request.body
├─ Validate: ids is array and not empty ✓
└─ Call areaService.deleteBulkAreas(ids)

                    │
                    ▼

SERVICE (AreaService.deleteBulkAreas)
├─ Validate all areas exist:
│  ├─ For each ID:
│  │  └─ Call getAreaById(id)
│  │     └─ Throws NotFoundException if not found
│  │
│  ├─ If any not found: STOP, return 404
│  └─ All exist: proceed
│
└─ Call areaRepository.deleteByIds(ids)

                    │
                    ▼

REPOSITORY (AreaRepository.deleteByIds)
├─ Build dynamic SQL IN clause:
│  SQL: UPDATE areas
│       SET status = 'archived',
│           updated_at = ?
│       WHERE id IN (?, ?, ?)
│
│  Parameters: ["2024-01-15T10:50:00Z", "area-uuid-1", "area-uuid-2", "area-uuid-3"]
│
├─ Execute single UPDATE:
│  └─ Database updates 3 rows (changes = 3)
│
└─ Return number of affected rows

Efficiency:
├─ 1 SQL query for multiple deletions
├─ vs. 3 separate DELETE queries
├─ Database can optimize IN clause execution
└─ Much faster for large batches

DATABASE STATE:
Before: 3 active areas
After:  3 archived areas (status = 'archived')

                    │
                    ▼

RESPONSE (HTTP 200)
{
  "success": true,
  "data": {
    "deleted": 3
  },
  "message": "3 areas deleted successfully"
}
```

---

## 🔄 Data Transformation Journey

### Example: Create Area - Data Shape Changes

```
Step 1: HTTP Request Body (Raw JSON from client)
────────────────────────────────────────────
{
  "name": "North Region",
  "description": "Northern territories"
}
Type: Plain Object


Step 2: Controller Layer (Validated)
──────────────────────────────────────
{
  name: string ✓ (validated)
  description: string ✓ (trimmed)
}
Type: Object (TypeScript typed)


Step 3: Service Factory (Domain Entity Created)
───────────────────────────────────────────────
{
  id: "area-uuid-12345",                    ← Generated
  name: "North Region",
  description: "Northern territories",
  status: "active",                         ← Default
  createdAt: Date(2024-01-15T10:30:00Z),   ← Auto-set
  updatedAt: Date(2024-01-15T10:30:00Z)    ← Auto-set
}
Type: Area Entity (full domain model)


Step 4: Repository Layer (SQL Parameters)
──────────────────────────────────────────
INSERT INTO areas (id, name, description, status, created_at, updated_at)
VALUES (?, ?, ?, ?, ?, ?)

Parameters Array: [
  "area-uuid-12345",
  "North Region",
  "Northern territories",
  "active",
  "2024-01-15T10:30:00Z",
  "2024-01-15T10:30:00Z"
]
Type: Array (database parameters)


Step 5: Database (SQL Execution)
─────────────────────────────────
INSERT INTO areas (id, name, description, status, created_at, updated_at)
VALUES ('area-uuid-12345', 'North Region', 'Northern territories', 
        'active', '2024-01-15T10:30:00Z', '2024-01-15T10:30:00Z')

Database Table Row:
┌──────────────────┬─────────────────┬─────────────────────┬─────────┬──────────────────┬──────────────────┐
│ id               │ name            │ description         │ status  │ created_at       │ updated_at       │
├──────────────────┼─────────────────┼─────────────────────┼─────────┼──────────────────┼──────────────────┤
│ area-uuid-12345  │ North Region    │ Northern territories│ active  │ 2024-01-15...    │ 2024-01-15...    │
└──────────────────┴─────────────────┴─────────────────────┴─────────┴──────────────────┴──────────────────┘

Type: Database Row


Step 6: Repository Maps Back (Domain Entity)
──────────────────────────────────────────────
{
  id: "area-uuid-12345",
  name: "North Region",
  description: "Northern territories",
  status: "active",
  createdAt: new Date("2024-01-15T10:30:00Z"),
  updatedAt: new Date("2024-01-15T10:30:00Z")
}
Type: Area Entity


Step 7: Response to Client (JSON)
──────────────────────────────────
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
Type: HTTP Response (JSON)
```

---

## ⚠️ Error Handling Data Flow

### Example: Error in CREATE Operation

```
REQUEST: Create with missing required field

{
  "description": "Has description but NO name"
}

                    │
                    ▼

CONTROLLER Validation
├─ Check: req.body exists? ✓
├─ Check: req.body.name exists? ✗ FAIL
│
└─ Return Error Response:

    Status: 400 Bad Request
    {
      "success": false,
      "error": "Field 'name' is required and must be a string"
    }

                    (STOPS HERE - Never reaches Service)


REQUEST: Duplicate Name Error

{
  "name": "North Region"  ← Already exists in DB
}

                    │
                    ▼

CONTROLLER: ✓ Passes validation

                    │
                    ▼

SERVICE: Check duplicate
├─ Query: SELECT * FROM areas WHERE LOWER(name) = LOWER(?)
├─ Result: Found existing area ✗
│
└─ throw new Error("Area name already exists")

                    │
                    ▼

ERROR MIDDLEWARE (error.middleware.ts)
├─ Catch the error
├─ Determine status code: 409 Conflict (duplicate resource)
├─ Log error: "Area name already exists"
│
└─ Return Error Response:

    Status: 409 Conflict
    {
      "success": false,
      "error": "Area name already exists",
      "code": "DUPLICATE_RESOURCE"
    }


REQUEST: Database Connection Error

                    │
                    ▼

REPOSITORY: Attempt database operation
├─ Get connection: fails (DB unavailable)
│
└─ throw new Error("Database connection failed")

                    │
                    ▼

ERROR MIDDLEWARE
├─ Catch unknown error
├─ Status code: 500 Internal Server Error
├─ Log with stack trace (for debugging)
│
└─ Return Error Response:

    Status: 500 Internal Server Error
    {
      "success": false,
      "error": "Internal server error",
      "code": "DATABASE_ERROR"
    }
    (Don't expose internal details to client for security)
```

---

## 📊 Performance & Optimization Notes

### Query Optimization

```
INEFFICIENT (N+1 Query Problem):
─────────────────────────────────
for each area in areas:
  area.projects = queryDatabase("SELECT * FROM projects WHERE area_id = ?")
Result: 1 query (get areas) + 100 queries (get projects for each) = 101 total


EFFICIENT (Batch Loading):
──────────────────────────
areas = queryDatabase("SELECT * FROM areas")
projects = queryDatabase("SELECT * FROM projects WHERE area_id IN (?, ?, ...)")
Result: 2 queries regardless of area count


OPTIMAL (Database Join):
────────────────────────
SELECT a.*, COUNT(p.id) as project_count
FROM areas a
LEFT JOIN projects p ON a.id = p.area_id
GROUP BY a.id
Result: 1 query with all needed data
```

### Caching Opportunities

```
GET /api/areas
├─ Cache-Control: public, max-age=3600
├─ Browser caches for 1 hour (areas rarely change)
├─ Reduces server load
└─ Improves perceived performance

DELETE /api/areas/uuid
├─ Clear cache after deletion
└─ Ensures fresh data on next request
```

---

## 🔐 Data Validation & Security

### SQL Injection Prevention

```
❌ UNSAFE (String concatenation):
──────────────────────────────────
sql = "SELECT * FROM areas WHERE name = '" + name + "'"
If name = "'; DROP TABLE areas; --"
Result: Query gets mutated and table deleted!


✅ SAFE (Parameterized Queries):
────────────────────────────────
sql = "SELECT * FROM areas WHERE name = ?"
parameters = [name]
Database driver escapes parameters automatically
Result: Name treated as data, never executed as SQL
```

### Input Validation

```
POST /api/areas
{
  "name": "North Region",
  "description": "Northern territories"
}

VALIDATION RULES:
├─ name: required, string, 1-100 characters, trim whitespace
├─ description: optional, string, max 500 characters
├─ Invalid: null, undefined, too long, wrong type
└─ Result: 400 Bad Request with validation error
```

---

## 📝 Summary Table: All Operations at a Glance

| Operation | HTTP Method | URL | Input | Database Query | Output | Status |
|-----------|------------|-----|-------|----------------|--------|--------|
| **Create** | POST | /api/areas | JSON body | INSERT INTO | 201 Created | 201 |
| **Read All** | GET | /api/areas | Query params | SELECT DISTINCT | 200 OK | 200 |
| **Read One** | GET | /api/areas/:id | URL param | SELECT WHERE id | 200 OK | 200 |
| **Update** | PATCH | /api/areas/:id | JSON body | UPDATE WHERE id | 200 OK | 200 |
| **Delete** | DELETE | /api/areas/:id | URL param | UPDATE status | 204 No Content | 204 |
| **Bulk Create** | POST | /api/areas/bulk/create | JSON array | INSERT BATCH | 207 Multi | 207 |
| **Bulk Delete** | DELETE | /api/areas/bulk/delete | JSON ids | UPDATE IN () | 200 OK | 200 |

---

## 🔗 Related Documentation

- [ARCHITECTURE_OVERVIEW.md](ARCHITECTURE_OVERVIEW.md) - Overall system design
- [SERVICE_ANNOTATED.md](SERVICE_ANNOTATED.md) - Service layer details
- [REPOSITORY_ANNOTATED.md](REPOSITORY_ANNOTATED.md) - Repository pattern
- [CONTROLLER_ANNOTATED.md](CONTROLLER_ANNOTATED.md) - HTTP handling
