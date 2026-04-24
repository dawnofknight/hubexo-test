# App Setup - Detailed Annotation

## Express Application Configuration & Entry Point

---

## 📋 File Overview

**File**: `backend/src/app.ts`
**Purpose**: Create and configure Express application with middleware and routes
**Pattern**: Express middleware chain pattern
**Key Concept**: Middleware execution order matters (top-to-bottom)

---

## 🔧 Imports & Dependencies

```typescript
import express, { Request, Response } from 'express';
// ↳ Import Express framework and type definitions for request/response objects
```

```typescript
import cors from 'cors';
// ↳ Import CORS middleware for handling cross-origin requests securely
```

```typescript
import rateLimit from 'express-rate-limit';
// ↳ Import rate limiting middleware to prevent abuse and DDoS attacks
```

```typescript
import swaggerUi from 'swagger-ui-express';
// ↳ Import Swagger UI for interactive API documentation interface
```

```typescript
import { AppConfig } from './config/app.config';
// ↳ Import centralized configuration (environment variables, constants)
```

```typescript
import { container } from './container';
// ↳ Import dependency injection container with all pre-created dependencies
```

```typescript
import { databaseConnection } from './infrastructure/database';
// ↳ Import singleton database connection manager
```

```typescript
import {
  createProjectRoutes,
  createAreaRoutes,
  createCompanyRoutes,
  createHealthRoutes
} from './presentation/routes';
// ↳ Import factory functions that create route handlers for each resource
```

```typescript
import {
  errorHandler,        // Middleware: centralized error handling
  notFoundHandler,     // Middleware: handles 404 not found responses
  requestLogger,       // Middleware: logs all incoming requests
  ErrorCode
} from './presentation/middlewares';
// ↳ Import middleware utilities for cross-cutting concerns
```

```typescript
import { swaggerSpec } from './swagger';
// ↳ Import OpenAPI/Swagger documentation specification
```

---

## 🚀 Main Function: createApp()

### Purpose
- Creates and configures Express application instance
- Sets up middleware chain in correct order
- Mounts all routes with their controllers
- Applies error handlers

### Key Point
**Middleware order matters!** Executed top-to-bottom for each request.

---

## Step 1️⃣: Initialize Express App

```typescript
export function createApp(): express.Application {
  const app = express();
  // ↳ Create new Express application instance
  // ↳ This is the main HTTP server object
```

---

## Step 2️⃣: CORS Middleware (Cross-Origin Security)

```typescript
  app.use(cors({ origin: AppConfig.allowedOrigins }));
  // ├─ Allow requests from specified origins only
  // ├─ Security: prevents unauthorized cross-origin requests
  // └─ Configuration comes from environment variables
```

**What it does**: 
- ✅ Validates Origin header in requests
- ✅ Adds CORS headers to responses
- ✅ Prevents browser from blocking requests

---

## Step 3️⃣: JSON Parser Middleware

```typescript
  app.use(express.json({ limit: '100kb' }));
  // ├─ Parse incoming JSON request bodies
  // ├─ Available as req.body after this middleware
  // └─ Max 100kb to prevent memory exhaustion attacks
```

**What it does**:
- ✅ Parses `Content-Type: application/json` bodies
- ✅ Rejects requests larger than 100kb
- ✅ Sets up req.body for downstream handlers

---

## Step 4️⃣: Rate Limiting (Prevent Abuse)

```typescript
  if (!AppConfig.isTest()) {
  // ├─ Only apply in non-test environments
  // └─ Skip in test mode for easier testing
```

```typescript
    app.use(
      '/api/',
      // ├─ Apply rate limiter only to API routes
      // └─ Does NOT apply to /health or /api-docs
```

```typescript
      rateLimit({
        windowMs: 60 * 1000,
        // ├─ Time window: 60 seconds
        // └─ Resets after this period
```

```typescript
        max: AppConfig.rateLimitPerMin,
        // ├─ Max requests per window
        // ├─ Typically 120 from config
        // └─ After this, returns 429 Too Many Requests
```

```typescript
        standardHeaders: true,
        // ├─ Include RateLimit-* headers in response
        // └─ Client can see remaining requests
```

```typescript
        legacyHeaders: false,
        // ├─ Don't include deprecated X-RateLimit-* headers
        // └─ Use modern standard instead
```

