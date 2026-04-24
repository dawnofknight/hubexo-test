# Project Controller - Detailed Annotation

## HTTP Request Handler & Presentation Layer

---

## 📋 File Overview

**File**: `backend/src/presentation/controllers/project.controller.ts`
**Layer**: Presentation (HTTP Layer)
**Pattern**: Controller pattern for request handling
**Responsibility**: Handle HTTP, delegate business logic to services

---

## 🎯 Controller Purpose

| What | Why | Where |
|------|-----|-------|
| **Parse HTTP** | Extract data from requests | req.query, req.params, req.body |
| **Validate Input** | Check parameters are valid | Before calling service |
| **Call Service** | Delegate business logic | Service knows what to do |
| **Format Response** | Prepare HTTP response | res.json() with status code |
| **Error Handling** | Catch exceptions | Pass to error handler |

---

## 📦 Imports

```typescript
import { Request, Response, NextFunction } from 'express';
// ├─ Request: incoming HTTP request object
// ├─ Response: outgoing HTTP response object
// ├─ NextFunction: pass control to next middleware/handler
// └─ All types from Express framework
```

```typescript
import { ProjectService } from '../../application/services';
// ├─ Import service for project operations
// ├─ Contains business logic (getProjects, getProjectById)
// └─ Injected via constructor
```

```typescript
import { AreaService } from '../../application/services';
// ├─ Import service for area operations
// ├─ Used for validating areas exist
// └─ Injected via constructor
```

```typescript
import { AppConfig } from '../../config/app.config';
// ├─ Import configuration constants
// ├─ Access: AppConfig.defaultPerPage for pagination
// └─ Centralized configuration management
```

---

## 🏗️ Class Definition

```typescript
export class ProjectController {
  // Handles:
  // 1. GET /api/projects
  // 2. GET /api/projects/:id
}
```

---

## 🔌 Constructor & Dependencies

```typescript
constructor(
  private readonly projectService: ProjectService,
  private readonly areaService: AreaService
) {}
// ├─ Injected dependency 1: ProjectService
// ├─ Injected dependency 2: AreaService (for validation)
// ├─ private readonly: cannot be changed
// └─ Both services provide business logic
```

### Why Two Services?
```
ProjectService: ✅ Get projects, search, paginate
AreaService:    ✅ Validate area exists
```

---

## 🔧 Endpoint 1: GET /api/projects

### Method Definition

```typescript
getProjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // ├─ Arrow function: preserves 'this' binding
  // ├─ async: method returns Promise
  // ├─ Parameters:
  // │  ├─ req: incoming HTTP request
  // │  ├─ res: outgoing HTTP response
  // │  └─ next: pass to error handler
  // └─ Returns: void (sends response via res)
```

### Why Arrow Function?
```
Regular function:    this refers to caller context ❌
Arrow function:      this refers to controller instance ✅
When used in routes: Need correct 'this' reference
```

---

## 📍 Step 1: Extract Query Parameters

```typescript
try {
  const { area, keyword, company, page, per_page } = req.query;
  // ├─ Destructure query string parameters
  // ├─ Example URL: /api/projects?area=London&keyword=office&page=1&per_page=20
  // ├─ Results in: { area: "London", keyword: "office", page: "1", per_page: "20" }
  // └─ Note: All values are STRINGS (query strings are strings)
```

**What's in req.query?**
```
URL: /api/projects?area=London&keyword=office
req.query = {
  area: "London",      (string)
  keyword: "office"    (string)
}
```

---

## ✔️ Step 2: Validate Area (If Provided)

```typescript
  if (area && typeof area === 'string') {
  // ├─ Check if area parameter exists
  // ├─ Check if it's actually a string (type guard)
  // └─ Only validate if both conditions true
  
    await this.areaService.validateAreaExists(area);
    // ├─ Call service to validate area exists in database
    // ├─ Throws ValidationException if area doesn't exist
    // └─ Exception caught by try-catch below
  }
```

**Why Check Type?**
```
Query params could be:
- area=London          → string ✓
- area[]=London        → array ✗
- missing             → undefined ✗

Type guard ensures we only proceed with valid string
```

---

## 📊 Step 3: Parse Pagination Parameters

```typescript
  let pageNum: number | undefined;
  let perPageNum: number | undefined;
  
  if (page !== undefined || per_page !== undefined) {
  // ├─ Check if pagination requested (at least one param provided)
  // └─ Both page and per_page are optional
  
    pageNum = page ? parseInt(page as string, 10) : 1;
    // ├─ Parse page string to number
    // ├─ Default to 1 if not provided
    // ├─ parseInt(value, 10): radix 10 for decimal
    // └─ as string: type assertion (TypeScript cast)
    
    perPageNum = per_page ? parseInt(per_page as string, 10) : AppConfig.defaultPerPage;
    // ├─ Parse per_page string to number
    // ├─ Default to config value if not provided
    // └─ AppConfig.defaultPerPage = 20 (from config)
  }
```

**Why Parse?**
```
Query string values: "1" (string)
Need for math:      1 (number)
parseInt converts:  string → number
```

---

## 📞 Step 4: Call Service

```typescript
  const result = await this.projectService.getProjects({
    area: area as string,           // Cast to string or undefined
    keyword: keyword as string,
    company: company as string,
    page: pageNum,                  // number | undefined
    perPage: perPageNum             // number | undefined
  });
  // ├─ Call service method with all parameters
  // ├─ await: wait for database query to complete
  // ├─ Service returns: { projects: ProjectDTO[], pagination?: {} }
  // └─ Service throws: exception if area invalid
```

