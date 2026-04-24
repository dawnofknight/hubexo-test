# CRUD Architecture Patterns & Design Decisions

Deep dive into the architectural patterns, data transformations, and design decisions behind the CRUD implementation.

---

## 🏗️ Architecture Pattern: Clean Architecture Applied to CRUD

### The Layered Approach

```
┌─────────────────────────────────────────────────────────────────┐
│ PRESENTATION LAYER (HTTP Interface)                             │
│ ├─ Controllers: Handle HTTP requests/responses                 │
│ ├─ Routes: Map URLs to controllers                              │
│ ├─ Middleware: Validate inputs, error handling                  │
│ └─ DTOs: Shape data for API consumers                           │
├─ Responsibility: Convert HTTP ↔ internal data formats          │
├─ Doesn't know: Database, business rules                         │
└─ Example: createArea(req, res) extracts body → calls service   │
└─────────────────────────────────────────────────────────────────┘
                             │
           Request Data Flow │ Response Data Flow
           (down)            │ (up)
                             │
┌─────────────────────────────────────────────────────────────────┐
│ APPLICATION LAYER (Use Cases & Business Logic)                  │
│ ├─ Services: Orchestrate domain logic                           │
│ ├─ DTOs: Internal data transfer objects                         │
│ ├─ Mappers: Transform between entities and DTOs                 │
│ └─ Validators: Business rule validation                         │
├─ Responsibility: "What to do" (use cases)                       │
├─ Doesn't know: HTTP, Database details                           │
└─ Example: validateDuplicate(), checkReferences()                │
└─────────────────────────────────────────────────────────────────┘
                             │
           Entity Data Flow  │ Entity Data Flow
           (down)            │ (up)
                             │
┌─────────────────────────────────────────────────────────────────┐
│ DOMAIN LAYER (Business Rules & Entities)                        │
│ ├─ Entities: Core domain models                                 │
│ ├─ Interfaces: Repository contracts                             │
│ ├─ Exceptions: Domain-specific errors                           │
│ ├─ Value Objects: Immutable domain concepts                     │
│ └─ Factories: Entity creation with validation                   │
├─ Responsibility: "What is true" (business rules)                │
├─ Doesn't know: HTTP, Database, Framework                        │
└─ Example: Area entity, IAreaRepository interface                │
└─────────────────────────────────────────────────────────────────┘
                             │
           SQL Parameters    │ Database Rows
           (down)            │ (up)
                             │
┌─────────────────────────────────────────────────────────────────┐
│ INFRASTRUCTURE LAYER (Database & External Services)             │
│ ├─ Repositories: Implement repository interfaces                │
│ ├─ Database: Connection management, queries                     │
│ ├─ Mappers: Convert rows ↔ entities                             │
│ └─ Cache: Optional caching layer                                │
├─ Responsibility: "How to do it" (technical implementation)      │
├─ Doesn't know: Use cases, HTTP                                  │
└─ Example: AreaRepository SQL queries                            │
└─────────────────────────────────────────────────────────────────┘
                             │
                    [Database/Storage]
```

### Why This Layering?

| Benefit | Reason |
|---------|--------|
| **Testability** | Each layer can be tested independently with mocks |
| **Maintainability** | Clear responsibility = easy to locate bugs |
| **Flexibility** | Swap implementations without changing layers above |
| **Scalability** | Add features without modifying existing code |
| **Reusability** | Services can be used by multiple controllers |

---

## 🔄 Data Transformation Flow: CREATE Operation

### Journey of Data Through Layers

