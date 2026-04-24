# Coding Interview Challenge Guide
## Complete Flow Analysis & Q&A Preparation

---

## Part 1: Complete Request-Response Flow

### Scenario: GET /api/projects?area=London&page=1&per_page=10

```
┌─────────────────────────────────────────────────────────────────┐
│ CLIENT MAKES REQUEST                                            │
│ GET /api/projects?area=London&page=1&per_page=10               │
└────────────────┬────────────────────────────────────────────────┘

                 │ HTTP Request arrives

                 ▼

┌─────────────────────────────────────────────────────────────────┐
│ EXPRESS APP (app.ts)                                            │
│ createApp() creates Express instance with middleware chain      │
└────────────────┬────────────────────────────────────────────────┘

                 │ Request enters middleware chain

                 ▼

┌─────────────────────────────────────────────────────────────────┐
│ MIDDLEWARE 1: CORS                                              │
│ Validates cross-origin request is allowed                       │
│ ✓ Request passes                                                │
└────────────────┬────────────────────────────────────────────────┘

                 ▼

┌─────────────────────────────────────────────────────────────────┐
│ MIDDLEWARE 2: JSON Parser                                       │
│ Parses body (if present) into req.body                          │
│ ✓ No body for GET request                                       │
└────────────────┬────────────────────────────────────────────────┘

                 ▼

┌─────────────────────────────────────────────────────────────────┐
│ MIDDLEWARE 3: Rate Limiter                                      │
│ Checks if client exceeded rate limit (120 req/min)              │
│ ✓ Within limits                                                 │
└────────────────┬────────────────────────────────────────────────┘

                 ▼

┌─────────────────────────────────────────────────────────────────┐
│ MIDDLEWARE 4: Request Logger                                    │
│ Logs: [timestamp] GET /api/projects?area=London&page=1...       │
│ ✓ Logged for monitoring                                         │
└────────────────┬────────────────────────────────────────────────┘

                 ▼

┌─────────────────────────────────────────────────────────────────┐
│ ROUTE MATCHING (project.routes.ts)                              │
│ /api/projects matches route pattern '/'                         │
│ → Goes to controller with middlewares                           │
└────────────────┬────────────────────────────────────────────────┘

                 ▼

┌─────────────────────────────────────────────────────────────────┐
│ MIDDLEWARE 5: validatePagination                                │
│ Validates page/per_page parameters                              │
│ ✓ page=1 and per_page=10 are valid                              │
└────────────────┬────────────────────────────────────────────────┘

                 ▼

┌─────────────────────────────────────────────────────────────────┐
│ MIDDLEWARE 6: validateKeyword                                   │
│ Validates keyword parameter length                              │
│ ✓ No keyword provided                                           │
└────────────────┬────────────────────────────────────────────────┘

                 ▼

┌─────────────────────────────────────────────────────────────────┐
│ CONTROLLER: ProjectController.getProjects()                     │
│ (CONTROLLER_ANNOTATED.ts)                                       │
│                                                                 │
│ Step 1: Extract query parameters                                │
│   area: "London"                                                │
│   keyword: undefined                                            │
│   company: undefined                                            │
│   page: 1                                                       │
│   per_page: 10                                                  │
│                                                                 │
│ Step 2: Validate area exists                                    │
│   → Call areaService.validateAreaExists("London")               │
│   ✓ Area exists                                                 │
│                                                                 │
│ Step 3: Parse pagination parameters                             │
│   pageNum: 1                                                    │
│   perPageNum: 10                                                │
│                                                                 │
│ Step 4: Call service                                            │
│   → Call projectService.getProjects({...})                      │
└────────────────┬────────────────────────────────────────────────┘

                 ▼

┌─────────────────────────────────────────────────────────────────┐
│ SERVICE: ProjectService.getProjects()                           │
│ (SERVICE_ANNOTATED.ts)                                          │
│                                                                 │
│ Step 1: Call repository                                         │
│   → repository.findAll({                                        │
│       area: "London",                                           │
│       keyword: undefined,                                       │
│       company: undefined,                                       │
│       page: 1,                                                  │
│       perPage: 10                                               │
│     })                                                          │
│                                                                 │
│ Step 2-4: Transform data to DTOs (wait for repository result)   │
└────────────────┬────────────────────────────────────────────────┘

                 ▼

┌─────────────────────────────────────────────────────────────────┐
│ REPOSITORY: ProjectRepository.findAll()                         │
│ (REPOSITORY_ANNOTATED.ts)                                       │
│                                                                 │
│ Step 1: Get database connection                                 │
│   → databaseConnection.getConnection()                          │
│   (Singleton pattern: same instance reused)                     │
│                                                                 │
│ Step 2: Build base SQL query                                    │
│   SELECT DISTINCT p.project_name, p.project_start, ...          │
│   FROM projects p                                               │
│   INNER JOIN companies c ON p.company_id = c.company_id         │
│   INNER JOIN project_area_map pam ON p.project_id = ...         │
│                                                                 │
│ Step 3: Build WHERE clause for filters                          │
│   Conditions: ["pam.area = ?"]                                  │
│   Params: ["London"]                                            │
│                                                                 │
│ Step 4: Add ORDER BY                                            │
│   ORDER BY p.project_name ASC, pam.area ASC                     │
│                                                                 │
│ Step 5: Calculate pagination                                    │
│   COUNT query to get total items: 45 matching projects          │
│   totalPages = Math.ceil(45 / 10) = 5 pages                     │
│   offset = (1 - 1) * 10 = 0                                     │
│                                                                 │
│ Step 6: Add pagination to query                                 │
│   LIMIT 10 OFFSET 0                                             │
│                                                                 │
│ Step 7: Execute query                                           │
│   db.execute(query, params)                                     │
│                                                                 │
│ Result: Array of 10 project rows from database:                 │
│   [                                                             │
│     {                                                           │
│       project_name: "Downtown Office",                          │
│       project_start: "2023-01-01",                              │
│       project_end: "2024-12-31",                                │
│       company_name: "Acme Corp",                                │
│       description: "New office complex",                        │
│       project_value: 50000,                                     │
│       area: "London"                                            │
│     },                                                          │
│     ... 9 more items                                            │
│   ]                                                             │
│                                                                 │
│ Step 8: Transform rows to entities                              │
│   rows.map(createProject) → [Project, Project, ...]             │
│                                                                 │
│ Return: {                                                       │
│   items: [Project, Project, ...],                               │
│   pagination: {                                                 │
│     currentPage: 1,                                             │
│     perPage: 10,                                                │
│     totalItems: 45,                                             │
│     totalPages: 5,                                              │
│     hasNext: true,                                              │
│     hasPrev: false                                              │
│   }                                                             │
│ }                                                               │
└────────────────┬────────────────────────────────────────────────┘

                 ▼

┌─────────────────────────────────────────────────────────────────┐
│ BACK TO SERVICE: ProjectService.getProjects()                   │
│                                                                 │
│ Step 2: Transform entities to DTOs                              │
│   rows.map(toProjectDTO):                                       │
│   Project { projectName: "Downtown Office", ... }               │
│   → ProjectDTO { project_name: "Downtown Office", ... }         │
│                                                                 │
│ Step 3: Transform pagination metadata                           │
│   currentPage: 1 → current_page: 1                              │
│   hasNext: true → has_next: true                                │
│   etc.                                                          │
│                                                                 │
│ Return: {                                                       │
│   projects: [ProjectDTO, ProjectDTO, ...],                      │
│   pagination: {                                                 │
│     current_page: 1,                                            │
│     per_page: 10,                                               │
│     total_items: 45,                                            │
│     total_pages: 5,                                             │
│     has_next: true,                                             │
│     has_prev: false                                             │
│   }                                                             │
│ }                                                               │
└────────────────┬────────────────────────────────────────────────┘

                 ▼

┌─────────────────────────────────────────────────────────────────┐
│ BACK TO CONTROLLER: ProjectController.getProjects()             │
│                                                                 │
│ Step 5: Format and send HTTP response                           │
│   res.json({                                                    │
│     success: true,                                              │
│     data: [...projects],                                        │
│     pagination: {...}                                           │
│   })                                                            │
└────────────────┬────────────────────────────────────────────────┘

                 ▼

┌─────────────────────────────────────────────────────────────────┐
│ HTTP RESPONSE SENT TO CLIENT                                    │
│                                                                 │
│ HTTP/1.1 200 OK                                                 │
│ Content-Type: application/json                                  │
│                                                                 │
│ {                                                               │
│   "success": true,                                              │
│   "data": [                                                     │
│     {                                                           │
│       "project_name": "Downtown Office",                        │
│       "project_start": "2023-01-01",                            │
│       "project_end": "2024-12-31",                              │
│       "company": "Acme Corp",                                   │
│       "description": "New office complex",                      │
│       "project_value": 50000,                                   │
│       "area": "London"                                          │
│     },                                                          │
│     ... 9 more items                                            │
│   ],                                                            │
│   "pagination": {                                               │
│     "current_page": 1,                                          │
│     "per_page": 10,                                             │
│     "total_items": 45,                                          │
│     "total_pages": 5,                                           │
│     "has_next": true,                                           │
│     "has_prev": false                                           │
│   }                                                             │
│ }                                                               │
└─────────────────────────────────────────────────────────────────┘

                 │ CLIENT receives response

                 ▼

        ┌────────────────────────────┐
        │ CLIENT PROCESSES DATA      │
        │ Display projects in UI     │
        │ Show pagination controls   │
        └────────────────────────────┘
```