```typescript
        handler: (_req: Request, res: Response) => {
        // ├─ Custom handler when rate limit exceeded
        // └─ Called instead of default response
```

```typescript
          res.status(429).json({
          // ├─ HTTP 429 = Too Many Requests
          // └─ Return consistent JSON error format
```

```typescript
            success: false,
            error: {
              code: ErrorCode.RATE_LIMITED,
              message: 'Too many requests, please try again later.'
            }
          });
        }
      })
    );
  }
```

**What it does**:
- ✅ Tracks requests per client IP
- ✅ Returns 429 when limit exceeded
- ✅ Prevents DDoS and brute force attacks

---

## Step 5️⃣: Request Logger Middleware (Monitoring)

```typescript
  app.use(requestLogger);
  // ├─ Logs all incoming requests to console
  // ├─ Format: [timestamp] METHOD /path?query=string
  // ├─ Useful for debugging and performance monitoring
  // └─ Runs for every request
```

**What it logs**:
- ✅ HTTP method (GET, POST, etc.)
- ✅ Request URL and query string
- ✅ Timestamp for each request

---

## Step 6️⃣: Swagger/API Documentation

```typescript
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  // ├─ Mount Swagger UI on /api-docs endpoint
  // ├─ Serves interactive API documentation
  // ├─ URL: http://localhost:3000/api-docs
  // └─ Allows testing API endpoints from browser
```

**What it provides**:
- ✅ Interactive API documentation
- ✅ Try-it-out functionality
- ✅ Request/response examples

---

## Step 7️⃣: Route Handlers (Business Logic)

### Mount All Resource Routes

```typescript
  app.use('/health', createHealthRoutes(container.healthController));
  // ├─ Mount health check routes
  // ├─ Endpoint: GET /health
  // ├─ Controller injected from container
  // └─ No API prefix (not part of /api)
```

```typescript
  app.use('/api/projects', createProjectRoutes(container.projectController));
  // ├─ Mount project routes
  // ├─ Endpoints: GET /api/projects, GET /api/projects/:id
  // ├─ Controller: container.projectController
  // └─ Relative paths combined with mount point
```

```typescript
  app.use('/api/areas', createAreaRoutes(container.areaController));
  // ├─ Mount area routes
  // └─ Controller: container.areaController
```

```typescript
  app.use('/api/companies', createCompanyRoutes(container.companyController));
  // ├─ Mount company routes
  // └─ Controller: container.companyController
```

**What it does**:
- ✅ Routes requests to appropriate controllers
- ✅ Each controller handles specific resource
- ✅ Order of mounting doesn't matter (path-based)

---

## Step 8️⃣: Error Handlers (Fallback Layer)

### 404 Not Found Handler

```typescript
  app.use(notFoundHandler);
  // ├─ Catches any request that didn't match a route above
  // ├─ Must come AFTER all route handlers
  // ├─ Must come BEFORE global error handler
  // └─ Returns 404 with standard error response
```

### Global Error Handler

```typescript
  app.use(errorHandler);
  // ├─ Catches all exceptions thrown in controllers
  // ├─ Must be LAST middleware in the chain
  // ├─ Signature: (err, req, res, next) → 4 parameters tells Express it's error handler
  // ├─ Converts exceptions to HTTP responses
  // └─ Ensures client always gets valid JSON
```

**Order matters!**
1. Route handlers (specific paths)
2. 404 handler (unmatched paths)
3. Error handler (thrown exceptions)

---

## Step 9️⃣: Return App

```typescript
  return app;
}
// ↳ Return configured Express application instance
// ↳ Ready to be started with app.listen()
```

---

## 🔌 Main Entry Point: main()

### Purpose
- Initialize database connection
- Create Express app
- Start HTTP server
- Set up graceful shutdown

### Flow
```
Database Init → App Creation → Server Start → Wait for Shutdown Signal
```

---

## Step 1️⃣: Initialize Database

```typescript
async function main(): Promise<void> {
  try {
    await databaseConnection.getConnection();
    // ├─ Connects to SQLite database file
    // ├─ Singleton pattern: same instance reused
    // ├─ Connection cached after first call
    // └─ Waits until connection ready before continuing
    
    console.log('Database initialized');
    // └─ Confirmation message
```