```
STAGE 1: Client Layer (JavaScript/Browser)
──────────────────────────────────────────
Data Type: Plain JavaScript Object

{
  name: "North Region",
  description: "Northern territories"
}

Why this format?
├─ JSON is universal (all languages understand it)
├─ Human-readable for debugging
└─ Easy to validate in TypeScript

                    │ JSON.stringify()
                    │ HTTP POST body
                    ▼


STAGE 2: Presentation Layer (Express Controller)
─────────────────────────────────────────────────
Data Type: Typed TypeScript Object

req.body:
{
  name: "North Region",
  description: "Northern territories"
}

Transformations applied:
├─ JSON parsed by Express body parser
├─ Type validated (string checks)
├─ Whitespace trimmed
└─ Default values set if missing

Why validate here?
├─ Fail fast on client errors (return 400)
├─ Prevent invalid data from reaching business logic
└─ Provide user-friendly error messages

                    │ call service.createArea()
                    │ pass validated data
                    ▼


STAGE 3: Application Layer (Service)
────────────────────────────────────
Data Type: Domain Entity (Business Object)

service.createArea() produces:
{
  id: "area-uuid-12345",
  name: "North Region",
  description: "Northern territories",
  status: "active",
  createdAt: Date(2024-01-15T10:30:00Z),
  updatedAt: Date(2024-01-15T10:30:00Z)
}

Transformations applied:
├─ Check for duplicates (business rule)
├─ Generate unique ID
├─ Set default status
├─ Record creation timestamps
└─ Apply domain logic

Why create entity here?
├─ Encapsulates domain rules
├─ Business logic in one place (DRY)
├─ Can be reused by multiple services
└─ Types enforce correctness

                    │ call repository.create()
                    │ pass complete entity
                    ▼


STAGE 4: Infrastructure Layer (Repository)
──────────────────────────────────────────
Data Type: SQL Parameters (Database-specific)

SQL Statement:
INSERT INTO areas (id, name, description, status, created_at, updated_at)
VALUES (?, ?, ?, ?, ?, ?)

Parameters Array:
[
  "area-uuid-12345",
  "North Region",
  "Northern territories",
  "active",
  "2024-01-15T10:30:00Z",
  "2024-01-15T10:30:00Z"
]

Transformations applied:
├─ Convert entity → SQL statement
├─ Extract values in correct order
├─ Format dates as ISO strings
├─ Use parameterized queries (safety!)
└─ Handle null/undefined properly

Why parameterized queries?
├─ Prevent SQL injection attacks
├─ Database optimizes compiled queries
└─ Values treated as data, never code

                    │ execute INSERT
                    │ return created
                    ▼


STAGE 5: Database
─────────────────
Data Type: Persisted Row (SQLite table)

Table: areas
┌─────────────────┬─────────────┬─────────────────┬──────────┬───────────┬───────────┐
│ id              │ name        │ description     │ status   │created_at │updated_at │
├─────────────────┼─────────────┼─────────────────┼──────────┼───────────┼───────────┤
│ area-uuid-12345 │ North Re... │ Northern te...  │ active   │2024-01-15 │2024-01-15 │
└─────────────────┴─────────────┴─────────────────┴──────────┴───────────┴───────────┘

Data stored:
├─ Permanent state (until deleted)
├─ Indexed for fast queries
└─ Enforces constraints (unique, not null)

                    │ return result
                    │ map back to entity
                    ▼


STAGE 6: Back Up Through Layers
──────────────────────────────
Repository → Entity
{
  id: "area-uuid-12345",
  name: "North Region",
  description: "Northern territories",
  status: "active",
  createdAt: Date(2024-01-15T10:30:00Z),
  updatedAt: Date(2024-01-15T10:30:00Z)
}

Service → Same entity
(Service doesn't transform, just returns)

Controller → Response DTO
{
  success: true,
  data: {
    id: "area-uuid-12345",
    name: "North Region",
    description: "Northern territories",
    status: "active",
    createdAt: "2024-01-15T10:30:00Z",  ← Date as ISO string
    updatedAt: "2024-01-15T10:30:00Z"
  },
  message: "Area created successfully"
}

                    │ JSON.stringify()
                    │ HTTP response
                    ▼


STAGE 7: Back to Client
──────────────────────
Data Type: JSON String (transmitted over HTTP)

HTTP Response Body:
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

JavaScript parses response:
JSON.parse(responseBody) → plain object
Client can use data:
├─ Update UI with new area
├─ Redirect to edit page
└─ Add to dropdown list
```

