# Project Repository - Detailed Annotation

## Data Access Layer & Database Queries

---

## 📋 File Overview

**File**: `backend/src/infrastructure/repositories/project.repository.ts`
**Layer**: Infrastructure (Data Access)
**Pattern**: Repository Pattern with Parameterized Queries
**Responsibility**: Handle all project database operations

---

## 🎯 Repository Purpose

| What | Why | Where |
|------|-----|-------|
| **Build Queries** | Construct SQL safely | Parameterized queries prevent injection |
| **Execute** | Run against database | SQLite via sql.js |
| **Transform** | Convert to domain entities | Rows → Entities |
| **Pagination** | Calculate limits/offsets | Handle page math |
| **Filtering** | Build WHERE clauses | Dynamic based on params |

---

## 📦 Imports & Interfaces

```typescript
import { 
  IProjectRepository,  // Interface to implement
  ProjectQueryParams,  // Query parameters type
  PaginatedResult      // Return type for paginated queries
} from '../../domain/repositories';
// └─ Repository interface and types from domain layer
```

```typescript
import { Project, createProject } from '../../domain/entities';
// └─ Domain entity and factory function
```

```typescript
import { databaseConnection, queryAll, queryOne } from '../database';
// ├─ Singleton database connection
// ├─ queryAll: Execute query, return all results
// └─ queryOne: Execute query, return first result
```

---

## 🏗️ Database Row Interface

```typescript
interface ProjectRow {
  project_id?: string;           // Optional: null until saved
  project_name: string;          // Required
  project_start: string;         // Required: ISO date string
  project_end: string;           // Required: ISO date string
  company_name: string;          // Required
  description: string | null;    // Optional: could be null
  project_value: number;         // Required
  area: string;                  // Required
}
// └─ Represents raw database row (snake_case)
// └─ Different from domain entity (camelCase)
```

---

## 📊 Class Definition

```typescript
export class ProjectRepository implements IProjectRepository {
// ├─ Implements repository interface (contract)
// ├─ Must implement: findAll() and findById()
// └─ Both async (database is asynchronous)
```

---

## 🔍 Method 1: Find All Projects with Filtering

### Purpose
Get projects with optional area/keyword/company filters and pagination

### Method Signature

```typescript
async findAll(params: ProjectQueryParams): Promise<PaginatedResult<Project>> {
// ├─ Input: Query parameters (filters + pagination)
// ├─ Output: Projects array + pagination metadata
// └─ Both wrapped in PaginatedResult type
```

---

## Step 1️⃣: Get Database Connection

```typescript
const db = await databaseConnection.getConnection();
// ├─ Get singleton database connection
// ├─ Singleton: same instance reused
// ├─ Connection cached after first use
// └─ Await in case initialization still pending
```

---

## Step 2️⃣: Destructure Parameters

```typescript
const { area, keyword, company, page, perPage } = params;
// └─ Extract all filter and pagination parameters
```

---

## Step 3️⃣: Build Base SQL Query

```typescript
let baseQuery = `
  SELECT DISTINCT
    p.project_name,        -- Selected from projects table
    p.project_start,
    p.project_end,
    c.company_name,        -- Selected from companies table (JOIN)
    p.description,
    p.project_value,
    pam.area               -- Selected from project_area_map (JOIN)
  FROM projects p
  INNER JOIN companies c ON p.company_id = c.company_id
  INNER JOIN project_area_map pam ON p.project_id = pam.project_id
`;
// ├─ DISTINCT: project can have multiple areas (prevent duplicates)
// ├─ INNER JOIN: only get projects with valid company and area
// └─ SELECT: specific columns needed for response
```

**Why INNER JOINs?**
```
INNER JOIN = Strict matching
- Only projects that have a company ✅
- Only projects that have an area ✅
- Prevents orphaned records ✅
```

---

## Step 4️⃣: Build Dynamic WHERE Clause

```typescript
const conditions: string[] = [];        // Store WHERE conditions
const queryParams: (string | number)[] = [];  // Store parameter values
```

### Filter 1: By Area

```typescript
if (area) {
  conditions.push('pam.area = ?');  // Add condition
  queryParams.push(area);            // Add parameter value
}
// ├─ ? is placeholder for parameter
// ├─ Prevents SQL injection
// └─ Only added if area filter provided
```

### Filter 2: By Keyword

