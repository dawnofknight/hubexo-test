# Quick Reference Guide - HubExo Backend Codebase

## Files Reference

### ✅ Annotated Files Created for Study
- **APP_ANNOTATED.ts** - Express app setup with detailed comments on each line
- **CONTAINER_ANNOTATED.ts** - Dependency Injection container with explanations
- **REPOSITORY_ANNOTATED.ts** - Data access layer with SQL query building
- **SERVICE_ANNOTATED.ts** - Business logic orchestration
- **CONTROLLER_ANNOTATED.ts** - HTTP request handling
- **ROUTES_ANNOTATED.ts** - Route definitions and middleware chaining
- **MIDDLEWARE_ANNOTATED.ts** - Error handling and request logging
- **ENTITY_ANNOTATED.ts** - Domain entity definitions
- **EXCEPTION_ANNOTATED.ts** - Custom exception classes

### Original Source Files
All original files are preserved in their locations:
- `backend/src/app.ts` - Original (see APP_ANNOTATED.ts for commented version)
- `backend/src/container.ts` - Original (see CONTAINER_ANNOTATED.ts for commented version)
- All other files remain unchanged

---

## Architecture Layers

### Layer 1: Presentation (HTTP Handling)
**Files**: `presentation/`
- **Controllers**: `*controller.ts` - Handle HTTP requests
- **Routes**: `*routes.ts` - Define endpoints
- **Middlewares**: `*middleware.ts` - Cross-cutting concerns
- **Role**: Translate HTTP ↔ Business Logic

### Layer 2: Application (Business Logic)
**Files**: `application/`
- **Services**: `*service.ts` - Orchestrate use cases
- **DTOs**: `dtos/*` - Data transformation
- **Role**: Implement business use cases, transform data

### Layer 3: Domain (Business Rules)
**Files**: `domain/`
- **Entities**: `entities/*` - Core business objects
- **Repositories**: `repositories/*` - Data access contracts
- **Exceptions**: `exceptions/*` - Business rule violations
- **Role**: Define business rules and core concepts

### Layer 4: Infrastructure (Technical Details)
**Files**: `infrastructure/`
- **Repositories**: `repositories/*` - Database access implementation
- **Database**: `database/*` - Connection and query utilities
- **Role**: Technical implementation details

---

## Key Design Patterns Used

| Pattern | Location | Purpose |
|---------|----------|---------|
| **Dependency Injection** | `container.ts` | Wire up dependencies |
| **Repository** | `infrastructure/repositories/` | Abstract data access |
| **Service Layer** | `application/services/` | Orchestrate business logic |
| **DTO** | `application/dtos/` | Transform data between layers |
| **Factory** | `domain/entities/` | Create entities from DB rows |
| **Singleton** | `container.ts`, `database.ts` | Single instance throughout app |
| **Middleware** | `presentation/middlewares/` | Cross-cutting concerns |
| **Exception Hierarchy** | `domain/exceptions/` | Type-safe error handling |

---

## Data Flow Summary

```
HTTP Request
    ↓
Express Middlewares (CORS, parser, rate limit, logger)
    ↓
Route Matching
    ↓
Validation Middlewares (pagination, keyword)
    ↓
Controller (extract params, validate, call service)
    ↓
Service (orchestrate logic, transform data)
    ↓
Repository (build query, execute, transform)
    ↓
Database (execute SQL, return rows)
    ↓
Repository (convert rows to entities)
    ↓
Service (convert entities to DTOs)
    ↓
Controller (format response)
    ↓
Error Handler (if exception)
    ↓
HTTP Response (JSON)
    ↓
Client
```

---

## SOLID Principles Mapping

### Single Responsibility
```
✓ HealthController - only health check requests
✓ ProjectService - only project use cases
✓ ProjectRepository - only project data access
✓ ProjectEntity - only project structure
```

### Open/Closed
```
✓ Add new routes without modifying existing
✓ Add new middleware without changing app.ts
✓ Add new service without modifying controller
```

### Liskov Substitution
```
✓ ProjectRepository implements IProjectRepository
✓ Can replace with PostgresRepository
✓ Upper layers unaffected
```

### Interface Segregation
```
✓ IProjectRepository - only project methods
✓ Not forced to implement area methods
✓ Focused, minimal interfaces
```

### Dependency Inversion
```
✓ Services depend on IProjectRepository (interface)
✓ Not on ProjectRepository (concrete class)
✓ Container manages concrete implementations
```

---

## Exception Handling Map

| Exception | Thrown By | Caught By | HTTP Status |
|-----------|-----------|-----------|-------------|
| **NotFoundException** | Service | Error Handler | 404 |
| **ValidationException** | Service | Error Handler | 400 |
| **ApiException** | Error Handler | HTTP Layer | Custom |
| **Generic Error** | Any | Error Handler | 500 |

---

## Request Parameter Transformation

```
HTTP Query String (string types):
  ?area=London&page=1&per_page=20

    ↓ (parsed by Express)

req.query object:
  { area: "London", page: "1", per_page: "20" }

    ↓ (parsed by controller)

Service parameters:
  { area: "London", page: 1, perPage: 20 }

    ↓ (no change)

Repository parameters:
  { area: "London", page: 1, perPage: 20 }

    ↓ (SQL execution)

Database rows (snake_case):
  { project_name, project_start, ... }

    ↓ (factory function)

Domain entities (camelCase):
  { projectName, projectStart, ... }

    ↓ (transformation method)

DTO (snake_case for API):
  { project_name, project_start, ... }

    ↓ (res.json)

HTTP response (JSON):
  { "project_name": "...", "project_start": "...", ... }
```