### Why So Many Transformations?

```
Benefit of transformations at each layer:

INPUT VALIDATION (Controller)
└─ Fail fast on client errors
  └─ User knows immediately if data is wrong
  └─ No wasted database resources

BUSINESS LOGIC (Service)
└─ Enforce rules consistently
  └─ Same rules applied everywhere
  └─ Easy to test independently

DATABASE SAFETY (Repository)
└─ Parameterized queries prevent injection
  └─ Type conversion to database types
  └─ Handle edge cases (nulls, large numbers)

OUTPUT FORMATTING (Controller)
└─ Consistent API responses
  └─ Hide internal implementation
  └─ Control what data is exposed
```

---

## 📊 Dependency Inversion Principle in Action

### Problem: Tight Coupling

```typescript
// ❌ BAD: Service tightly coupled to specific repository
export class AreaService {
  private areaRepository = new AreaRepository(); // Concrete class!

  async createArea(name: string) {
    const duplicate = await this.areaRepository.findByName(name);
    // ...
  }
}

Why bad?
├─ Can't swap repository (tightly coupled)
├─ Can't test with mock repository
├─ AreaService depends on database technology (SQLite)
├─ Hard to migrate to PostgreSQL later
└─ Violates Dependency Inversion Principle
```

### Solution: Dependency Injection

```typescript
// ✅ GOOD: Service depends on abstraction (interface)
export class AreaService {
  constructor(private readonly areaRepository: IAreaRepository) {
    // Repository injected as dependency
  }

  async createArea(name: string) {
    const duplicate = await this.areaRepository.findByName(name);
    // ...
  }
}

Why good?
├─ Can inject ANY repository (swappable)
├─ Can inject mock for testing
├─ Service doesn't know database type
├─ Easy to migrate databases
└─ Follows Dependency Inversion Principle

// Usage in container.ts (Dependency Injection Container)
const areaRepository = new AreaRepository();
const areaService = new AreaService(areaRepository);

// For testing
const mockRepository: IAreaRepository = {
  findByName: jest.fn(),
  findById: jest.fn(),
  // ...
};
const testService = new AreaService(mockRepository);
```

### Data Flow with Dependency Injection

```
┌─────────────────────────────────────────┐
│ Container (bootstrap.ts)                │
│ Wires up all dependencies               │
├─────────────────────────────────────────┤
│ const db = new Database()               │
│ const repo = new AreaRepository(db)     │
│ const service = new AreaService(repo)   │
│ const controller = new AreaController   │
│                             (service)   │
└─────────────────────────────────────────┘
                    │
                    │ Injects
                    │
                    ▼
        ┌───────────────────┐
        │ AreaController    │
        ├───────────────────┤
        │ service: IService │ ← Interface reference
        └───────────────────┘
                    │
                    │ Uses
                    │
                    ▼
        ┌───────────────────┐
        │ AreaService       │
        ├───────────────────┤
        │ repo: IRepository │ ← Interface reference
        └───────────────────┘
                    │
                    │ Uses
                    │
                    ▼
        ┌───────────────────┐
        │ AreaRepository    │
        ├───────────────────┤
        │ Implements IRepo  │
        │ + database calls  │
        └───────────────────┘
```

---

## 🎯 SOLID Principles in CRUD

### S - Single Responsibility