```typescript
if (keyword) {
  conditions.push('p.project_name LIKE ?');
  queryParams.push(`%${keyword}%`);  // Wildcards for partial match
}
// ├─ LIKE: partial string matching
// ├─ %: wildcard (matches any characters)
// └─ %keyword%: matches "keyword" anywhere in string
```

### Filter 3: By Company

```typescript
if (company) {
  conditions.push('c.company_name = ?');
  queryParams.push(company);
}
// └─ Exact match on company name
```

### Combine Conditions

```typescript
if (conditions.length > 0) {
  baseQuery += ' WHERE ' + conditions.join(' AND ');
}
// ├─ Add WHERE clause only if conditions exist
// ├─ Join multiple conditions with AND
// ├─ Example: WHERE area = ? AND project_name LIKE ?
// └─ Keeps query clean if no filters
```

---

## Step 5️⃣: Add Sorting

```typescript
baseQuery += ' ORDER BY p.project_name ASC, pam.area ASC';
// ├─ Sort by project name alphabetically (ascending)
// ├─ Then by area (tiebreaker)
// ├─ Ensures consistent results across requests
// └─ Important for pagination consistency
```

**Why Sorting Matters for Pagination?**
```
Without sorting:
  Page 1: [C, A, B]
  Page 2: [B, C, A]  ❌ Different order!

With sorting:
  Page 1: [A, B, C]
  Page 2: [A, B, C]  ✅ Consistent!
```

---

## Step 6️⃣: Handle Pagination

### Step 6a: Count Total Items

```typescript
if (page !== undefined && perPage !== undefined) {
  // └─ Only if pagination requested
  
  const countQuery = `
    SELECT COUNT(*) as total FROM (
      SELECT DISTINCT p.project_id, pam.area
      FROM projects p
      INNER JOIN companies c ON p.company_id = c.company_id
      INNER JOIN project_area_map pam ON p.project_id = pam.project_id
      ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''}
    )
  `;
  // ├─ Count total matching items
  // ├─ Uses same filters as main query
  // └─ Needed for pagination metadata
  
  const countResult = queryOne<{ total: number }>(db, countQuery, queryParams);
  const totalItems = countResult?.total ?? 0;
  // ├─ Get count result
  // ├─ ?? 0: default to 0 if null
  // └─ totalItems = number of results
```

### Step 6b: Calculate Pagination Math

```typescript
  const totalPages = Math.ceil(totalItems / perPage);
  // ├─ totalPages = ceiling(45 / 10) = 5
  // ├─ If 45 items, 10 per page = 5 full pages
  // └─ Last page might have fewer items
  
  const offset = (page - 1) * perPage;
  // ├─ offset = (1 - 1) * 10 = 0 (start from row 0)
  // ├─ offset = (2 - 1) * 10 = 10 (start from row 10)
  // └─ OFFSET tells SQL where to start
```

### Step 6c: Execute Paginated Query

```typescript
  const paginatedQuery = baseQuery + ` LIMIT ? OFFSET ?`;
  // ├─ LIMIT 10: return maximum 10 rows
  // ├─ OFFSET 0: start from row 0
  // └─ Together: return rows 0-9 (first page)
  
  const paginationParams = [...queryParams, perPage, offset];
  // └─ Add LIMIT and OFFSET values to params
  
  const rows = queryAll<ProjectRow>(db, paginatedQuery, paginationParams);
  // └─ Execute query, get results as ProjectRow array
```

### Step 6d: Return Paginated Result

```typescript
  return {
    items: rows.map(createProject),  // Transform to entities
    pagination: {
      currentPage: page,
      perPage,
      totalItems,
      totalPages,
      hasNext: page < totalPages,    // true if more pages
      hasPrev: page > 1              // true if not first page
    }
  };
}
```

---

## Step 7️⃣: Return Non-Paginated Result (if applicable)

```typescript
// If pagination NOT requested (page/perPage undefined)
const rows = queryAll<ProjectRow>(db, baseQuery, queryParams);

return {
  items: rows.map(createProject),
  pagination: null  // No pagination info
};
```

---

## 🔍 Method 2: Find Project by ID

### Purpose
Get specific project by ID (can have multiple areas)

### Method Signature

```typescript
async findById(projectId: string): Promise<Project[] | null> {
// ├─ Input: Project ID to search for
// ├─ Output: Array of Projects or null
// └─ Returns null if project not found
```

---

## Step 1️⃣: Build Query