---

## Part 2: Error Handling Flow

### Scenario: GET /api/projects?area=InvalidArea

```
CLIENT → REQUEST
    ↓
CONTROLLER
    ├─ Extract area: "InvalidArea"
    ├─ Try: areaService.validateAreaExists("InvalidArea")
    ├─ Service throws: NotFoundException("Area", "InvalidArea")
    ├─ CATCH (error)
    ├─ Call: next(error)
    │
    ▼
ERROR HANDLER MIDDLEWARE
    ├─ Check: if (err instanceof ApiException) → NO
    ├─ Check: if (err instanceof NotFoundException) → YES
    ├─ Status Code: 404
    ├─ Build Response:
    │  {
    │    "success": false,
    │    "error": {
    │      "code": "PROJECT_NOT_FOUND",
    │      "message": "Area not found: InvalidArea"
    │    }
    │  }
    │
    ▼
HTTP/1.1 404 Not Found
{...error response...}
```

---

## Part 3: Interview Q&A Preparation

### Q1: Explain the architecture of this application

**Answer Structure:**
- Name the pattern: "Clean Architecture with layered separation"
- Describe the layers (4):
  1. **Presentation**: Controllers, Routes, Middlewares → Handle HTTP
  2. **Application**: Services, DTOs → Business logic orchestration
  3. **Domain**: Entities, Repositories (interfaces), Exceptions → Business rules
  4. **Infrastructure**: Repository implementations, Database → Technical details

