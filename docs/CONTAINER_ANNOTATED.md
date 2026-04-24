# Dependency Injection Container - Detailed Annotation

## Complete Dependency Wiring Setup

---

## 📋 File Overview

**File**: `backend/src/container.ts`
**Pattern**: Container pattern for Inversion of Control (IoC)
**Key Principle**: Dependency Inversion Principle (DIP)
**Scope**: Singleton - only one instance throughout app lifecycle

---

## 🎯 Purpose of Container

The container serves as a **central hub** for:

| Purpose | What | Why |
|---------|------|-----|
| **Creation** | Creates all instances | Single place to manage |
| **Wiring** | Injects dependencies | Objects don't create their own dependencies |
| **Reuse** | Singleton instances | Efficient resource usage |
| **Testing** | Easy swapping | Can inject mocks for testing |

---

## 📦 Imports

```typescript
import { ProjectRepository, AreaRepository, CompanyRepository } 
  from './infrastructure/repositories';
// ├─ Import concrete repository implementations
// ├─ These actually talk to the database
// └─ Part of infrastructure layer
```

```typescript
import { ProjectService, AreaService, CompanyService, HealthService } 
  from './application/services';
// ├─ Import business logic services
// ├─ These implement use cases
// └─ Part of application layer
```

```typescript
import { ProjectController, AreaController, CompanyController, HealthController } 
  from './presentation/controllers';
// ├─ Import HTTP request handlers
// ├─ These handle incoming requests
// └─ Part of presentation layer
```

---

## 🏗️ Container Class Structure

```typescript
export class Container {
  // This class will hold all instances
  // Organized by layer (Infrastructure → Application → Presentation)
}
```

---

## Layer 1️⃣: INFRASTRUCTURE LAYER (Data Access)

### Purpose
- Handle database operations
- Implement data persistence
- Abstract SQL queries

### Repositories Created

```typescript
  private readonly projectRepository = new ProjectRepository();
  // ├─ Instance for project database access
  // ├─ private: only accessible within container
  // ├─ readonly: cannot be reassigned after creation
  // └─ new ProjectRepository(): creates one instance, never recreated
```

```typescript
  private readonly areaRepository = new AreaRepository();
  // ├─ Instance for area database access
  // └─ Same pattern as projectRepository
```

```typescript
  private readonly companyRepository = new CompanyRepository();
  // ├─ Instance for company database access
  // └─ Same pattern as projectRepository
```

**Key Point**: 
- ✅ These are created first (lowest layer)
- ✅ Used by services (higher layer)
- ✅ Each is singleton (one per app)

---

## Layer 2️⃣: APPLICATION LAYER (Business Logic)

### Purpose
- Orchestrate use cases
- Transform data between layers
- Implement business rules

### Services with Dependencies

```typescript
  private readonly projectService = new ProjectService(this.projectRepository);
  // ├─ Create ProjectService
  // ├─ Inject: projectRepository (dependency)
  // ├─ projectService depends on repository for data
  // └─ Constructor injection: new ProjectService(dependency)
```

**What's happening?**
1. `new ProjectService(...)` creates service instance
2. `this.projectRepository` passes the repository as dependency
3. Service stores reference: `this.projectRepository = projectRepository`
4. Service now can call: `this.projectRepository.findAll(...)`

```typescript
  private readonly areaService = new AreaService(this.areaRepository);
  // └─ Same pattern: service with injected repository
```

```typescript
  private readonly companyService = new CompanyService(this.companyRepository);
  // └─ Same pattern: service with injected repository
```

```typescript
  private readonly healthService = new HealthService();
  // ├─ Health service has NO dependencies
  // ├─ It doesn't access database
  // └─ Created without injection
```

**Dependency Flow**:
```
Repository (Data Access)
    ↑
    │ injected into
    │
  Service (Business Logic)
```

---

## Layer 3️⃣: PRESENTATION LAYER (HTTP Handlers)

### Purpose
- Handle HTTP requests
- Use services for business logic
- Return JSON responses

### Controllers with Dependencies

```typescript
  readonly projectController = new ProjectController(
    this.projectService, 
    this.areaService
  );
  // ├─ Create ProjectController
  // ├─ Inject 1: projectService (for project operations)
  // ├─ Inject 2: areaService (for area validation)
  // ├─ readonly: accessible outside container
  // └─ Not private because app.ts needs to access it
```

**Why readonly instead of private?**
- `readonly` allows access from outside: `container.projectController`
- `private` would prevent app.ts from accessing it
- app.ts needs: `createProjectRoutes(container.projectController)`

```typescript
  readonly areaController = new AreaController(this.areaService);
  // ├─ Create AreaController
  // └─ Inject: areaService
```

```typescript
  readonly companyController = new CompanyController(this.companyService);
  // ├─ Create CompanyController
  // └─ Inject: companyService
```

```typescript
  readonly healthController = new HealthController(this.healthService);
  // ├─ Create HealthController
  // └─ Inject: healthService
```

**Dependency Flow**:
```
  Service (Business Logic)
      ↑
      │ injected into
      │
  Controller (HTTP Handler)
```

---

## 📊 Complete Dependency Hierarchy

