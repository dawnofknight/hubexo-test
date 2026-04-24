# Exceptions - Domain Layer Error Handling

## Detailed Annotation

---

## 📋 File Overview

**File**: `backend/src/domain/exceptions/domain.exceptions.ts`
**Layer**: Domain (Business Logic)
**Pattern**: Exception hierarchy
**Responsibility**: Define domain-specific exceptions

---

## 🎯 Exception Purpose

| What | Why | Where |
|------|-----|-------|
| **Domain Exceptions** | Represent business rule violations | Services throw when rules break |
| **Type Safety** | Use exception hierarchy | Catch specific exception types |
| **Context Capture** | Store error details | Error handler uses for logging |
| **Decoupling** | Domain doesn't know HTTP | Same exception works in CLI, jobs, APIs |

---

## 📦 Base Exception Class

### Purpose
Base class for all domain exceptions

```typescript
export class DomainException extends Error {
  // ├─ Extends JavaScript Error class
  // ├─ Base class for domain-specific exceptions
  // └─ Can catch all domain errors: catch (err: DomainException)
  
  constructor(message: string) {
    // ├─ Parameter: error message
    // └─ Describes what went wrong
    
    super(message);
    // ├─ Call parent Error constructor
    // ├─ Error now has message property
    // └─ Accessible via err.message
    
    this.name = 'DomainException';
    // ├─ Set error type name
    // ├─ Visible in stack traces
    // └─ Helpful for debugging
  }
}
```

### Benefits of Base Class
```
All domain errors inherit from DomainException
    ├─ Can catch all: catch (err: DomainException)
    ├─ Error handler checks: instanceof DomainException
    └─ Distinguishes domain errors from system errors

Example:
  try {
    // service throws NotFoundException (extends DomainException)
  } catch (err: DomainException) {
    // Catches it! ✅
  } catch (err: Error) {
    // Also catches it (Error is parent) ✅
  }
```

---

## 🔍 Not Found Exception

### Purpose
Thrown when entity doesn't exist

### When Thrown
- Project with ID "123" doesn't exist
- Area "London" doesn't exist
- Company not found

### Exception Definition

```typescript
export class NotFoundException extends DomainException {
  // ├─ Extends DomainException
  // └─ Specific exception for "not found" cases
  
  public readonly entityName: string;
  // ├─ What entity wasn't found?
  // ├─ public readonly: accessible, can't be changed
  // └─ e.g., "Project"
  
  public readonly identifier: string;
  // ├─ What was being searched for?
  // └─ e.g., "proj-123"
  
  constructor(entityName: string, identifier: string) {
    // ├─ Parameters: entity type and ID
    // └─ Example: new NotFoundException('Project', 'proj-123')
    
    super(`${entityName} not found: ${identifier}`);
    // ├─ Create error message: "Project not found: proj-123"
    // └─ Message passed to parent DomainException
    
    this.name = 'NotFoundException';
    // ├─ Set error type name
    // └─ For stack traces and debugging
    
    this.entityName = entityName;
    // └─ Store entity name for error handling
    
    this.identifier = identifier;
    // └─ Store identifier for error handling
  }
}
```

### Usage Example

```typescript
// In service:
const project = await this.repository.findById(projectId);
if (!project) {
  throw new NotFoundException('Project', projectId);
  // Message: "Project not found: proj-123"
}

// In error handler:
if (err instanceof NotFoundException) {
  // Can access:
  // - err.entityName → "Project"
  // - err.identifier → "proj-123"
  // - err.message → "Project not found: proj-123"
  
  res.status(404).json({
    success: false,
    error: {
      code: 'PROJECT_NOT_FOUND',
      message: err.message
    }
  });
}
```

---

## ✔️ Validation Exception

### Purpose
Thrown when input fails validation

### When Thrown
- Area filter doesn't exist
- Keyword too long
- Page number negative
- Company not found

### Exception Definition

```typescript
export class ValidationException extends DomainException {
  // ├─ Extends DomainException
  // └─ Specific exception for validation failures
  
  public readonly field: string;
  // ├─ Which field failed validation?
  // ├─ public readonly: accessible, can't be changed
  // └─ e.g., "area", "page", "keyword"
  
  public readonly reason: string;
  // ├─ Why did it fail?
  // └─ e.g., "Area does not exist", "Must be positive"
  
  constructor(field: string, reason: string) {
    // ├─ Parameters: field name and failure reason
    // └─ Example: new ValidationException('area', 'Area not found')
    
    super(`Validation failed for ${field}: ${reason}`);
    // ├─ Create error message: "Validation failed for area: Area not found"
    // └─ Message passed to parent DomainException
    
    this.name = 'ValidationException';
    // ├─ Set error type name
    // └─ For stack traces and debugging
    
    this.field = field;
    // └─ Store field name for error handling
    
    this.reason = reason;
    // └─ Store reason for error handling
  }
}
```

### Usage Example

```typescript
// In service:
const areaExists = await this.areaService.exists(area);
if (!areaExists) {
  throw new ValidationException('area', 'Area does not exist');
  // Message: "Validation failed for area: Area does not exist"
}

// In error handler:
if (err instanceof ValidationException) {
  // Can access:
  // - err.field → "area"
  // - err.reason → "Area does not exist"
  // - err.message → "Validation failed for area: Area does not exist"
  
  res.status(400).json({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: err.message
    }
  });
}
```