- Explain the flow: `Request → Controller → Service → Repository → Database → Response`

- Key benefits:
  - Testability (each layer independently testable)
  - Maintainability (clear responsibilities)
  - Flexibility (can swap implementations)
  - Scalability (add features without modifying existing code)

---

### Q2: What's the purpose of the Repository Pattern?

**Answer:**
- Abstracts data access behind an interface (IProjectRepository)
- Implementation (ProjectRepository) is decoupled from business logic
- Can swap implementations:
  - SQLite → PostgreSQL
  - PostgreSQL → MongoDB
  - Add caching layer
  - Add logging layer
- Upper layers (services, controllers) don't care about implementation details
- Testable: can inject mock repository in unit tests

---

### Q3: Why use DTOs (Data Transfer Objects)?

**Answer:**
- Separates internal entity representation from API contract
- Entity: camelCase (JavaScript convention)
- DTO: snake_case (API convention)
- Benefits:
  - Can evolve internal entities without changing API
  - Can add/remove API fields without changing domain model
  - Decouples API consumers from internal structure
  - Single place to manage transformations
- Example:
  ```
  Entity: { projectName: "...", projectStart: "..." }
  DTO: { project_name: "...", project_start: "..." }
  ```

---

### Q4: Explain the Dependency Injection Container (src/container.ts)

**Answer:**
- Central place where all objects are created and wired
- Ensures each dependency exists as singleton
- Follows dependency inversion principle
- Flow:
  1. Create repositories (infrastructure layer)
  2. Create services with repositories (application layer)
  3. Create controllers with services (presentation layer)