```
Layer 1 (Infrastructure)
├─ ProjectRepository ─────────────┐
├─ AreaRepository ────────────────┤
└─ CompanyRepository ─────────────┤
                                  │ injected into
                                  ▼
Layer 2 (Application)
├─ ProjectService ────────────────┐
├─ AreaService ───────────────────┤
├─ CompanyService ────────────────┤
└─ HealthService ────────────────┐│ injected into
                                  ││
                                  ▼▼
Layer 3 (Presentation)
├─ ProjectController
├─ AreaController
├─ CompanyController
└─ HealthController
```

---

## 🔄 Singleton Container Instance

```typescript
export const container = new Container();
// ├─ Create ONE instance of Container
// ├─ This instance is created when file is imported
// ├─ Same instance used throughout entire app
// ├─ All services/controllers share same repositories
// └─ Efficient: resources not duplicated
```

### Where is it used?

**In app.ts**:
```typescript
import { container } from './container';

app.use('/api/projects', createProjectRoutes(container.projectController));
//                                            ↑ Use the singleton instance
```

**In route files**:
```typescript
export function createProjectRoutes(controller: ProjectController) {
  //                                 ↑ Receives controller from container
}
```

---

## 🎯 Key Concepts

### Singleton Pattern
```
First creation:  new Container() → Creates all instances
Later access:    container.projectController → Returns same instance
Even later:      container.projectController → Still same instance

Result: Only ONE instance of each service/controller exists
```

### Dependency Injection
```
Without DI:
  Class creates its own dependencies → Hard to test

With DI (this file):
  Dependencies injected in constructor → Easy to test with mocks
  
Example:
  // With DI:
  new ProjectService(mockRepository) → Can inject mock for testing
  
  // Without DI:
  new ProjectService() → Internally creates real repository → Can't mock
```

### Inversion of Control (IoC)
```
Normal:  Each class responsible for creating dependencies
  └─ Tight coupling, hard to change

Container:  Container responsible for creating all dependencies
  └─ Loose coupling, easy to change
```

---

## 📋 What Gets Created

| Class | Layer | Dependencies | Count |
|-------|-------|-------------|-------|
| ProjectRepository | Infrastructure | None | 1 |
| AreaRepository | Infrastructure | None | 1 |
| CompanyRepository | Infrastructure | None | 1 |
| ProjectService | Application | ProjectRepository | 1 |
| AreaService | Application | AreaRepository | 1 |
| CompanyService | Application | CompanyRepository | 1 |
| HealthService | Application | None | 1 |
| ProjectController | Presentation | ProjectService, AreaService | 1 |
| AreaController | Presentation | AreaService | 1 |
| CompanyController | Presentation | CompanyService | 1 |
| HealthController | Presentation | HealthService | 1 |
| **TOTAL** | **ALL** | **AS SHOWN** | **11 instances** |

---

## 💡 Why This Pattern?

### Problem Without Container
```typescript
// Every controller creates its own service
class ProjectController {
  private projectService = new ProjectService(
    new ProjectRepository() // Creates new repository each time!
  );
}

// Issues:
// 1. Multiple instances of same service ❌
// 2. Hard to test (can't inject mock) ❌
// 3. Hard to change how services are created ❌
// 4. Scattered object creation logic ❌
```

### Solution With Container
```typescript
// Container creates once
const container = new Container();
//   All services/controllers use same instances

// Benefits:
// 1. Single instance throughout app ✅
// 2. Easy to test (inject mocks) ✅
// 3. Change creation logic in one place ✅
// 4. All dependencies visible here ✅
```

---

## 🔧 How to Modify

### Add New Repository

```typescript
// Step 1: Import
import { NewRepository } from './infrastructure/repositories';

// Step 2: Create in container
private readonly newRepository = new NewRepository();

// Step 3: Inject into service
private readonly newService = new NewService(this.newRepository);
```

### Add New Service

```typescript
// Step 1: Import
import { NewService } from './application/services';

// Step 2: Create in container (with dependencies)
private readonly newService = new NewService(
  this.projectRepository,  // if needed
  this.areaRepository      // if needed
);

// Step 3: Inject into controller
readonly newController = new NewController(this.newService);
```

---

## 🧪 Testing with Container

### Normal Testing (with real database)
```typescript
const app = createApp(); // Uses real container → real database
```

### Mock Testing (with fake data)
```typescript
// Create mock repository
const mockRepository = {
  findAll: jest.fn().mockResolvedValue([ /* fake data */ ]);
};

// Create service with mock
const service = new ProjectService(mockRepository);

// Test without touching database ✅
```

---

## 📊 Data Flow Through Container

```
HTTP Request arrives
    ↓
app.ts calls: container.projectController
    ↓
Gets ProjectController instance
    ├─ Which has ProjectService injected
    │  ├─ Which has ProjectRepository injected
    │  │  └─ Which accesses database
    │  └─ Which transforms data
    └─ Which formats HTTP response
    ↓
Response sent to client
```

---

## ✅ Checklist: Container Setup

- ✅ All repositories created
- ✅ All services created with repositories
- ✅ All controllers created with services
- ✅ Container instance exported
- ✅ Singleton pattern enforced
- ✅ Dependencies properly injected

---

## 💡 Interview Insight

**Question**: "How do you manage dependencies in this application?"

**Answer**: 
"We use a Container pattern for dependency injection. It's a single class that creates all instances once and stores them as singletons. When the app starts, the container creates repositories first (infrastructure), then services with those repositories (application), then controllers with those services (presentation). This ensures all layers are properly wired and dependencies flow from infrastructure through application to presentation."

---