---

## 🔄 Exception Hierarchy

```
Error (JavaScript built-in)
    ↑
    │ extends
    │
DomainException
    ↑
    ├─ NotFoundException (entity not found)
    │
    └─ ValidationException (validation failed)
```

### Type Checking

```typescript
// Throw NotFoundException
throw new NotFoundException('Project', 'proj-123');

// Can catch by specific type:
try {
  // ...
} catch (err: NotFoundException) {
  // Handle not found
}

// Can catch by base type:
try {
  // ...
} catch (err: DomainException) {
  // Handle any domain error
}

// Can catch all:
try {
  // ...
} catch (err) {
  // err could be any type
}
```

---

## 🎯 Exception Flow

```
Service Method
    ├─ Business logic runs
    ├─ Check business rule
    └─ If violated: throw exception
    
        Example:
        const project = await repo.findById(id);
        if (!project) {
            throw new NotFoundException('Project', id);
        }
    
        ↓
        
Controller Try-Catch
    ├─ Calls service
    ├─ Service throws
    ├─ Caught by catch block
    └─ Call: next(error)
    
        Example:
        try {
            await projectService.getById(id);
        } catch (error) {
            next(error);  // ← Pass to error handler
        }
    
        ↓
        
Error Handler Middleware
    ├─ Receives error
    ├─ Check exception type
    ├─ Map to HTTP status
    └─ Send error response
    
        Example:
        if (err instanceof NotFoundException) {
            res.status(404).json({
                error: { code: 'NOT_FOUND', message: err.message }
            });
        }
    
        ↓
        
HTTP Response to Client
    {
        "success": false,
        "error": {
            "code": "NOT_FOUND",
            "message": "Project not found: proj-123"
        }
    }
```

---

## 🔐 Why Domain Layer Exceptions?

### Without Domain Exceptions
```typescript
// Service:
if (!project) {
  res.status(404).json({ error: '...' });
  // ❌ Service shouldn't know about HTTP!
}
```

### With Domain Exceptions
```typescript
// Service:
if (!project) {
  throw new NotFoundException('Project', id);
  // ✅ Service throws domain exception (no HTTP)
}

// Controller catches and delegates to error handler
// Error handler converts to HTTP

// Benefits:
// ✅ Service reusable in CLI, jobs, other APIs
// ✅ Decoupled from HTTP
// ✅ Same exception, different presentation
```

---

## 📊 Exception Properties Usage

### NotFoundException

```typescript
const err = new NotFoundException('Project', 'proj-123');

err.message        // "Project not found: proj-123"
err.name           // "NotFoundException"
err.entityName     // "Project"
err.identifier     // "proj-123"
err instanceof NotFoundException      // true
err instanceof DomainException        // true
err instanceof Error                  // true
```

### ValidationException

```typescript
const err = new ValidationException('area', 'Area not found');

err.message        // "Validation failed for area: Area not found"
err.name           // "ValidationException"
err.field          // "area"
err.reason         // "Area not found"
err instanceof ValidationException    // true
err instanceof DomainException        // true
err instanceof Error                  // true
```

---

## ✅ Checklist: Exception Implementation

- ✅ Base DomainException extends Error
- ✅ Specific exceptions extend DomainException
- ✅ Constructor sets name property
- ✅ Constructor stores contextual data
- ✅ Error message is descriptive
- ✅ Exceptions contain useful metadata
- ✅ Used consistently across domain layer

---

## 💡 Interview Insights

**Question**: "Why have custom domain exceptions?"

**Answer**: "Domain exceptions represent business rule violations. By creating a hierarchy, we can distinguish domain errors (things that should happen based on business rules) from system errors (things that shouldn't happen). The error handler can then map them to appropriate HTTP status codes. This also lets us use the same exceptions in non-HTTP contexts like CLI or background jobs."

**Question**: "Why store metadata in exceptions?"

**Answer**: "Storing metadata like entityName and identifier allows the error handler to make better decisions. For example, if we had multiple not-found scenarios, we could show different messages or HTTP status codes based on the entityName. It also helps with error logging and debugging."

---

## 🎓 When to Throw Each Exception

### Throw NotFoundException When:
- Searching for entity by ID and it doesn't exist
- Entity needed for operation but missing
- Precondition not met (entity must exist)

### Throw ValidationException When:
- Input data doesn't meet requirements
- Business rule validation failed
- Precondition not met (valid input required)

### Example Scenarios

```typescript
// NotFoundException scenario:
const project = await repo.findById(projectId);
if (!project) {
  throw new NotFoundException('Project', projectId);
}

// ValidationException scenario:
const areaExists = await repo.areaExists(area);
if (!areaExists) {
  throw new ValidationException('area', 'Area does not exist');
}

// Both get 404, but for different reasons:
// - NotFoundException: "Project not found" (entity doesn't exist)
// - ValidationException: "Area not found" (input invalid)

// Or could be 400 for validation, 404 for not found
```

---

## 📍 Exception Message Best Practices

### Good Messages
```
"Project not found: proj-123"          ✅ Specific
"Validation failed for area: Area not found"  ✅ Descriptive
```

### Bad Messages
```
"Error"                                ❌ Too vague
"Project doesn't exist"                ⚠️ Lacks context (which project?)
"Invalid input"                        ⚠️ Too generic
```

---
