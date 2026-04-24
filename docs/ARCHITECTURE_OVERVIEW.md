# HubExo Backend - Architecture Overview
## Coding Challenge Interview Preparation Guide

---

## 1. Architecture Pattern: Clean Architecture (Layered Architecture)

This application follows **Clean Architecture** principles with clear separation of concerns:

```
┌─────────────────────────────────────────────┐
│         PRESENTATION LAYER                  │  ← HTTP Requests/Responses
│   (Controllers, Routes, Middlewares)        │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│         APPLICATION LAYER                   │  ← Business Logic / Use Cases
│   (Services, DTOs, Validation)              │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│          DOMAIN LAYER                       │  ← Business Rules / Entities
│   (Entities, Interfaces, Exceptions)        │
└──────────────┬──────────────────────────────┘
               │
┌──────────────▼──────────────────────────────┐
│      INFRASTRUCTURE LAYER                   │  ← Database, External Services
│   (Repositories, Database, API Clients)     │
└─────────────────────────────────────────────┘
```

### Key Benefits:
- **Testability**: Each layer can be tested independently
- **Maintainability**: Clear responsibility for each layer
- **Flexibility**: Easy to swap implementations (e.g., change database)
- **Scalability**: New features can be added without affecting existing code

---

## 2. SOLID Principles Applied

### S - Single Responsibility Principle
- **HealthController** → Only handles health check requests
- **ProjectService** → Only orchestrates project use cases
- **ProjectRepository** → Only handles project data access

### O - Open/Closed Principle
- Add new routes without modifying existing routes
- Create new middleware without changing the app setup

### L - Liskov Substitution Principle
- **ProjectRepository** implements **IProjectRepository** interface
- Can be swapped with any other implementation (MongoRepository, PostgresRepository, etc.)

### I - Interface Segregation Principle
- **IProjectRepository** defines only project-related methods
- **AreaRepository** doesn't implement project methods unnecessarily

### D - Dependency Inversion Principle
- Controllers depend on **Services**, not concrete implementations
- Services depend on **Repository Interfaces**, not concrete repositories
- This is enforced through the **Container** (Dependency Injection)

---

## 3. Application Flow (Request → Response)

```
CLIENT (Browser/API Consumer)
    │
    ▼
EXPRESS APP (src/app.ts)
    ├─ CORS Middleware (Cross-Origin Request validation)
    ├─ Body Parser (JSON parsing)
    ├─ Rate Limiter (Request throttling)
    ├─ Request Logger (Logging incoming requests)
    │
    ▼
ROUTE MATCHING (src/presentation/routes/*)
    │ Example: GET /api/projects
    │
    ▼
VALIDATION MIDDLEWARES (src/presentation/middlewares/*)
    │ ├─ validatePagination (Check page/per_page values)
    │ └─ validateKeyword (Check search keyword length)
    │
    ▼
CONTROLLER (src/presentation/controllers/*)
    │ Example: ProjectController.getProjects()
    │ ├─ Extract query parameters
    │ ├─ Validate area exists
    │ └─ Parse pagination
    │
    ▼
SERVICE (src/application/services/*)
    │ Example: ProjectService.getProjects()
    │ ├─ Call repository method
    │ ├─ Transform data (Entity → DTO)
    │ └─ Return formatted response
    │
    ▼
REPOSITORY (src/infrastructure/repositories/*)
    │ Example: ProjectRepository.findAll()
    │ ├─ Build SQL query
    │ ├─ Apply filters (area, keyword, company)
    │ ├─ Handle pagination
    │ └─ Execute query on database
    │
    ▼
DATABASE (SQLite via sql.js)
    │ Execute SQL and return raw data
    │
    ▼
REPOSITORY (Transform raw data)
    │ Convert database rows to Domain Entities
    │
    ▼
SERVICE (Transform entities)
    │ Convert Domain Entities to DTOs
    │
    ▼
CONTROLLER (Format HTTP response)
    │ Return JSON with success flag and data
    │
    ▼
ERROR HANDLER (If exception thrown anywhere)
    │ Catch error and return appropriate HTTP status
    │
    ▼
CLIENT receives response
```