- Benefits:
  - Easy to test (can swap implementations)
  - Single source of truth for dependencies
  - No scattered "new" statements
  - Can change how objects are created in one place

---

### Q5: How are exceptions handled?

**Answer:**
- **Domain exceptions**: NotFoundException, ValidationException
  - Thrown by services/controllers when business rules violated
  - Carry context: entity name, field, reason
- **Error handler middleware**:
  - Catches all exceptions
  - Checks type of exception
  - Determines HTTP status code:
    - NotFoundException → 404
    - ValidationException → 400
    - Generic Error → 500
  - Returns consistent JSON error response
- **Decoupling**: Domain layer doesn't know about HTTP

---

### Q6: Walk through the request flow

**Answer:** (Use the flow diagram above)
1. Request enters Express app
2. Middleware chain executes (CORS, parser, rate limiter, logger)
3. Routes match to controller
4. Validation middlewares execute
5. Controller extracts parameters, calls service
6. Service calls repository
7. Repository builds SQL, executes query, transforms data
8. Data flows back up: repository → service → controller
9. Each layer transforms data as needed
10. Controller sends JSON response

---

### Q7: How would you add a new feature (e.g., delete project)?

**Answer:**
1. **Define domain rule**: What business logic needed?
2. **Add service method**: ProjectService.deleteProject(id)
3. **Add repository method**: ProjectRepository.delete(id)
4. **Add controller handler**: ProjectController.deleteProject(req, res, next)
5. **Add route**: router.delete('/:id', controller.deleteProject)
6. **Add tests**: Test each layer independently
7. **Only add validation/middleware if needed**

---

### Q8: How would you migrate from SQLite to PostgreSQL?

**Answer:**
- Only change: `src/infrastructure/`
  - New file: `PostgresRepository` implementing `IProjectRepository`
  - Update `database.ts` to connect to PostgreSQL
  - Update connection logic
