# Project Service - Detailed Annotation

## Business Logic Orchestration & Use Cases

---

## 📋 File Overview

**File**: `backend/src/application/services/project.service.ts`
**Layer**: Application (Business Logic)
**Pattern**: Service Layer, Use Case Implementation
**Responsibility**: Orchestrate between presentation and data access

---

## 🎯 Service Purpose

| What | Why | Where |
|------|-----|-------|
| **Orchestrate** | Coordinate business logic | Between controller and repository |
| **Transform** | Convert data formats | Entity ↔ DTO |
| **Validate** | Enforce business rules | Services throw exceptions |
| **Reuse** | Logic across multiple controllers | Services can be used anywhere |

---

## 📦 Imports

```typescript
import { IProjectRepository } from '../../domain/repositories';
// ├─ Import repository INTERFACE (abstraction)
// ├─ NOT concrete ProjectRepository class
// ├─ Enables testing with mock repositories
// └─ Follows Dependency Inversion Principle
```

```typescript
import { NotFoundException } from '../../domain/exceptions';
// ├─ Import custom exception for not found cases
// ├─ Thrown when project with given ID doesn't exist
// └─ Will be caught by controller and converted to 404 HTTP response
```

```typescript
import { 
  ProjectDTO, 
  ProjectWithIdDTO, 
  GetProjectsQueryDTO, 
  PaginationDTO 
} from '../dtos';
// ├─ Import Data Transfer Objects
// ├─ ProjectDTO: project data without ID
// ├─ ProjectWithIdDTO: project data with ID
// ├─ GetProjectsQueryDTO: query parameters
// ├─ PaginationDTO: pagination metadata
// └─ Used for transforming data between layers
```

---

## 🏗️ Class Definition

```typescript
export class ProjectService {
  // Service implements two main use cases:
  // 1. Get all projects with filtering/pagination
  // 2. Get specific project by ID
}
```

---

## 🔌 Constructor & Dependency Injection

```typescript
export class ProjectService {
  constructor(private readonly projectRepository: IProjectRepository) {}
  // ├─ Injected dependency: repository interface
  // ├─ private: only accessible within this class
  // ├─ readonly: cannot be reassigned after constructor
  // ├─ Type: IProjectRepository (interface, not concrete class)
  // └─ Enables testing with mock repositories
```

### Why Interface Instead of Concrete Class?

```
With Interface (current):
  new ProjectService(mockRepository) ✅ Works - mock implements interface
  Can inject any implementation ✅

With Concrete Class (bad):
  new ProjectService(mockRepository) ❌ Fails - type mismatch
  Only works with one specific implementation ❌
```

---

## 📍 Use Case 1: Get Projects with Filtering

### Method Signature

```typescript
async getProjects(query: GetProjectsQueryDTO): Promise<{
  projects: ProjectDTO[];      // Array of projects in API format
  pagination: PaginationDTO | null;  // Null if no pagination
}> {
```

### Parameters

| Param | Type | Optional | Purpose |
|-------|------|----------|---------|
| area | string | Yes | Filter by geographic area |
| keyword | string | Yes | Search in project name |
| company | string | Yes | Filter by company |
| page | number | Yes | Page number for pagination |
| perPage | number | Yes | Items per page |

---

## 📊 Step 1: Call Repository

```typescript
const result = await this.projectRepository.findAll({
  area: query.area,              // Pass through area filter
  keyword: query.keyword,        // Pass through keyword search
  company: query.company,        // Pass through company filter
  page: query.page,              // Pass through page number
  perPage: query.perPage         // Pass through items per page
});
// ├─ Repository handles SQL query building
// ├─ Repository handles pagination calculation
// ├─ Repository handles database execution
// ├─ Returns: { items: [], pagination: {} }
// └─ Service doesn't care about SQL details
```