---

## 4. Key Design Patterns Used

### 1. **Dependency Injection (Container Pattern)**
   - **File**: `src/container.ts`
   - **Purpose**: Centralized object creation and dependency management
   - **Benefit**: Easy to test (can swap dependencies), follows Dependency Inversion

### 2. **Repository Pattern**
   - **Files**: `src/domain/repositories/*` (interfaces) and `src/infrastructure/repositories/*` (implementations)
   - **Purpose**: Abstracts data access logic
   - **Benefit**: Can change database without changing business logic

### 3. **Service Layer Pattern**
   - **File**: `src/application/services/`
   - **Purpose**: Encapsulates business logic
   - **Benefit**: Reusable across controllers, testable in isolation

### 4. **Data Transfer Object (DTO) Pattern**
   - **File**: `src/application/dtos/`
   - **Purpose**: Converts between domain entities and API responses
   - **Benefit**: Decouples API contract from internal domain model

### 5. **Factory Pattern**
   - **Files**: `src/domain/entities/` (createProject function)
   - **Purpose**: Consistent entity creation from database rows
   - **Benefit**: Ensures data validation, easy to modify creation logic

### 6. **Singleton Pattern**
   - **File**: `src/container.ts` (container instance) and `src/infrastructure/database/database.ts` (database connection)
   - **Purpose**: Only one instance exists throughout application lifecycle
   - **Benefit**: Single source of truth, efficient resource usage

### 7. **Middleware Pattern**
   - **Files**: `src/presentation/middlewares/`
   - **Purpose**: Cross-cutting concerns (logging, validation, error handling)
   - **Benefit**: Reusable, keeps controllers clean

---

## 5. Data Flow Example: GET /api/projects?area=London&page=1

### Step 1: Request enters Express app
```
GET /api/projects?area=London&page=1
Headers: Content-Type: application/json
```

### Step 2: Middleware chain executes
```
1. CORS check ✓
2. JSON parser ✓
3. Rate limiter ✓
4. Request logger ✓
```

### Step 3: Route matches
```
Pattern: /api/projects
Method: GET
Matched in: src/presentation/routes/project.routes.ts
```

### Step 4: Validation middlewares execute
```
validatePagination: page=1 (valid) ✓
validateKeyword: (no keyword) ✓
```

### Step 5: Controller receives request
```
ProjectController.getProjects({
  area: "London",
  page: 1,
  per_page: 20  // default
})
```

### Step 6: Service processes request
```
ProjectService.getProjects({
  area: "London",
  page: 1,
  perPage: 20
})
```

### Step 7: Repository builds query
```
SELECT DISTINCT
  p.project_name,
  p.project_start,
  ...
FROM projects p
INNER JOIN companies c ON ...
INNER JOIN project_area_map pam ON ...
WHERE pam.area = 'London'
LIMIT 20 OFFSET 0
```

### Step 8: Database returns raw data
```
[
  {
    project_name: "Downtown Office",
    project_start: "2023-01-01",
    ...
  },
  ...
]
```

### Step 9: Repository transforms to entities
```
Project[] with properties:
{
  projectId,
  projectName,
  projectStart,
  ...
}
```

### Step 10: Service transforms to DTOs
```
ProjectDTO[] with snake_case properties:
{
  project_name,
  project_start,
  ...
}
```

### Step 11: Controller formats response
```
{
  success: true,
  data: [ ... ],
  pagination: {
    current_page: 1,
    per_page: 20,
    total_items: 45,
    total_pages: 3,
    has_next: true,
    has_prev: false
  }
}
```

### Step 12: Express sends HTTP response
```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "data": [ ... ],
  "pagination": { ... }
}
```

