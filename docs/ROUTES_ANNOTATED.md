# Project Routes - Detailed Annotation

## Endpoint Definitions & Route Factory

---

## 📋 File Overview

**File**: `backend/src/presentation/routes/project.routes.ts`
**Layer**: Presentation (HTTP Layer)
**Pattern**: Route factory function with middleware chaining
**Responsibility**: Define endpoints and apply validation middleware

---

## 🎯 Routes Purpose

| What | Why | Where |
|------|-----|-------|
| **Define Endpoints** | Map URLs to handlers | Express router patterns |
| **Chain Middleware** | Apply validation per route | Before controller executes |
| **Document API** | Swagger/OpenAPI specs | API documentation |
| **Organize** | Group related routes | All project routes in one file |

---

## 📦 Imports

```typescript
import { Router } from 'express';
// ├─ Router: mini Express app for routing
// ├─ Each resource (projects, areas, etc.) gets a Router
// └─ Routers mounted at specific paths in main app
```

```typescript
import { ProjectController } from '../controllers';
// ├─ Import controller that handles requests
// ├─ Controller methods: getProjects, getProjectById
// └─ Dependency injected from container
```

```typescript
import { validatePagination, validateKeyword } from '../middlewares';
// ├─ Validation middleware for this route
// ├─ validatePagination: check page/per_page are valid
// ├─ validateKeyword: check keyword length
// └─ Applied before controller
```

---

## 🏗️ Factory Function

```typescript
export function createProjectRoutes(controller: ProjectController): Router {
  // ├─ Factory pattern: function returns configured router
  // ├─ Parameter: controller (dependency injected)
  // ├─ Returns: configured Express Router
  // └─ Called from app.ts: app.use('/api/projects', createProjectRoutes(container.projectController))
```

**Why Factory Pattern?**
```
Benefits:
- ✅ Dependency injection of controller
- ✅ Can be tested independently
- ✅ Reusable: can call multiple times with different controllers
- ✅ Keeps routes organized per resource
```

---

## 🚀 Create Router Instance

```typescript
const router = Router();
// ├─ Create new Express Router
// ├─ Router is mini Express app for routing
// ├─ Handles routing relative to mount point
// └─ Later mounted at /api/projects in app.ts
```

---

## 🛣️ Route 1: List Projects with Filtering

### Full Endpoint Definition

```typescript
router.get(
  '/',                           // Path (relative to mount point)
  validatePagination,            // Middleware 1: validate pagination
  validateKeyword,               // Middleware 2: validate keyword
  controller.getProjects         // Handler: controller method
);
// ├─ GET /api/projects (when mounted at /api/projects)
// ├─ Middlewares execute in order before controller
// └─ If middleware rejects, controller doesn't run
```

### What's the '/' path?

```
Mount point in app.ts:  app.use('/api/projects', router)
Route in this file:     router.get('/', ...)
Result:                 GET /api/projects
                                  ↑
                        Combination of mount point + route path
```

### Middleware Chain Execution

```
Request: GET /api/projects?page=1&per_page=20&keyword=office

Step 1: validatePagination middleware
  - Check page is valid number
  - Check per_page is valid number
  - Continue if valid, otherwise send error

Step 2: validateKeyword middleware
  - Check keyword length <= 255
  - Continue if valid, otherwise send error

Step 3: controller.getProjects
  - All validation passed
  - Extract parameters
  - Call service
  - Send response
```

---

## 🛣️ Route 2: Get Single Project by ID

### Full Endpoint Definition

```typescript
router.get(
  '/:id',                        // Path with parameter
  controller.getProjectById      // Handler: controller method
);
// ├─ GET /api/projects/proj-123 (when mounted at /api/projects)
// ├─ :id is path parameter placeholder
// ├─ Express extracts value: req.params.id = "proj-123"
// └─ No validation middleware (ID is just looked up)
```

### Path Parameters vs Query Parameters

```
Query Parameters:
  GET /api/projects?area=London&page=1
  Accessed: req.query = { area: "London", page: "1" }
  Type: string (until parsed)

Path Parameters:
  GET /api/projects/proj-123
  Accessed: req.params = { id: "proj-123" }
  Type: string
  
Both are strings and need type conversion if using as numbers
```

---

## 🔄 Return Router

```typescript
return router;
// ├─ Return configured router with all routes
// ├─ Caller mounts it: app.use('/api/projects', router)
// └─ Now routing is ready for requests
```