---

## ✅ Step 5: Send Success Response

```typescript
  res.json({
    success: true,                  // Indicates success
    data: result.projects,          // Array of project DTOs
    pagination: result.pagination   // Pagination metadata or null
  });
  // ├─ res.json(): sets Content-Type to application/json
  // ├─ Automatically serializes object to JSON
  // ├─ Sends HTTP 200 OK (default for json)
  // └─ Response sent, method complete
```

**Response Format**:
```json
{
  "success": true,
  "data": [
    {
      "project_name": "Downtown Office",
      "project_start": "2023-01-01",
      ...
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 20,
    "total_items": 45,
    "total_pages": 3,
    "has_next": true,
    "has_prev": false
  }
}
```

---

## 🚨 Error Handling

```typescript
} catch (error) {
  // ├─ Catches all exceptions (sync and async)
  // ├─ Examples:
  // │  ├─ ValidationException (area invalid)
  // │  ├─ NotFoundException (area not found)
  // │  └─ Any other error
  // └─ All caught here
  
  next(error);
  // ├─ Pass error to next middleware (error handler)
  // ├─ Express calls error handler middleware
  // ├─ Error handler determines HTTP status
  // └─ Error handler formats error response
}
```

**Error Flow**:
```
Exception thrown
    ↓
Caught by catch
    ↓
next(error) called
    ↓
Error handler middleware receives error
    ↓
Error handler checks exception type
    ├─ ValidationException → 400 Bad Request
    ├─ NotFoundException → 404 Not Found
    └─ Other → 500 Internal Server Error
    ↓
Error response sent
```

---

## 🔧 Endpoint 2: GET /api/projects/:id

### Method Definition

```typescript
getProjectById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    // ├─ Destructure path parameter
    // ├─ URL: /api/projects/proj-123
    // ├─ req.params = { id: "proj-123" }
    // └─ Note: Path params are strings
    
    const projects = await this.projectService.getProjectById(id);
    // ├─ Call service with project ID
    // ├─ Service throws NotFoundException if not found
    // ├─ Service returns array of ProjectWithIdDTO
    // └─ Could have multiple results if project in multiple areas
    
    res.json({
      success: true,              // Success flag
      data: projects,             // Array of projects with ID
      pagination: null            // No pagination for single project
    });
    
  } catch (error) {
    next(error);
    // ├─ Pass to error handler
    // ├─ If NotFoundException: error handler returns 404
    // └─ If other error: error handler returns 500
  }
};
```

---

## 📊 Request-Response Example

### Successful Request

```
GET /api/projects?area=London&page=1&per_page=10

↓ (Controller receives request)

1. Extract: area="London", page="1", per_page="10"
2. Type check: area is string ✓
3. Validate area: areaService.validateAreaExists("London") ✓
4. Parse: pageNum=1, perPageNum=10
5. Call service: projectService.getProjects({...})
6. Service returns: {
     projects: [...10 projects...],
     pagination: { current_page: 1, ... }
   }
7. Format response

↓

200 OK
{
  "success": true,
  "data": [...projects...],
  "pagination": {...}
}
```

### Error Request

```
GET /api/projects?area=InvalidArea

↓ (Controller receives request)

1. Extract: area="InvalidArea"
2. Type check: area is string ✓
3. Validate area: areaService.validateAreaExists("InvalidArea")
   ❌ Area doesn't exist
   Throws: ValidationException("area", "Area does not exist")
4. Caught by catch block
5. next(error) → Error handler

↓

400 Bad Request
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed for area: Area does not exist"
  }
}
```

---

## 🎯 Key Concepts

### Dependency Injection
```typescript
constructor(
  private readonly projectService: ProjectService,
  private readonly areaService: AreaService
) {}
// ├─ Services injected, not created here
// ├─ Constructor receives dependencies
// └─ Makes testing easy: inject mocks
```

### Try-Catch Pattern
```typescript
try {
  // 1. Extract parameters
  // 2. Validate input
  // 3. Call service
  // 4. Format response
} catch (error) {
  // Error caught and delegated
  next(error);  // Pass to error handler
}
// └─ All exceptions caught in one place
```

### Arrow Functions
```typescript
getProjects = async (...) => { ... }
// ├─ Arrow function = method
// ├─ this always refers to controller instance
// └─ When Express calls it, this is correct
```

### Parameter Transformation
```
HTTP request
    ↓
Query parameters (strings)
    ↓
Type-check & parse (convert to proper types)
    ↓
Call service with correct types
    ↓
Service returns data
    ↓
Format as JSON response
```

---

## ✅ Checklist: Controller Responsibilities

- ✅ Extract parameters from request
- ✅ Type check and parse parameters
- ✅ Validate input (call services if needed)
- ✅ Call appropriate service method
- ✅ Format response with correct structure
- ✅ Handle errors by delegating to error handler
- ✅ Return HTTP response or pass to error handler

---

## 💡 Interview Insights

**Question**: "What does a controller do?"

**Answer**: "A controller handles HTTP requests by extracting parameters, validating input, calling the appropriate service for business logic, and formatting the response. It's the bridge between HTTP layer and application layer—it knows about HTTP details but delegates all business logic to services."

**Question**: "Why use services instead of calling repositories directly?"

**Answer**: "Services provide business logic, can be reused across multiple controllers, and are easier to test. Controllers stay focused on HTTP concerns, services on business logic, and repositories on data access."

---