---

## 6. Exception Handling Flow

```
Domain Exception Thrown
    │
    ▼
Controller try-catch block
    │
    ├─ Caught → Pass to next() middleware
    │
    ▼
Error Handler Middleware
    │
    ├─ NotFoundException → 404
    ├─ ValidationException → 400
    ├─ ApiException → Custom status code
    └─ Generic Error → 500
    │
    ▼
JSON Response with error details
    {
      success: false,
      error: {
        code: "PROJECT_NOT_FOUND",
        message: "Project not found: 123"
      }
    }
```

---

## 7. Testing Strategy (Interview Questions)

### Unit Testing
- Test services in isolation (mock repositories)
- Test repositories with mock database
- Test controllers with mock services

### Integration Testing
- Test full request → response flow
- Use test database

### Example Test Pattern:
```typescript
// Service test
describe('ProjectService', () => {
  it('should transform entity to DTO', () => {
    const mockRepository = { findAll: jest.fn() };
    const service = new ProjectService(mockRepository);
    
    // When repository returns raw data
    mockRepository.findAll.mockResolvedValue({
      items: [{
        projectName: "Test",
        projectStart: "2023-01-01"
      }]
    });
    
    // Then service transforms to DTO format
    const result = await service.getProjects({});
    expect(result.projects[0]).toEqual({
      project_name: "Test",
      project_start: "2023-01-01"
    });
  });
});
```

---

## 8. Key Architectural Questions for Interview

1. **Why use Repository Pattern?**
   - Answer: Decouples business logic from data access, allows easy database swaps

2. **What's the purpose of DTOs?**
   - Answer: Separates API contract from domain model, enables evolution independently

3. **Why use Dependency Injection?**
   - Answer: Reduces coupling, enables testing, follows SOLID principles

4. **How would you add a new feature?**
   - Answer: 
     1. Define domain entity and repository interface
     2. Implement repository
     3. Create service with business logic
     4. Create controller handling HTTP
     5. Add routes
     6. Write tests

5. **How would you change from SQLite to PostgreSQL?**
   - Answer: Only modify `src/infrastructure/` (repositories and database connection)
   - No changes needed in domain or application layers

6. **What happens on database error?**
   - Answer: Exception thrown → caught by error handler → 500 response

---

## 9. Folder Structure Explained

```
backend/
├── src/
│   ├── presentation/          ← HTTP Layer
│   │   ├── controllers/       ← Request handlers
│   │   ├── routes/            ← Endpoint definitions
│   │   └── middlewares/       ← Cross-cutting concerns
│   │
│   ├── application/           ← Business Logic Layer
│   │   ├── services/          ← Use case implementation
│   │   └── dtos/              ← Data transfer objects
│   │
│   ├── domain/                ← Business Rules Layer
│   │   ├── entities/          ← Core business objects
│   │   ├── repositories/      ← Data access contracts
│   │   └── exceptions/        ← Business rule violations
│   │
│   ├── infrastructure/        ← Technical Layer
│   │   ├── repositories/      ← Data access implementation
│   │   └── database/          ← Database connection
│   │
│   ├── config/                ← Environment config
│   ├── app.ts                 ← Express setup
│   ├── container.ts           ← Dependency injection
│   ├── swagger.ts             ← API documentation
│   └── __tests__/             ← Test files
│
└── package.json
```

---

## 10. Code Quality Metrics

- **Testability**: High (clear dependencies, mockable layers)
- **Maintainability**: High (SOLID principles, clear structure)
- **Scalability**: High (can add new features without modifying existing code)
- **Reusability**: High (services can be used across controllers)
- **Coupling**: Low (layers depend on abstractions)

---

This architecture demonstrates enterprise-grade TypeScript development with:
✅ Clean code principles
✅ SOLID principles
✅ Design patterns
✅ Separation of concerns
✅ Testability
✅ Maintainability
✅ Scalability