- No changes needed in:
  - Services (don't know about database implementation)
  - Controllers (don't know about services implementation)
  - Domain entities (remain the same)
- This demonstrates the power of clean architecture!

---

### Q9: What are SOLID principles and how are they applied?

**Answer:**
- **S**ingle Responsibility: Each class/module has one reason to change
  - ProjectController: only HTTP handling
  - ProjectService: only business logic
  - ProjectRepository: only data access
  
- **O**pen/Closed: Open for extension, closed for modification
  - Add new controller without modifying existing ones
  - Add new middleware without changing app.ts
  
- **L**iskov Substitution: Subclasses should substitute base classes
  - ProjectRepository implements IProjectRepository
  - Can replace with PostgresRepository transparently
  
- **I**nterface Segregation: Interfaces shouldn't force unnecessary methods
  - IProjectRepository only has project methods
  - Not forced to implement area methods
  
- **D**ependency Inversion: Depend on abstractions, not concrete implementations
  - Services depend on IProjectRepository, not ProjectRepository
  - Enables testing and flexibility

---

### Q10: How would you test this application?

**Answer:**
- **Unit Tests**: Test each layer independently
  ```typescript
  // Service test with mock repository
  const mockRepository = { findAll: jest.fn() };
  const service = new ProjectService(mockRepository);
  await service.getProjects({ area: "London" });
  expect(mockRepository.findAll).toHaveBeenCalledWith({area: "London"});
  ```

- **Integration Tests**: Test full request flow
  ```typescript
  const response = await request(app).get('/api/projects?area=London');
  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
  ```

- **Error Tests**: Test error scenarios
  ```typescript
  const response = await request(app).get('/api/projects?area=InvalidArea');
  expect(response.status).toBe(404);
  expect(response.body.error.code).toBe('AREA_NOT_FOUND');
  ```

---

### Q11: What's the purpose of middlewares?

**Answer:**
- Cross-cutting concerns that apply to multiple routes
- Execute in order, can modify request or stop execution
- Examples:
  - CORS: Validate cross-origin requests
  - Parser: Parse JSON body
  - Rate limiter: Throttle requests
  - Logger: Log requests
  - Validators: Validate parameters
  - Error handler: Catch exceptions
- Can be route-specific or global
- Pattern: request → middleware1 → middleware2 → controller → response

---

### Q12: Explain the data transformation flow

**Answer:**
```
Database Row (snake_case)
  └─ createProject factory
    └─ Domain Entity (camelCase)
      └─ toProjectDTO method
        └─ DTO (snake_case for API)
          └─ res.json()
            └─ HTTP Response
```

Each layer has different naming convention:
- **Database**: snake_case (database convention)
- **Domain**: camelCase (JavaScript convention)
- **API**: snake_case (REST convention)

This enables independent evolution of each layer.

---

## Part 4: Code Quality Checklist

### Architecture Patterns ✓
- [ ] Layered architecture (4 layers)
- [ ] Clear separation of concerns
- [ ] Request → Response flow clear
- [ ] Easy to trace through code

### SOLID Principles ✓
- [ ] Single Responsibility: each class has one reason to change
- [ ] Open/Closed: extend without modifying existing code
- [ ] Liskov Substitution: interfaces properly defined
- [ ] Interface Segregation: focused interfaces
- [ ] Dependency Inversion: depend on abstractions

### Design Patterns ✓
- [ ] Dependency Injection: container manages dependencies
- [ ] Repository Pattern: data access abstraction
- [ ] Service Layer: business logic orchestration
- [ ] DTO Pattern: data transformation
- [ ] Factory Pattern: consistent object creation
- [ ] Singleton Pattern: single instance throughout app
- [ ] Middleware Pattern: cross-cutting concerns

### Error Handling ✓
- [ ] Domain exceptions thrown by business logic
- [ ] Controllers catch and delegate to error handler
- [ ] Error handler maps to HTTP status codes
- [ ] Consistent error response format
- [ ] Type-safe exception handling

### Testability ✓
- [ ] Services can be tested with mock repositories
- [ ] Controllers can be tested with mock services
- [ ] Easy to test error scenarios
- [ ] Clear dependencies
- [ ] No hidden state

### Code Organization ✓
- [ ] Related code grouped by feature/layer
- [ ] Clear folder structure
- [ ] Easy to find specific functionality
- [ ] Easy to add new features

---

## Part 5: Interview Tips

### When Asked to Explain Code:
1. Start with the big picture (architecture)
2. Drill down to specific layers
3. Follow the request flow
4. Explain design decisions
5. Discuss trade-offs

### When Asked to Fix an Issue:
1. Identify which layer has the issue
2. Understand the flow through that layer
3. Check if other layers depend on it
4. Make minimal changes
5. Consider edge cases

### When Asked to Add a Feature:
1. Identify which layers are affected
2. Follow the pattern established in code
3. Add tests alongside code
4. Consider if refactoring is needed
5. Ensure SOLID principles are maintained

### When Asked About Testing:
1. Discuss testing strategy per layer
2. Explain mocking approach
3. Give specific test examples
4. Discuss edge cases
5. Mention integration tests too

---

## Part 6: Key Files Summary

| File | Layer | Purpose |
|------|-------|---------|
| app.ts | Presentation | Express setup, middleware configuration |
| container.ts | All | Dependency Injection setup |
| *controller.ts | Presentation | HTTP request handlers |
| *routes.ts | Presentation | Route definitions |
| middleware/*.ts | Presentation | Cross-cutting concerns |
| *service.ts | Application | Business logic orchestration |
| dtos/*.ts | Application | Data transformation |
| *repository.ts | Infrastructure | Data access implementation |
| entities/*.ts | Domain | Business object definitions |
| exceptions/*.ts | Domain | Business rule violations |
| database.ts | Infrastructure | Database connection |

---

## Part 7: Common Interview Questions

1. **Q: What's the main advantage of this architecture?**
   A: Testability, flexibility, and maintainability through separation of concerns

2. **Q: How would you handle authentication?**
   A: Add auth middleware before routes, add User entity, update services to check permissions

3. **Q: How would you add logging?**
   A: Add logging service, inject into services, log at business logic layer

4. **Q: How would you handle async operations?**
   A: Already using async/await, error handling works with Promises

5. **Q: What about error monitoring?**
   A: Add integration with error monitoring service in error handler middleware

---

This comprehensive guide covers all aspects of the codebase architecture and demonstrates enterprise-level software design patterns.