```typescript
const query = `
  SELECT
    p.project_id,         -- Include ID in results (needed for response)
    p.project_name,
    p.project_start,
    p.project_end,
    c.company_name,
    p.description,
    p.project_value,
    pam.area              -- Can have multiple rows (multiple areas)
  FROM projects p
  INNER JOIN companies c ON p.company_id = c.company_id
  INNER JOIN project_area_map pam ON p.project_id = pam.project_id
  WHERE p.project_id = ?  -- Filter by project ID
`;
```

**Why Multiple Rows?**
```
Project "Downtown Office" is in areas: London, City, East End
SELECT returns 3 rows:
  Row 1: ID=123, name="Downtown Office", area="London"
  Row 2: ID=123, name="Downtown Office", area="City"
  Row 3: ID=123, name="Downtown Office", area="East End"
```

---

## Step 2️⃣: Execute Query

```typescript
const rows = queryAll<ProjectRow>(db, query, [projectId]);
// ├─ Execute query with project ID as parameter
// ├─ Returns all matching rows (could be 0, 1, or many)
// └─ Each row: project data with one area
```

---

## Step 3️⃣: Check if Found

```typescript
if (rows.length === 0) {
  return null;
  // ├─ No rows returned = project not found
  // ├─ Service will throw NotFoundException
  // └─ Controller will pass to error handler
}
```

---

## Step 4️⃣: Transform & Return

```typescript
return rows.map(createProject);
// ├─ Transform each database row to entity
// ├─ Array of Project entities
// └─ Service will format and return
```

---

## 🔄 Data Transformation

### Database Row → Domain Entity

```typescript
const row = {
  project_id: "proj-123",        (database format)
  project_name: "Downtown Office",
  project_start: "2023-01-01",
  project_end: "2024-12-31",
  company_name: "Acme Corp",
  description: "New office complex",
  project_value: 50000,
  area: "London"
};

createProject(row) → {
  projectId: "proj-123",         (entity format)
  projectName: "Downtown Office",
  projectStart: "2023-01-01",
  projectEnd: "2024-12-31",
  company: "Acme Corp",
  description: "New office complex",
  projectValue: 50000,
  area: "London"
};
```

---

## 🛡️ Security: Parameterized Queries

### Why Parameterized Queries?

```
UNSAFE (SQL Injection vulnerability):
  const query = `WHERE name = '${userInput}'`;
  userInput = "'; DROP TABLE projects; --"
  Result: WHERE name = ''; DROP TABLE projects; --'
  ❌ Drops entire table!

SAFE (Parameterized):
  const query = `WHERE name = ?`;
  queryParams = [userInput];
  ❌ Malicious input treated as literal string, not SQL
  ✅ Safe!
```

---

## 📊 Complete Query Example

### Request
```
GET /api/projects?area=London&keyword=office&page=1&per_page=10
```

### Repository Builds

```typescript
// Base query:
SELECT DISTINCT p.project_name, ...
FROM projects p
INNER JOIN ...

// Conditions added:
WHERE pam.area = ? AND p.project_name LIKE ?

// Parameters:
["London", "%office%", 10, 0]
              ↑         ↑  ↑
            area     perPage offset

// Final query:
SELECT DISTINCT ... FROM ... WHERE area=? AND name LIKE ?
LIMIT 10 OFFSET 0

// Result:
[
  { project_name: "Downtown Office", area: "London", ... },
  { project_name: "City Office Complex", area: "London", ... },
  ...10 items total...
]
```

---

## ✅ Checklist: Repository Implementation

- ✅ Implements IProjectRepository interface
- ✅ Uses parameterized queries (SQL injection safe)
- ✅ Transforms database rows to domain entities
- ✅ Handles all filters (area, keyword, company)
- ✅ Implements pagination (limit, offset, count)
- ✅ Returns consistent, sorted results
- ✅ Uses INNER JOINs for data integrity

---

## 💡 Interview Insights

**Question**: "Why use repositories?"

**Answer**: "Repositories abstract data access behind an interface. This lets us change database implementation (SQLite → PostgreSQL) without changing business logic. Plus, it centralizes SQL queries in one place, making them easier to optimize and secure."

**Question**: "Why parameterized queries?"

**Answer**: "Parameterized queries prevent SQL injection attacks. Instead of interpolating user input into the query string, we use placeholders (?) and pass values separately. The database driver treats the values as data, never as SQL code."

---