```typescript
// ✓ GOOD: Each class has ONE reason to change
AreaController.createArea()
  └─ Only handles HTTP aspects
    └─ Validates HTTP parameters
    └─ Formats JSON response
    └─ Sets status codes

AreaService.createArea()
  └─ Only handles business logic
    └─ Check for duplicates
    └─ Trigger events
    └─ Log operations

AreaRepository.create()
  └─ Only handles data access
    └─ Build SQL
    └─ Execute query
    └─ Map results to entities

// If database changes from SQLite to PostgreSQL:
// - Only Repository changes
// - Service and Controller unchanged

// If HTTP response format changes:
// - Only Controller changes
// - Service and Repository unchanged
```

### O - Open/Closed Principle

```typescript
// ✓ GOOD: Open for extension, closed for modification

// Need to add UPDATE operation?
// Don't modify existing code, extend it:

export class AreaService {
  // Existing READ operations
  async getAreaById(id: string): Promise<Area> { ... }
  async getAllAreas(): Promise<Area[]> { ... }

  // NEW: Add UPDATE without touching READ methods
  async updateArea(id: string, data: Partial<Area>): Promise<Area> {
    // Validate existing area exists
    // Check for business rule violations
    // Call repository
    // Return updated entity
  }

  // NEW: Add DELETE without touching existing
  async deleteArea(id: string): Promise<void> {
    // ...
  }
}

// Benefits:
// - Existing code stable (less bugs)
// - New code separate (easy to test)
// - No regression in old features
```

### L - Liskov Substitution

```typescript
// ✓ GOOD: Derived classes substitutable for base

interface IAreaRepository {
  create(area: Area): Promise<Area>;
  findById(id: string): Promise<Area | undefined>;
  update(id: string, data: Partial<Area>): Promise<Area>;
  delete(id: string): Promise<boolean>;
}

// Implementation 1: SQLite
export class SQLiteAreaRepository implements IAreaRepository {
  async create(area: Area): Promise<Area> {
    // SQLite-specific implementation
  }
  // ...
}

// Implementation 2: PostgreSQL
export class PostgresAreaRepository implements IAreaRepository {
  async create(area: Area): Promise<Area> {
    // PostgreSQL-specific implementation
  }
  // ...
}

// Implementation 3: Mock (for testing)
export class MockAreaRepository implements IAreaRepository {
  async create(area: Area): Promise<Area> {
    // In-memory mock
  }
  // ...
}

// Usage: Can use ANY implementation
const repo: IAreaRepository = 
  new SQLiteAreaRepository();

const service = new AreaService(repo);

// Later: Switch to PostgreSQL
const repo: IAreaRepository = 
  new PostgresAreaRepository();

const service = new AreaService(repo);
// No changes to service!
```

### I - Interface Segregation

```typescript
// ❌ BAD: One fat interface with everything
interface IBadRepository {
  create(): Promise<Area>;
  read(): Promise<Area>;
  update(): Promise<Area>;
  delete(): Promise<Area>;
  createBatch(): Promise<Area[]>;
  deleteBatch(): Promise<boolean>;
  paginate(): Promise<PaginatedArea>;
  search(): Promise<Area[]>;
  // ... 20 more methods
}

// Problem: Class must implement ALL methods
// Some clients only need create(), not search()

// ✓ GOOD: Segregate into focused interfaces
interface ICreateRepository {
  create(area: Area): Promise<Area>;
}

interface IReadRepository {
  findById(id: string): Promise<Area | undefined>;
  findAll(): Promise<Area[]>;
}

interface IUpdateRepository {
  update(id: string, data: Partial<Area>): Promise<Area>;
}

interface IDeleteRepository {
  delete(id: string): Promise<boolean>;
}

// Client only implements what it needs
export class CreateAreaService {
  constructor(
    private repo: ICreateRepository & IReadRepository
  ) {}
}

export class QueryAreaService {
  constructor(
    private repo: IReadRepository
  ) {}
}
```

### D - Dependency Inversion