**What Repository Returns**:
```
{
  items: [
    { projectName: "Office", projectStart: "2023-01-01", ... },
    { projectName: "Complex", projectStart: "2023-02-01", ... }
  ],
  pagination: {
    currentPage: 1,
    perPage: 20,
    totalItems: 45,
    totalPages: 3,
    hasNext: true,
    hasPrev: false
  }
}
```

---

## 🔄 Step 2: Transform Entities to DTOs

```typescript
const projects = result.items.map(this.toProjectDTO);
// ├─ Map each entity through transformation
// ├─ Entity: { projectName: "...", projectStart: "..." }
// ├─ DTO: { project_name: "...", project_start: "..." }
// └─ Converts camelCase (entity) to snake_case (API)
```

**Why Map?**
```
result.items = [Project1, Project2, Project3, ...]
                  ↓
                  │ each item transformed
                  ↓
projects = [ProjectDTO1, ProjectDTO2, ProjectDTO3, ...]
```

---

## 📄 Step 3: Transform Pagination Metadata

```typescript
const pagination = result.pagination ? {
  // ├─ Check if pagination exists (null if no pagination requested)
  
  current_page: result.pagination.currentPage,    // camelCase → snake_case
  per_page: result.pagination.perPage,            // camelCase → snake_case
  total_items: result.pagination.totalItems,      // camelCase → snake_case
  total_pages: result.pagination.totalPages,      // camelCase → snake_case
  has_next: result.pagination.hasNext,            // camelCase → snake_case
  has_prev: result.pagination.hasPrev             // camelCase → snake_case
} : null;
// ├─ Transform pagination format (repository → API)
// └─ Return null if no pagination metadata
```

**Why Transform?**
```
Repository uses camelCase (JavaScript convention)
API uses snake_case (REST convention)
Service is the bridge between them
```

---

## ✅ Step 4: Return Result

```typescript
return { projects, pagination };
// ├─ Return both projects and pagination metadata
// └─ Controller receives ready-to-send data
```

---

## 📍 Use Case 2: Get Project by ID

### Method Signature

```typescript
async getProjectById(projectId: string): Promise<ProjectWithIdDTO[]> {
  // ├─ Parameter: unique project ID
  // ├─ Returns: array of ProjectWithIdDTO (can have multiple areas)
  // └─ Throws: NotFoundException if not found
```

---

## 🔎 Step 1: Fetch from Repository

```typescript
const projects = await this.projectRepository.findById(projectId);
// ├─ Repository query by ID
// ├─ Returns: array of projects or null
// └─ Project is null if ID doesn't exist
```

---

## ✔️ Step 2: Enforce Business Rule - Project Must Exist

```typescript
if (!projects) {
  throw new NotFoundException('Project', projectId);
  // ├─ Project doesn't exist
  // ├─ Throw domain exception with context
  // ├─ Exception message: "Project not found: proj-123"
  // ├─ Will be caught by controller's try-catch
  // ├─ Passed to error handler via next(error)
  // └─ Error handler converts to 404 HTTP response
}
```

**Why Throw Here?**
- ✅ Domain layer is responsible for business rules
- ✅ "Project must exist" is a business rule, not HTTP concept
- ✅ Decouples business logic from HTTP layer
- ✅ Same exception can be used in CLI or jobs

---

## 🔄 Step 3: Transform to DTOs with ID

```typescript
return projects.map(p => ({
  project_id: p.projectId!,        // Include project ID
  ...this.toProjectDTO(p)           // Spread other fields
}));
// ├─ Map each project to DTO
// ├─ Include project_id (required for single project endpoint)
// ├─ !: Non-null assertion (we know projectId exists)
// └─ Spread operator adds all fields from toProjectDTO
```

**What's Spread Operator?**
```
p = { projectId: "123", projectName: "Office", ... }
this.toProjectDTO(p) = { project_name: "Office", ... }

Spread result = {
  project_id: "123",
  ...{ project_name: "Office", ... }
}
= { project_id: "123", project_name: "Office", ... }
```

---

