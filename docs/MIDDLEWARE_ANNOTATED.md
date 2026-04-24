# Middleware - Error Handling & Logging

## Detailed Annotation

---

## 📋 File Overview

**File**: `backend/src/presentation/middlewares/error.middleware.ts`
**Layer**: Presentation (Cross-Cutting Concerns)
**Pattern**: Middleware pattern, Exception handling
**Responsibility**: Centralized error handling and logging

---

## 🎯 Middleware Purpose

| Middleware | Purpose | When Runs |
|-----------|---------|-----------|
| **Error Handler** | Catch exceptions, convert to HTTP | When exception thrown |
| **404 Handler** | Catch unmatched routes | When no route matches |
| **Request Logger** | Log incoming requests | Every request |

---

## 📦 Error Codes Enumeration

```typescript
export enum ErrorCode {
  INVALID_PAGINATION = 'INVALID_PAGINATION',
  // └─ page/per_page parameters invalid (e.g., negative number)
  
  AREA_NOT_FOUND = 'AREA_NOT_FOUND',
  // └─ Requested area doesn't exist in database
  
  PROJECT_NOT_FOUND = 'PROJECT_NOT_FOUND',
  // └─ Requested project doesn't exist
  
  DATABASE_ERROR = 'DATABASE_ERROR',
  // └─ Database query failed
  
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  // └─ Unexpected server error
  
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  // └─ Input validation failed
  
  RATE_LIMITED = 'RATE_LIMITED'
  // └─ Too many requests from client
}
```

**Purpose**: Machine-readable error codes for client-side handling

---

## 🛡️ Custom API Exception Class

```typescript
export class ApiException extends Error {
  // ├─ Extends JavaScript Error class
  // ├─ Adds API-specific properties
  // └─ Error handler can identify as API error
```

### Constructor

```typescript
constructor(
  public readonly statusCode: number,
  // ├─ HTTP status code (400, 404, 500, etc.)
  // ├─ public: accessible outside class
  // └─ readonly: cannot be changed
  
  public readonly errorCode: string,
  // ├─ Machine-readable error code
  // └─ For client-side handling
  
  message: string,
  // └─ Human-readable error message
  
  public readonly details?: string
  // └─ Optional additional error details
) {
  super(message);           // Call parent Error constructor
  this.name = 'ApiException';  // Set error type name
}
```

**Why Custom Exception?**
```
Standard Error:     ❌ No statusCode property
Custom ApiException: ✅ Has statusCode for HTTP response
```

---

## 🔧 Global Error Handler Middleware

### Purpose
Centralized exception handling for entire application

### Signature

```typescript
export function errorHandler(
  err: Error,                    // The exception object
  _req: Request,                 // Request (prefixed _, unused)
  res: Response,                 // Response object to send
  _next: NextFunction            // Next function (prefixed _, unused)
): void {
  // ├─ 4 parameters: tells Express this is error handler
  // ├─ If only 3 params: Express treats as regular middleware
  // └─ Signature tells Express to call on error
```

**Why 4 Parameters?**
```
express.js checks function.length
- 3 params: regular middleware (req, res, next)
- 4 params: error middleware (err, req, res, next)
```

---

## 📍 Step 1: Log Error

```typescript
console.error('Error:', err);
// ├─ Print error to console/logs
// ├─ Visible in server logs for debugging
// ├─ Helps identify production issues
// └─ Essential for monitoring/alerting
```

---

## 📍 Step 2: Check Exception Type 1 - ApiException

```typescript
if (err instanceof ApiException) {
  // └─ Check if error is custom ApiException
  
  const response: ApiErrorDTO = {
    success: false,
    error: {
      code: err.errorCode,      // Machine-readable code
      message: err.message      // Human-readable message
    }
  };
  
  res.status(err.statusCode).json(response);
  // ├─ Use statusCode from exception
  // ├─ Send consistent error response
  // └─ Exit early (don't check other exception types)
  
  return;
}
```

---

## 📍 Step 3: Check Exception Type 2 - NotFoundException

```typescript
if (err instanceof NotFoundException) {
  // └─ Check if entity not found
  
  const response: ApiErrorDTO = {
    success: false,
    error: {
      code: ErrorCode.PROJECT_NOT_FOUND,
      // ├─ Could be more specific: err.entityName
      // └─ For now, hardcoded to PROJECT_NOT_FOUND
      
      message: err.message
      // └─ e.g., "Project not found: proj-123"
    }
  };
  
  res.status(404).json(response);  // 404 = Not Found
  return;
}
```

---

## 📍 Step 4: Check Exception Type 3 - ValidationException

```typescript
if (err instanceof ValidationException) {
  // └─ Check if validation failed
  
  const response: ApiErrorDTO = {
    success: false,
    error: {
      code: ErrorCode.VALIDATION_ERROR,
      message: err.message
      // └─ e.g., "Validation failed for area: Area not found"
    }
  };
  
  res.status(400).json(response);  // 400 = Bad Request
  return;
}
```

---

## 📍 Step 5: Generic Error (Fallback)