```typescript
// ❌ BAD: High-level depends on low-level
// (violates dependency inversion)
export class AreaService {
  private repo = new AreaRepository(); // Concrete!
  
  async createArea(data: any) {
    return this.repo.create(data);
  }
}

// Problem:
// AreaService (high-level) depends on
// AreaRepository (low-level, implementation detail)
// If AreaRepository changes, AreaService breaks

// ✓ GOOD: Both depend on abstraction
export interface IAreaRepository {
  create(area: Area): Promise<Area>;
}

export class AreaService {
  constructor(private repo: IAreaRepository) {}
  
  async createArea(data: any) {
    return this.repo.create(data);
  }
}

export class AreaRepository implements IAreaRepository {
  async create(area: Area): Promise<Area> {
    // Implementation
  }
}

// Now:
// AreaService (high-level) depends on
// IAreaRepository (abstraction)
// AreaRepository (low-level) implements
// IAreaRepository (abstraction)
// Both depend on same abstraction!

// Result: Can swap AreaRepository without
// affecting AreaService
```

---

## 🔍 Request/Response Cycle Deep Dive

### CREATE Request Cycle

```
REQUEST ARRIVES
    │
    ▼
Express Body Parser
    │
    ├─ Parse JSON
    ├─ Validate Content-Type
    └─ Result: req.body object
    │
    ▼
Validation Middleware
    │
    ├─ Check required fields exist
    ├─ Validate field types
    └─ Return 400 if invalid
    │
    ▼
Route Matching
    │
    ├─ Match POST /api/areas
    └─ Call controller.createArea()
    │
    ▼
Controller
    │
    ├─ Extract from req.body
    ├─ Sanitize (trim, lowercase)
    ├─ Call service.createArea()
    ├─ Handle service errors
    └─ Format response
    │
    ▼
Service
    │
    ├─ Load existing for duplicate check
    │  └─ Call repo.findByName()
    │  └─ Get result from database
    │  └─ Check if exists
    ├─ Create entity (factory function)
    │  ├─ Generate ID
    │  ├─ Set defaults
    │  ├─ Validate business rules
    │  └─ Create complete object
    ├─ Call repo.create()
    └─ Return created entity
    │
    ▼
Repository (Create Operation)
    │
    ├─ Build SQL parameters array
    ├─ Execute INSERT query
    ├─ Map result to entity
    └─ Return complete entity
    │
    ▼
Back to Service
    │
    ├─ Emit event (if configured)
    └─ Return entity
    │
    ▼
Back to Controller
    │
    ├─ Wrap in response DTO
    ├─ Set status code (201)
    ├─ Set Location header
    ├─ res.json(response)
    └─ Express serializes to JSON
    │
    ▼
HTTP Response Sent to Client
```

### Error Handling Cycle (Duplicate Error Example)

```
REQUEST: createArea with duplicate name "North"
    │
    ▼
Controller validates name exists? ✓ (Controller only checks syntax)
    │
    ▼
Service checks duplicate
    │
    ├─ Query: SELECT * FROM areas WHERE name = ?
    ├─ Result: Found existing area ✗
    │
    └─ throw new Error("Area name already exists")
    │
    ▼
Error NOT caught in Service
    │ (Service doesn't handle this specific error)
    │
    ▼
Error bubbles to Controller
    │
    ├─ Controller catch block:
    │  └─ next(error) → passes to error middleware
    │
    ▼
Error Middleware (express middleware)
    │
    ├─ Catch all errors
    ├─ Inspect error type/message
    ├─ Determine HTTP status code
    │  ├─ "already exists" → 409 Conflict
    │  ├─ "not found" → 404 Not Found
    │  └─ other → 500 Internal Server Error
    ├─ Log error (for debugging)
    ├─ Format error response
    │
    └─ res.status(409).json({
         "success": false,
         "error": "Area name already exists",
         "code": "DUPLICATE_RESOURCE"
       })
    │
    ▼
HTTP Response Sent to Client (409 Conflict)
```

---

## 🗄️ Database Schema Alignment

### How Entity Maps to Database