---

## Common Interview Answers

**Q: Why separate entities and DTOs?**
A: Different concerns - internal representation vs external API contract. Can evolve independently.

**Q: Why use repository pattern?**
A: Abstract data access. Can swap SQLite for PostgreSQL without changing business logic.

**Q: Why use services?**
A: Encapsulate business logic. Reusable across controllers, testable independently.

**Q: Why dependency injection?**
A: Loose coupling. Easier to test (inject mocks), easier to extend (swap implementations).

**Q: Why clean architecture?**
A: Clear separation of concerns. More maintainable, testable, and flexible.

---

## Testing Strategy

### Unit Tests
- Test services with mock repositories
- Test repositories with mock database
- Test controllers with mock services

### Example Unit Test
```typescript
// Service test
const mockRepository = { findAll: jest.fn() };
const service = new ProjectService(mockRepository);
mockRepository.findAll.mockResolvedValue({
  items: [{ projectName: "Test" }],
  pagination: null
});
const result = await service.getProjects({});
expect(result.projects[0]).toEqual({ project_name: "Test" });
```

### Integration Tests
- Test full request → response flow
- Use test database
- Verify error handling

---

## Adding New Feature Checklist

### To Add: Delete Project Endpoint

1. **Domain**: Add NotFoundException if not found
2. **Service**: Add `ProjectService.deleteProject(id)`
3. **Repository**: Add `ProjectRepository.delete(id)` and `IProjectRepository` interface
4. **Controller**: Add `ProjectController.deleteProject(req, res, next)`
5. **Routes**: Add `router.delete('/:id', controller.deleteProject)`
6. **Tests**: Test each layer independently
7. **Middleware**: Add validation if needed

---

## Common Gotchas

1. **Query Parameters are Always Strings**
   - `req.query.page` is "1" (string), not 1 (number)
   - Need to `parseInt()` before using as number

2. **Type Guards Needed**
   - Check `typeof area === 'string'` before using
   - Prevents runtime errors

3. **Error Handler Must Be Last**
   - Error handler must come after all routes
   - 4-parameter signature (err, req, res, next)

4. **Async/Await in Controllers**
   - Controllers are async but Express doesn't auto-catch
   - Need try-catch block
   - Pass errors to `next(error)`

5. **Entity vs DTO vs Database Row**
   - Database: snake_case
   - Entity: camelCase
   - DTO: snake_case
   - Different naming for different concerns

---

## Performance Considerations

1. **Database Connection**: Singleton pattern reuses connection
2. **Pagination**: Default 20 items per page, max 1000
3. **Rate Limiting**: 120 requests per minute
4. **Request Size**: Max 100kb JSON body
5. **SQL Queries**: Use INNER JOINs for data integrity

---

## Security Considerations

1. **CORS**: Whitelist allowed origins
2. **Rate Limiting**: Prevent brute force/DDoS
3. **Input Validation**: Check parameters before using
4. **Parameterized Queries**: Prevent SQL injection
5. **Error Messages**: Hide details in production

---

## Environment Setup

```bash
# Install dependencies
npm install

# Set environment variables (.env file)
PORT=3000
NODE_ENV=development
DB_PATH=/path/to/database.db
ALLOWED_ORIGINS=http://localhost:3000

# Run in development
npm run dev

# Run tests
npm test

# Run in production
NODE_ENV=production npm start
```

---

## Key Files for Interview Prep

1. **Start Here**: Read `ARCHITECTURE_OVERVIEW.md` first
2. **Deep Dive**: Read annotated files (APP_ANNOTATED.ts, etc.)
3. **Practice**: Read `INTERVIEW_GUIDE.md` Q&A section
4. **Reference**: Use this Quick Reference Guide for lookups
5. **Code**: Read actual source files side-by-side with annotated versions

---

## Learning Path

1. **Understand Architecture**
   - Read: ARCHITECTURE_OVERVIEW.md
   - Visualize: Request/Response flow
   - Time: 30 minutes

2. **Study Each Layer**
   - Presentation: Read CONTROLLER_ANNOTATED.ts, ROUTES_ANNOTATED.ts, MIDDLEWARE_ANNOTATED.ts
   - Application: Read SERVICE_ANNOTATED.ts
   - Domain: Read ENTITY_ANNOTATED.ts, EXCEPTION_ANNOTATED.ts
   - Infrastructure: Read REPOSITORY_ANNOTATED.ts
   - Time: 2 hours

3. **Understand DI**
   - Read: CONTAINER_ANNOTATED.ts
   - Trace: How dependencies flow
   - Time: 30 minutes

4. **Practice Q&A**
   - Read: INTERVIEW_GUIDE.md questions
   - Write: Answers from memory
   - Verify: Against guide
   - Time: 1-2 hours

5. **Read Original Code**
   - Compare: Annotated vs original
   - Understand: Why each line is there
   - Time: 1 hour

Total Study Time: ~5-6 hours for comprehensive understanding

---

## What Interview Questions Will Cover

✓ Architecture explanation
✓ Design patterns (Repository, DI, DTO, etc.)
✓ SOLID principles application
✓ Request/Response flow
✓ Error handling strategy
✓ Testing approach
✓ Adding new features
✓ Technology choices (why SQLite, why Express, etc.)
✓ Performance considerations
✓ Security measures
✓ Code quality assessment

---

**Pro Tip**: When answering interview questions, follow this structure:
1. **What** - Explain what it is
2. **Why** - Explain why it's important
3. **How** - Explain how it's implemented
4. **Example** - Give a concrete code example

This demonstrates complete understanding!