**Why async?**
- Database connection is I/O operation
- Must wait for completion before accepting requests
- Ensures database ready before server starts

---

## Step 2️⃣: Create Express Application

```typescript
    const app = createApp();
    // ├─ Call function above to create and configure app
    // ├─ Sets up all middleware and routes
    // └─ App is ready but not yet listening
```

---

## Step 3️⃣: Start HTTP Server

```typescript
    app.listen(AppConfig.port, () => {
    // ├─ Start listening on port from config (default 3000)
    // ├─ Server now accepting HTTP requests
    // └─ Callback fires when server is ready
    
      console.log(`Server running at http://localhost:${AppConfig.port}`);
      // └─ User-friendly startup message
      
      console.log(`API Docs: http://localhost:${AppConfig.port}/api-docs`);
      // └─ Direct user to API documentation
    });
```

**What happens**:
- ✅ Server binds to port 3000
- ✅ Listening for incoming HTTP connections
- ✅ Request-response cycle can now begin

---

## Step 4️⃣: Graceful Shutdown Handler

```typescript
    process.on('SIGTERM', () => {
    // ├─ SIGTERM = Termination signal
    // ├─ Sent by process managers, Docker, Kubernetes
    // ├─ Different from SIGKILL (can't be caught)
    // └─ Allows clean shutdown
    
      console.log('SIGTERM received, shutting down...');
      // └─ Log shutdown event
      
      databaseConnection.close();
      // ├─ Close database connection gracefully
      // └─ Saves any pending data
      
      process.exit(0);
      // ├─ Exit process with success code 0
      // └─ Process manager knows shutdown was clean
    });
```

**Why important?**
- ✅ Prevents data loss
- ✅ Closes connections properly
- ✅ Allows smooth redeployment

---

## Step 5️⃣: Error Handling for Startup Failures

```typescript
  } catch (error) {
    console.error('Failed to start server:', error);
    // ├─ Log any startup errors
    // └─ Helps debug startup failures
    
    process.exit(1);
    // ├─ Exit with failure code 1
    // └─ Process manager knows something went wrong
  }
}
```

**Why explicit error handling?**
- ✅ Catches database connection failures
- ✅ Catches port already in use errors
- ✅ Prevents cryptic failures

---

## Step 6️⃣: Execute Main Function

```typescript
main();
// ├─ Run async main function when file is executed
// ├─ This starts the entire server
// └─ Entry point for Node.js process
```

---

## 📊 Middleware Execution Order

```
HTTP Request arrives
    ↓
1. CORS Check ────────────────── Validate origin
    ↓
2. JSON Parser ───────────────── Parse body
    ↓
3. Rate Limiter ───────────────── Check rate limit
    ↓
4. Request Logger ─────────────── Log request
    ↓
5. Route Matching ─────────────── Find matching route
    ↓
6. Route Validation ───────────── Run route-specific middleware
    ↓
7. Controller ─────────────────── Handle request
    ↓
8. Response Sent ──────────────── Send response back
    ↓
   OR if error: Error Handler ─── Catch exception, send error response
    ↓
   OR if not found: 404 Handler ─ Return 404
```

---

## 🎯 Key Takeaways

| Concept | Purpose | Location |
|---------|---------|----------|
| **CORS** | Security for cross-origin requests | Early (2nd) |
| **Rate Limiter** | Prevent abuse/DDoS | Early (4th) |
| **Logger** | Monitor requests | Early (5th) |
| **Routes** | Handle business logic | Middle |
| **Error Handler** | Catch exceptions | Last |

---

## ✅ Checklist: Application Startup

- ✅ Database connection established
- ✅ Express app created with all middleware
- ✅ All routes mounted with controllers
- ✅ Server listening on configured port
- ✅ Graceful shutdown handler registered
- ✅ Ready to handle requests

---

## 💡 Interview Insight

**Question**: "What happens when a request arrives?"

**Answer**: 
1. Express receives request
2. Passes through middleware chain (CORS → Parser → Rate Limiter → Logger)
3. Routes match the request path
4. Validation middleware runs
5. Controller processes request
6. Response sent OR error handler catches exception
7. Response returned to client

---