---

## 📍 Complete Request Flow

### Scenario: GET /api/projects?area=London&keyword=office&page=1&per_page=20

```
Express App (app.ts)
    ├─ Route matches: /api/projects
    └─ Routes configured by: createProjectRoutes(container.projectController)
    
This Router:
    ├─ Route matched: GET /api/projects
    ├─ Router found in mounted routes
    ├─ Call: router.get('/', validations, controller.getProjects)
    
Middleware Chain:
    ├─ validatePagination runs
    │  └─ Validates page=1, per_page=20
    │
    ├─ validateKeyword runs
    │  └─ Validates keyword=office
    │
    └─ controller.getProjects runs
       └─ All validation passed, proceed

Controller:
    ├─ Extract: area="London", keyword="office", page="1", per_page="20"
    ├─ Parse: pageNum=1, perPageNum=20
    ├─ Call: projectService.getProjects({...})
    └─ Return: JSON response

Response:
    └─ HTTP 200 OK with projects data
```

---

## 📊 Route Structure Summary

| Route | Method | Middleware | Purpose |
|-------|--------|-----------|---------|
| `/` | GET | validatePagination, validateKeyword | List all projects |
| `/:id` | GET | (none) | Get single project |

---

## 🔗 Swagger Documentation

### How It Works

The commented JSDoc blocks above routes contain `@swagger` annotations. These are used by Swagger UI to generate interactive API documentation.

### Example Swagger Annotation

```typescript
/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get construction projects
 *     tags: [Projects]
 *     parameters:
 *       - in: query
 *         name: area
 *         schema:
 *           type: string
 *         description: Filter by area
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Search keyword
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: per_page
 *         schema:
 *           type: integer
 *         description: Items per page
 */
```

**Generates**:
- API documentation at `/api-docs`
- Interactive "Try it out" interface
- Parameter validation documentation
- Response example documentation

---

## 🎯 Route Design Principles

### RESTful Endpoints

```
GET /api/projects           ← Get list of all
GET /api/projects/:id       ← Get specific one
POST /api/projects          ← Create new (not implemented)
PUT /api/projects/:id       ← Update (not implemented)
DELETE /api/projects/:id    ← Delete (not implemented)
```

### Current Implementation

```
✅ GET /api/projects        - Implemented
✅ GET /api/projects/:id    - Implemented
❌ POST /api/projects       - Not implemented
❌ PUT /api/projects/:id    - Not implemented
❌ DELETE /api/projects/:id - Not implemented
```

---

## 🔧 How to Add New Route

### Example: DELETE /api/projects/:id

```typescript
router.delete(
  '/:id',
  controller.deleteProject  // Would need this method in controller
);
```

### Example: POST /api/projects

```typescript
router.post(
  '/',
  validateProjectBody,      // Validate request body
  controller.createProject  // Would need this method in controller
);
```

---

## 📐 Middleware vs Handler

### Difference

```
Middleware (validatePagination):
  - Receives (req, res, next)
  - Can modify request
  - Must call next() to continue
  - If error, don't call next() and send response

Handler (controller.getProjects):
  - Receives (req, res, next)
  - Executes main logic
  - Should send response OR call next(error)
  - Called after all middleware pass
```

### Order Matters

```
Request arrives
    ↓
router.get('/', middleware1, middleware2, handler)
                    ↓           ↓           ↓
Request goes through middleware1
    - Check something
    - Call next()
    ↓
Request goes through middleware2
    - Check something else
    - Call next()
    ↓
Request goes through handler
    - Process request
    - Send response
```

---

## ✅ Checklist: Routes Implementation

- ✅ Factory function accepts controller
- ✅ All routes defined with correct HTTP methods
- ✅ Middleware applied to appropriate routes
- ✅ Path parameters defined correctly
- ✅ Query parameters documented
- ✅ Return router for mounting
- ✅ Swagger documentation present

---

## 💡 Interview Insights

**Question**: "How are routes organized?"

**Answer**: "Each resource (projects, areas, companies) has its own routes file that creates a router with all endpoints for that resource. The factory function accepts a controller (dependency injected), defines all routes with appropriate middleware, and returns a configured router that's mounted in the main app.ts file."

**Question**: "Why use routers instead of defining routes in app.ts?"

**Answer**: "Routers keep related routes organized in separate files. This makes the codebase more scalable and maintainable. As you add more resources, you just add another router file instead of cluttering app.ts."

---