```typescript
// TypeScript Entity (camelCase, TS types)
export interface Area {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

// Database Schema (snake_case, SQL types)
CREATE TABLE areas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  status TEXT CHECK(status IN ('active', 'archived')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT,
  updated_by TEXT
);

// Mapping in Repository
class AreaRepository {
  private mapRowToEntity(row: any): Area {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      status: row.status,
      createdAt: new Date(row.created_at),    // ← String to Date
      updatedAt: new Date(row.updated_at),    // ← String to Date
      createdBy: row.created_by,
      updatedBy: row.updated_by
    };
  }

  private mapEntityToRow(entity: Area): Record<string, any> {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      status: entity.status,
      created_at: entity.createdAt.toISOString(),  // ← Date to String
      updated_at: entity.updatedAt.toISOString(),  // ← Date to String
      created_by: entity.createdBy,
      updated_by: entity.updatedBy
    };
  }
}

// Why this mapping?
// 1. Database: Snake case (SQL convention)
// 2. TypeScript: Camel case (TS convention)
// 3. Dates: Strings in database (portable), Dates in TS (typed)
// 4. Enums: Strings in database (readable), Types in TS (safe)
// 5. Optional: NULL in database, undefined in TS
```

---

## 💾 Transaction Management for Bulk Operations

### Why Transactions Matter