## 🛠️ Private Helper: toProjectDTO

### Purpose
Transform entity (database format) to DTO (API format)

```typescript
private toProjectDTO(project: { 
  projectName: string;
  projectStart: string;
  projectEnd: string;
  company: string;
  description: string | null;
  projectValue: number;
  area: string;
}): ProjectDTO {
  // ├─ Input: Entity properties (camelCase)
  // ├─ Output: ProjectDTO properties (snake_case)
  // └─ Single place to manage transformation
```

### Transformation Mapping

```typescript
  return {
    project_name: project.projectName,       // projectName → project_name
    project_start: project.projectStart,     // projectStart → project_start
    project_end: project.projectEnd,         // projectEnd → project_end
    company: project.company,                // no change (already correct)
    description: project.description,        // no change
    project_value: project.projectValue,     // projectValue → project_value
    area: project.area                       // no change
  };
```

---

## 📊 Data Transformation Flow

```
Database Row (snake_case)
    ↓
    │ createProject factory in repository
    │
Domain Entity (camelCase)
    │ { projectName: "...", projectStart: "..." }
    ↓
    │ toProjectDTO method in service
    │
DTO (snake_case)
    │ { project_name: "...", project_start: "..." }
    ↓
    │ res.json() in controller
    │
HTTP Response (JSON)
```

---

## 🎯 Key Concepts

### Single Responsibility
```
Service is responsible for:
- ✅ Orchestrating use cases
- ✅ Transforming data
- ✅ Throwing domain exceptions

Service is NOT responsible for:
- ❌ Executing SQL (repository does)
- ❌ Handling HTTP (controller does)
- ❌ Accepting requests (controller does)
```

### Interface Dependency
```
Benefits of depending on IProjectRepository interface:
- ✅ Can swap implementations (SQLite → PostgreSQL)
- ✅ Can test with mock repository
- ✅ Can add caching layer transparently
- ✅ Services don't know about database details
```

### Immutability
```
private readonly projectRepository
- private: only accessible within class
- readonly: cannot be changed after constructor
- Ensures repository reference stays constant
```

---

## 🧪 How This Service is Tested

### Unit Test Example

```typescript
describe('ProjectService', () => {
  it('should get projects with filters', async () => {
    // Create mock repository
    const mockRepository = {
      findAll: jest.fn().mockResolvedValue({
        items: [{ projectName: "Test", projectStart: "2023-01-01" }],
        pagination: null
      })
    };

    // Create service with mock (not real database)
    const service = new ProjectService(mockRepository);

    // Call service
    const result = await service.getProjects({ 
      area: "London",
      page: 1,
      perPage: 20
    });

    // Verify repository was called correctly
    expect(mockRepository.findAll).toHaveBeenCalledWith({
      area: "London",
      page: 1,
      perPage: 20
    });

    // Verify result is transformed
    expect(result.projects[0]).toEqual({
      project_name: "Test",
      project_start: "2023-01-01"
    });
  });
});
```

---

## ✅ Checklist: Service Responsibilities

- ✅ Calls repository for data
- ✅ Transforms entities to DTOs
- ✅ Enforces business rules (throws exceptions)
- ✅ Handles pagination metadata
- ✅ Returns ready-to-use data to controller
- ✅ Decoupled from HTTP layer
- ✅ Decoupled from database implementation

---

## 💡 Interview Insights

**Question**: "Why use services?"

**Answer**: "Services orchestrate business logic and sit between controllers and repositories. They transform data formats, enforce business rules, and remain independent of HTTP concerns. This makes them testable (can inject mock repositories) and reusable (can be called from controllers, CLI, background jobs, etc.)."

**Question**: "Why depend on an interface, not a concrete repository?"

**Answer**: "Depending on IProjectRepository interface instead of ProjectRepository class enables:
1. Testability (inject mock repositories)
2. Flexibility (swap implementations)
3. Future changes (add caching without changing service)"

---