```typescript
// Any error that didn't match above patterns
const response: ApiErrorDTO = {
  success: false,
  error: {
    code: ErrorCode.INTERNAL_ERROR,
    // └─ Generic error code
    
    message: AppConfig.isDevelopment()
      ? err.message
      // ├─ Development: show actual error
      // ├─ Helps debugging
      // └─ "TypeError: Cannot read property 'name' of undefined"
      
      : 'An unexpected error occurred'
      // ├─ Production: hide details
      // ├─ Security: don't expose implementation
      // └─ "An unexpected error occurred"
  }
};

res.status(500).json(response);  // 500 = Internal Server Error
```

**Why Hide Errors in Production?**
```
Development (safe):
  "Connection refused on localhost:5432"
  → Helpful for debugging
  
Production (dangerous):
  "Connection refused on localhost:5432"
  → Reveals server architecture to attackers ❌
  
Production (safe):
  "An unexpected error occurred"
  → Doesn't leak information ✅
```

---

## 🔍 Error Handler Execution Flow

```
Exception thrown somewhere in app
    ↓
Controller catch block: catch (error) { next(error); }
    ↓
Express calls error handler middleware
    ↓
Check: isinstance ApiException? → Handle with statusCode
    ↓ No
Check: isinstance NotFoundException? → Handle with 404
    ↓ No
Check: instanceof ValidationException? → Handle with 400
    ↓ No
Fallback: Generic error → Handle with 500
    ↓
Response sent to client
```

---

## ⚠️ 404 Not Found Handler

### Purpose
Handle requests that don't match any route

```typescript
export function notFoundHandler(
  _req: Request,
  res: Response
): void {
  const response: ApiErrorDTO = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found'
    }
  };
  
  res.status(404).json(response);  // 404 = Not Found
}
```

**When Does This Run?**
```
GET /api/invalid-endpoint
    ↓
No route matches
    ↓
Pass through all route handlers
    ↓
notFoundHandler middleware executes
    ↓
404 response sent
```

**Order in app.ts**:
```
app.use(createHealthRoutes(...));     // Routes
app.use(createProjectRoutes(...));    // Routes
// ... other routes ...
app.use(notFoundHandler);             // Unmatched
app.use(errorHandler);                // Exceptions
// ^ Must be last two in order
```

---

## 📝 Request Logger Middleware

### Purpose
Log all incoming requests for monitoring and debugging

```typescript
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const timestamp = new Date().toISOString();
  // ├─ Current time in ISO format
  // └─ e.g., "2024-04-24T10:30:45.123Z"
  
  const method = req.method;
  // ├─ HTTP method: GET, POST, PUT, DELETE, etc.
  // └─ e.g., "GET"
  
  const url = req.originalUrl;
  // ├─ Full URL including query string
  // └─ e.g., "/api/projects?area=London&page=1"
  
  console.log(`[${timestamp}] ${method} ${url}`);
  // └─ Log entry visible in server console
  
  next();
  // ├─ Call next middleware
  // ├─ IMPORTANT: don't forget next()!
  // └─ Without it, request hangs (next middleware never called)
}
```

**Example Logs**:
```
[2024-04-24T10:30:45.123Z] GET /api/projects
[2024-04-24T10:30:46.456Z] GET /api/projects/proj-123
[2024-04-24T10:30:47.789Z] GET /health
[2024-04-24T10:30:48.012Z] GET /api/projects?area=London
```

---

## 📊 Middleware Execution Order

```
Request arrives
    ↓
1. CORS middleware
    ↓
2. JSON parser
    ↓
3. Rate limiter
    ↓
4. Request logger ← requestLogger
    ↓
5. Routes
    ├─ If route matched:
    │  └─ Execute controller
    └─ If exception:
       └─ Jump to error handler
    ↓
6. 404 handler ← notFoundHandler
    ├─ If route not found:
    │  └─ Send 404
    └─ If route found, doesn't run
    ↓
7. Error handler ← errorHandler
    ├─ If exception:
    │  └─ Convert to HTTP error response
    └─ If no exception, doesn't run
    ↓
Response sent to client
```

---

## 🎯 Error Response Examples

### Success Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {...}
}
```

### Not Found Error
```json
{
  "success": false,
  "error": {
    "code": "PROJECT_NOT_FOUND",
    "message": "Project not found: proj-123"
  }
}
```

### Validation Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed for area: Area does not exist"
  }
}
```

### Rate Limited Error
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests, please try again later."
  }
}
```

### Server Error (Development)
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "TypeError: Cannot read property 'name' of undefined"
  }
}
```

### Server Error (Production)
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

---

## ✅ Checklist: Middleware Implementation

- ✅ Error codes enumeration defined
- ✅ ApiException class extends Error
- ✅ Error handler identifies exception types
- ✅ Different status codes for different errors
- ✅ 404 handler for unmatched routes
- ✅ Request logger logs all requests
- ✅ Middleware in correct order in app.ts

---

## 💡 Interview Insights

**Question**: "How do you handle errors?"

**Answer**: "Errors are thrown in domain layer (business rules), caught by controllers, and delegated to a centralized error handler middleware. The error handler checks the exception type and returns appropriate HTTP status codes. This keeps error handling logic in one place and ensures consistent error responses."

**Question**: "Why centralized error handling?"

**Answer**: "Centralizing error handling ensures all errors are handled consistently. Without it, each endpoint would need its own error handling code, leading to inconsistencies and duplication. A centralized approach makes it easier to add global error handling (e.g., error monitoring, logging) in the future."

---