```
SCENARIO: Creating 1000 areas in batch

Without Transaction:
├─ Area 1: INSERT ✓
├─ Area 2: INSERT ✓
├─ ...
├─ Area 500: INSERT ✓
├─ Area 501: Constraint violated ✗ (ERROR)
├─ Area 502-1000: Cancelled (connection dropped)
│
Result: Half created, half not created
Problem: Inconsistent state, hard to clean up

With Transaction:
├─ BEGIN TRANSACTION
├─ Area 1: INSERT ✓
├─ Area 2: INSERT ✓
├─ ...
├─ Area 500: INSERT ✓
├─ Area 501: Constraint violated ✗ (ERROR)
├─ ROLLBACK (undo all)
│
Result: All or nothing - database unchanged
Benefit: Consistency guaranteed

Implementation:
```typescript
async createBatch(areas: Area[]): Promise<Area[]> {
  const db = await databaseConnection.getConnection();
  
  db.exec('BEGIN TRANSACTION');
  
  try {
    const created: Area[] = [];
    
    for (const area of areas) {
      db.run(
        'INSERT INTO areas (...) VALUES (...)',
        [area.id, area.name, ...]
      );
      created.push(area);
    }
    
    db.exec('COMMIT');      // ← Persist changes
    return created;
  } catch (error) {
    db.exec('ROLLBACK');    // ← Undo all changes
    throw error;
  }
}
```

---

## 🔄 Idempotency & Repeated Requests

### Problem: Duplicate Requests

```
User creates area "North"
    │
    ├─ Request 1: POST /api/areas {name: "North"}
    │  └─ Area created, response sent
    │
    ├─ (Network delays, user doesn't see response)
    │
    ├─ User clicks "Create" again
    │
    └─ Request 2: POST /api/areas {name: "North"}
       └─ Duplicate name error!
       
Result: User frustrated, thinks it failed first time
```

### Solution: Idempotency Keys

```typescript
// Request with idempotency key
POST /api/areas
Idempotency-Key: "create-north-region-001"
{
  "name": "North Region"
}

// First request
├─ Create area ✓
├─ Store: idempotencyKey -> areaId
└─ Return: 201 Created

// Second request (same key)
├─ Check: have we seen this key?
├─ Yes: Return cached response (201 Created)
└─ Result: User gets same response instantly

Benefits:
├─ Safe to retry requests
├─ User can retry without duplicates
├─ Improves reliability
└─ Standard practice (Stripe, PayPal use this)
```

---

## 📈 Performance Considerations

### N+1 Query Problem

```
INEFFICIENT (N+1 Queries):
const areas = await areaRepository.findAll();
// Query 1: SELECT * FROM areas = 100 areas

for (const area of areas) {
  area.projects = await projectRepository.findByAreaId(area.id);
  // Queries 2-101: SELECT * FROM projects WHERE area_id = ?
}

Total: 1 + 100 = 101 queries ❌


EFFICIENT (Batch):
const areas = await areaRepository.findAll();
// Query 1: SELECT * FROM areas = 100 areas

const projects = await projectRepository.findByAreaIds(
  areas.map(a => a.id)
);
// Query 2: SELECT * FROM projects WHERE area_id IN (...)

Total: 2 queries ✓


OPTIMAL (Join):
const areaProjects = await query(`
  SELECT a.*, COUNT(p.id) as project_count
  FROM areas a
  LEFT JOIN projects p ON a.id = p.area_id
  GROUP BY a.id
`);

Total: 1 query ✓✓
```

### Caching Strategy

```
GET /api/areas?onlyActive=true
├─ First request:
│  ├─ Query database
│  ├─ Cache result for 1 hour
│  └─ Return result
│
└─ Subsequent requests (within 1 hour):
   ├─ Return cached result
   ├─ No database query
   └─ Response instant

Cache invalidation:
├─ POST /api/areas (create)
│  └─ Clear cache
│
├─ PATCH /api/areas/:id (update)
│  └─ Clear cache
│
└─ DELETE /api/areas/:id (delete)
   └─ Clear cache

Trade-off:
├─ Benefit: Faster responses
├─ Risk: Stale data (old for 1 hour)
├─ When: Use for read-heavy data (areas rarely change)
└─ Not: Use for real-time data (balances, transactions)
```

---

## 🧪 Testing Strategy

### Unit Test Example: Repository

```typescript
describe('AreaRepository.create', () => {
  it('should insert area into database', async () => {
    // Arrange
    const mockDb = {
      run: jest.fn()
    };
    const repository = new AreaRepository(mockDb);
    
    const area: Area = {
      id: 'test-id',
      name: 'North',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Act
    await repository.create(area);
    
    // Assert
    expect(mockDb.run).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO areas'),
      expect.arrayContaining(['test-id', 'North'])
    );
  });
});
```

### Integration Test Example: Service → Repository

```typescript
describe('AreaService.createArea', () => {
  it('should prevent duplicate names', async () => {
    // Arrange
    const repository = new MockAreaRepository();
    repository.areas = [
      { id: '1', name: 'North', status: 'active' }
    ];
    const service = new AreaService(repository);
    
    // Act & Assert
    await expect(
      service.createArea({ name: 'North' })
    ).rejects.toThrow('Area name already exists');
  });
});
```

### End-to-End Test Example: HTTP Request → Database

```typescript
describe('POST /api/areas', () => {
  it('should create area and return 201', async () => {
    // Act
    const response = await request(app)
      .post('/api/areas')
      .send({ name: 'North Region' });
    
    // Assert
    expect(response.status).toBe(201);
    expect(response.body.data.name).toBe('North Region');
    
    // Verify in database
    const area = await db.query(
      'SELECT * FROM areas WHERE name = ?',
      ['North Region']
    );
    expect(area).toBeDefined();
  });
});
```

---

## 📚 Related Documentation

- [CRUD_DATAFLOW.md](CRUD_DATAFLOW.md) - Detailed data flow for each operation
- [CRUD_API_REFERENCE.md](CRUD_API_REFERENCE.md) - API endpoints reference
- [ARCHITECTURE_OVERVIEW.md](ARCHITECTURE_OVERVIEW.md) - System architecture
- [SERVICE_ANNOTATED.md](SERVICE_ANNOTATED.md) - Service layer deep dive
- [REPOSITORY_ANNOTATED.md](REPOSITORY_ANNOTATED.md) - Repository pattern details
