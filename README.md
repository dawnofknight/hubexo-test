# Glenigan Construction Projects

A full-stack web application for browsing and filtering UK construction projects. Built with **TypeScript/Express.js** backend and **AngularJS 1.8.x** frontend.

![Node.js](https://img.shields.io/badge/Node.js-20+-green)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![AngularJS](https://img.shields.io/badge/AngularJS-1.8.x-red)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
  - [Using Docker (Recommended)](#using-docker-recommended)
  - [Manual Setup](#manual-setup)
- [API Documentation](#api-documentation)
- [Frontend Usage](#frontend-usage)
- [Architecture](#architecture)
  - [Backend 4-Layer Architecture](#backend-4-layer-architecture)
  - [SOLID Principles Applied](#solid-principles-applied)
  - [Request Data Flow](#request-data-flow-4-layer)
  - [Dependency Injection Flow](#dependency-injection-flow)
- [Design Choices](#design-choices)
- [Why 4-Layer Architecture?](#why-4-layer-architecture)
- [Assumptions](#assumptions)
- [Tradeoffs](#tradeoffs)
- [Error Handling](#error-handling)
- [Testing](#testing)

---

## Overview

This application provides a searchable, filterable list of construction projects across the UK. It was built as a take-home assignment demonstrating:

- **4-Layer Architecture** with SOLID principles
- REST API design and implementation
- Database querying with pagination
- Error handling best practices
- Legacy AngularJS frontend development
- Docker containerization

---

## Features

### Backend
- ✅ **4-Layer Architecture** — Domain, Infrastructure, Application, Presentation layers
- ✅ **SOLID Principles** — Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
- ✅ **Dependency Injection** — Container-based DI for loose coupling and testability
- ✅ **RESTful API** with Express.js and TypeScript (strict mode)
- ✅ **SQLite database** with efficient querying via sql.js
- ✅ **Server-side pagination** with optional fetch-all mode
- ✅ **Advanced filtering**: area, keyword (case-insensitive), company
- ✅ **Single project lookup** via `GET /api/projects/:id` (PROJECT_NOT_FOUND 404)
- ✅ **Unified response envelope** — all endpoints return consistent `{success, data, pagination}` format
- ✅ **Rate limiting** — 120 req/min per IP with X-RateLimit headers
- ✅ **Cache headers** — 1-hour public cache on reference data (`/areas`, `/companies`)
- ✅ **Comprehensive error handling** with error codes
- ✅ **Health check** endpoint with database status
- ✅ **Configurable CORS** via `ALLOWED_ORIGINS` env var

### Frontend
- ✅ **Component-based architecture** — Modular services, controllers, and config
- ✅ **AngularJS 1.8.x** single-page application with proper TypeScript typing
- ✅ **Project list** with all required fields (name, company, dates, value, area)
- ✅ **Button-click filtering** (not instant) to reduce API calls and improve UX
- ✅ **Advanced filters**: keyword, area, company (backend-based for pagination correctness)
- ✅ **Precomputed pagination numbers** — avoids per-digest recalculation
- ✅ **Responsive design** with modern CSS
- ✅ **Loading states and error handling** with user-friendly messages

### DevOps
- ✅ **Docker containerization** with multi-stage builds for minimal images
- ✅ **Docker Compose** orchestration with health checks
- ✅ **Nginx reverse proxy** as single entry point (eliminates CORS in production)
- ✅ **Security headers** (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)

---

## Project Structure

### Backend (4-Layer Architecture)

```
backend/src/
├── app.ts                              # Application entry point
├── container.ts                        # Dependency Injection container
├── swagger.ts                          # OpenAPI documentation
│
├── config/                             # Configuration Layer
│   └── app.config.ts                   # Centralized app settings
│
├── domain/                             # Layer 1: Domain (Business Rules)
│   ├── entities/                       # Domain models
│   │   ├── project.entity.ts           # Project entity & factory
│   │   ├── company.entity.ts           # Company entity & factory
│   │   ├── area.entity.ts              # Area entity & factory
│   │   └── index.ts
│   ├── repositories/                   # Repository interfaces (contracts)
│   │   ├── project.repository.interface.ts
│   │   ├── area.repository.interface.ts
│   │   ├── company.repository.interface.ts
│   │   └── index.ts
│   ├── exceptions/                     # Domain exceptions
│   │   ├── domain.exceptions.ts        # NotFoundException, ValidationException
│   │   └── index.ts
│   └── index.ts
│
├── infrastructure/                     # Layer 2: Infrastructure (Data Access)
│   ├── database/                       # Database connection
│   │   ├── database.ts                 # SQLite connection manager
│   │   └── index.ts
│   ├── repositories/                   # Repository implementations
│   │   ├── project.repository.ts       # SQLite project queries
│   │   ├── area.repository.ts          # SQLite area queries
│   │   ├── company.repository.ts       # SQLite company queries
│   │   └── index.ts
│   └── index.ts
│
├── application/                        # Layer 3: Application (Use Cases)
│   ├── dtos/                           # Data Transfer Objects
│   │   └── index.ts                    # ProjectDTO, CompanyDTO, etc.
│   ├── services/                       # Application services
│   │   ├── project.service.ts          # Project use cases
│   │   ├── area.service.ts             # Area use cases
│   │   ├── company.service.ts          # Company use cases
│   │   ├── health.service.ts           # Health check logic
│   │   └── index.ts
│   └── index.ts
│
├── presentation/                       # Layer 4: Presentation (HTTP)
│   ├── controllers/                    # HTTP request handlers
│   │   ├── project.controller.ts
│   │   ├── area.controller.ts
│   │   ├── company.controller.ts
│   │   ├── health.controller.ts
│   │   └── index.ts
│   ├── routes/                         # Route definitions
│   │   ├── project.routes.ts
│   │   ├── area.routes.ts
│   │   ├── company.routes.ts
│   │   ├── health.routes.ts
│   │   └── index.ts
│   ├── middlewares/                    # Express middlewares
│   │   ├── error.middleware.ts         # Global error handler
│   │   ├── validation.middleware.ts    # Request validation
│   │   └── index.ts
│   └── index.ts
│
└── __tests__/                          # Test files
    ├── api.test.ts                     # API integration tests
    ├── repositories.test.ts            # Repository unit tests
    └── exceptions.test.ts              # Exception unit tests
```

### Frontend (Component-Based)

```
frontend/src/
├── app.ts                              # Module definition (entry point)
├── types.ts                            # TypeScript interfaces
│
├── config/                             # Configuration
│   └── api.config.ts                   # API endpoint configuration
│
├── services/                           # Services (data layer)
│   └── project.service.ts              # API communication
│
└── controllers/                        # Controllers (UI logic)
    └── project-list.controller.ts      # Project list view controller
```

### Root Structure

```
glenigan-takehome/
├── backend/                            # Express.js API (4-layer)
│   ├── src/                            # Source code (see above)
│   ├── glenigan_takehome FS.db         # SQLite database
│   ├── Dockerfile                      # Multi-stage Docker build
│   ├── jest.config.js                  # Test configuration
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                           # AngularJS 1.8.x (component-based)
│   ├── src/                            # Source code (see above)
│   ├── dist/                           # Compiled JavaScript
│   ├── test/                           # Jasmine test specs
│   ├── index.html                      # Main HTML page
│   ├── styles.css                      # CSS styling
│   ├── nginx.conf                      # Nginx configuration
│   ├── karma.conf.js                   # Test runner configuration
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

## Quick Start

### Using Docker (Recommended)

The easiest way to run the application:

```bash
# Clone or extract the project
cd glenigan-takehome

# Build and start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

Access the application:
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3000/api
- **API Documentation (Swagger UI)**: http://localhost:3000/api-docs
- **Health Check**: http://localhost:3000/health

To stop the services:
```bash
docker-compose down
```

### Manual Setup

#### Prerequisites
- Node.js 18+ (recommended: 20.x)
- npm

#### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Start development server
npm run dev

# Or build and run production
npm run build
npm start
```

The API server runs at `http://localhost:3000`.

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Build TypeScript
npm run build

# Start development server
npm run serve
```

The frontend runs at `http://localhost:8080`.

#### Running Both Services

**Terminal 1 - Backend:**
```bash
cd backend && npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend && npm run build && npm run serve
```

Open http://localhost:8080 in your browser.

---

## API Documentation

### Base URL

```
http://localhost:3000/api
```

### Interactive API Documentation (Swagger/OpenAPI)

The backend includes comprehensive OpenAPI 3.0.0 documentation with an interactive **Swagger UI** for browser-based testing:

**Access Swagger UI:**
- http://localhost:3000/api-docs

From the Swagger UI you can:
- View complete endpoint specifications
- See request/response schemas with examples
- Test endpoints directly (try-it-out feature)
- Explore error responses and status codes
- Download OpenAPI specification as JSON/YAML

The documentation includes all endpoints, query parameters, request/response bodies, and error codes with real-world examples.

### Endpoints

#### `GET /api/projects`

Returns a list of construction projects with optional filtering and pagination.

**Query Parameters:**

| Parameter  | Type   | Required | Description                                              |
|------------|--------|----------|----------------------------------------------------------|
| `area`     | string | No       | Filter by area name (exact match, case-sensitive)        |
| `keyword`  | string | No       | Search by project name (case-insensitive, partial match) |
| `company`  | string | No       | Filter by exact company name                             |
| `page`     | number | No       | Page number (1-based). Enables pagination if provided    |
| `per_page` | number | No       | Items per page (default: 20, max: 1000)                  |

**Response Format:**

All endpoints return a consistent envelope:

```json
{
  "success": true,
  "data": [
    {
      "project_name": "Manchester Bridge Phase 2",
      "project_start": "2026-01-01 00:00:00",
      "project_end": "2027-01-10 00:00:00",
      "company": "NorthBuild Ltd",
      "description": "A major bridge construction project",
      "project_value": 4832115,
      "area": "Manchester"
    }
  ],
  "pagination": {
    "current_page": 1,
    "per_page": 20,
    "total_items": 1800,
    "total_pages": 90,
    "has_next": true,
    "has_prev": false
  }
}
```

When no pagination is requested (`page` and `per_page` omitted), `pagination` is `null`:

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": null
}
```

#### `GET /api/projects/:id`

Returns details for a single project by ID. A project may belong to multiple areas; response includes one row per area.

**Path Parameters:**

| Parameter | Type   | Description |
|-----------|--------|-------------|
| `id`      | string | Project ID  |

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "project_id": "p-123456",
      "project_name": "London Bridge Phase 2",
      "project_start": "2026-01-01 00:00:00",
      "project_end": "2027-01-10 00:00:00",
      "company": "NorthBuild Ltd",
      "description": "Major bridge project",
      "project_value": 4832115,
      "area": "London"
    }
  ],
  "pagination": null
}
```

**Error (404 Not Found):**
```json
{
  "success": false,
  "error": {
    "code": "PROJECT_NOT_FOUND",
    "message": "Project not found",
    "details": "No project with id 'p-999999' exists."
  }
}
```

#### `GET /api/areas`

Returns all available areas for the filter dropdown. **Cached for 1 hour** (public, max-age=3600).

**Response:**
```json
{
  "success": true,
  "data": ["Birmingham", "Bristol", "Cardiff", "Edinburgh", "Glasgow", "Leeds", "Liverpool", "London", "Manchester", "Newcastle"],
  "pagination": null
}
```

#### `GET /api/companies`

Returns all companies that have projects. **Cached for 1 hour** (public, max-age=3600).

**Response:**
```json
{
  "success": true,
  "data": [
    { "company_id": "c-001", "company_name": "ABC Construction" },
    { "company_id": "c-002", "company_name": "AJAX Civil Works" }
  ],
  "pagination": null
}
```

#### `GET /health`

Health check endpoint for monitoring and Docker health checks.

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-04-22T15:30:00.000Z"
}
```

### Error Responses

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Optional additional context"
  }
}
```

**Error Codes:**

| Code                 | HTTP Status | Description                           |
|----------------------|-------------|---------------------------------------|
| `INVALID_PAGINATION` | 400         | Invalid page or per_page values       |
| `VALIDATION_ERROR`   | 400         | Invalid input (keyword length, etc.)  |
| `AREA_NOT_FOUND`     | 404         | Specified area doesn't exist          |
| `PROJECT_NOT_FOUND`  | 404         | Project ID not found                  |
| `RATE_LIMITED`       | 429         | Too many requests (>120/min)          |
| `DATABASE_ERROR`     | 500         | Database connection or query error    |
| `INTERNAL_ERROR`     | 500         | Unexpected server error               |
| `NOT_FOUND`          | 404         | Route not found                       |

---

## Frontend Usage

### Project List

The main page displays a paginated list of construction projects with:
- Project Name
- Company
- Start Date (formatted)
- End Date (formatted)
- Project Value (formatted as GBP currency)
- Area (as a badge)

### Filtering

**Search by Project Name:**
- Enter keywords in the search box
- Press Enter or click "Search" to apply

**Filter by Area:**
- Select an area from the dropdown
- Click "Search" to apply

**Filter by Company:**
- Select a company from the dropdown
- Click "Search" to apply
- Pagination metadata remains accurate under company filtering (server-side filtering)

**Clear Filters:**
- Click "Clear Filters" to reset all filters

### Pagination

- Use page number buttons to navigate
- Use « » for first/last page
- Use ‹ › for previous/next page
- Change items per page using the dropdown

---

## Design Choices

### Backend Architecture (4-Layer + SOLID)

| Decision | Rationale |
|----------|-----------|
| **4-Layer Architecture** | Separates concerns: Domain (business rules), Infrastructure (data access), Application (use cases), Presentation (HTTP). Each layer has single responsibility and clear dependencies. Changes to HTTP handling don't affect business logic. |
| **Dependency Injection** | Controllers receive services via constructor injection; services receive repositories. Enables unit testing with mocks, swapping implementations (e.g., SQLite → PostgreSQL) without code changes. |
| **Repository Interfaces** | `IProjectRepository`, `IAreaRepository`, `ICompanyRepository` define contracts in Domain layer. Infrastructure implements them. Services depend on interfaces (DIP), not concrete classes. |
| **Entity Factory Functions** | `createProject()`, `createCompany()`, `createArea()` encapsulate entity creation. Allows adding validation or computed fields without modifying callers (OCP). |
| **Domain Exceptions** | `NotFoundException`, `ValidationException`, `DomainException` hierarchy provides typed errors. Middleware catches and maps to appropriate HTTP codes. |
| **DTOs (Data Transfer Objects)** | `ProjectDTO`, `ApiResponseDTO` define API response shapes. Decouples internal entities from external contracts. |
| **Centralized Config** | `app.config.ts` consolidates ports, rate limits, pagination limits. Single source of truth for tunable parameters. |
| **Container Module** | `container.ts` wires all dependencies in one file. Visible dependency graph, easy to trace what depends on what. |

### Backend API Design

| Decision | Rationale |
|----------|-----------|
| **Unified response envelope** | All endpoints return `{success, data, pagination}` where pagination is null when not requested. Avoids mixed formats which confuse frontend clients. Matches industry practice (GitHub, Stripe, JSON:API). |
| **Company filter in backend** | Server-side filtering ensures pagination metadata is always correct. Reduces data transfer for large result sets. |
| **Rate limiting (120 req/min)** | Protects API from abuse; X-RateLimit headers inform clients of quota status. |
| **Cache headers (1-hour)** | Reference data (`/areas`, `/companies`) changes rarely; browsers/CDNs cache to reduce server load. |
| **Deferred area validation** | `areaExists()` check only runs when results are empty, saving 1 DB query on common happy path. |
| **Structured error handling** | Error codes (AREA_NOT_FOUND, PROJECT_NOT_FOUND, RATE_LIMITED) allow programmatic client handling. |

### Frontend Architecture (Component-Based)

| Decision | Rationale |
|----------|-----------|
| **Modular file structure** | Separate files: `app.ts` (module), `project.service.ts` (data), `project-list.controller.ts` (UI logic), `api.config.ts` (settings). Each file < 200 lines. |
| **Typed interfaces** | `IProjectService`, `IProjectListScope`, `IProjectQueryParams` in `types.ts`. Compile-time error detection despite legacy AngularJS. |
| **Service layer** | `ProjectService` handles all API communication. Controllers focus on UI state only (SRP). |
| **Config constants** | `API_BASE_URL`, `API_ENDPOINTS` in separate file. Easy environment switching (dev/prod). |
| **Filter on button click** | Reduces API calls, better UX for slow typers. Avoids hundreds of requests per typing session. |
| **Precomputed page numbers** | `$scope.pageNumbers` updated on pagination change. Avoids per-digest recomputation in AngularJS templates. |
| **Server-side pagination** | Efficient for large datasets (1800+ records). Optional; omitting `page`/`per_page` returns all records for exports. |

### Docker & DevOps

| Decision | Rationale |
|----------|-----------|
| **Multi-stage builds** | Smaller production images (compile in build stage, copy artifacts to runtime stage). |
| **nginx as API proxy** | Single entry point eliminates CORS in production. Load balancer ready. |
| **Health checks** | Container orchestration support for rolling updates. |

---

## Why 4-Layer Architecture?

The 4-layer pattern addresses common problems in monolithic backends:

### Problem → Solution

| Problem | Solution |
|---------|----------|
| **"God files"** — 500+ line files mixing HTTP, business logic, and SQL | Each layer is focused: Controllers (~50 lines), Services (~80 lines), Repositories (~100 lines) |
| **Untestable code** — database calls scattered everywhere | Services depend on repository interfaces; tests inject mocks |
| **Vendor lock-in** — SQL queries embedded in business logic | Repository pattern isolates SQL; swap implementations without touching services |
| **Leaky abstractions** — HTTP concerns in business logic | Controllers handle HTTP; Services pure TypeScript; clean separation |
| **Circular dependencies** — everything imports everything | Strict layer hierarchy: Presentation → Application → Infrastructure → Domain |

### Layer Responsibilities

| Layer | Knows About | Does NOT Know About |
|-------|-------------|---------------------|
| **Domain** | Business entities, interfaces | HTTP, databases, frameworks |
| **Infrastructure** | Domain entities, SQL, file I/O | HTTP, business rules |
| **Application** | Domain, Infrastructure interfaces | HTTP, SQL implementation details |
| **Presentation** | Application services, HTTP | SQL, direct database access |

### Trade-offs Accepted

| Trade-off | Justification |
|-----------|---------------|
| **More files** (43 vs 5) | Each file has single purpose; easier navigation with good folder structure |
| **More boilerplate** | TypeScript interfaces provide compile-time safety; IDEs auto-complete |
| **Learning curve** | Standard pattern; new team members recognize it from other projects |
| **Indirection** | Debugger shows clear call stack through layers; easier to trace than spaghetti |

---

## Assumptions

1. **One project per area in results**: While the database supports many-to-many relationships between projects and areas, when filtering by area, only that area is returned for each matching project.

2. **Pagination is optional**: When both `page` and `per_page` are omitted, all projects are returned without pagination metadata (`pagination: null`).

3. **Case-insensitive keyword search**: The keyword search uses SQL LIKE with wildcards for partial matching and is case-insensitive.

4. **Exact area matching**: Area names must match exactly (case-sensitive) since they're predefined values.

5. **Company filter is server-side**: Implemented in backend SQL for pagination correctness.

6. **Description can be null**: Projects without descriptions return `null` rather than empty strings.

---

## Tradeoffs

### Architecture

| Choice | Tradeoff |
|--------|----------|
| **4-layer architecture** | More files and indirection, but clear separation, testability, and maintainability. Worth it for non-trivial apps. |
| **Dependency injection (manual)** | No framework overhead, but requires wiring in `container.ts`. Sufficient for this scale; consider InversifyJS for larger apps. |
| **Repository interfaces** | Extra abstraction layer, but enables mocking and database swapping. Essential for testing. |

### Performance vs Simplicity

| Choice | Tradeoff |
|--------|----------|
| **sql.js (pure JS SQLite)** | Slightly slower than native SQLite, but no compilation issues across OS/Node versions. Database loaded into memory. |
| **Single-threaded Node.js** | Simple, but may bottleneck under heavy concurrent load. Rate limiting mitigates; load balancing handles scaling. |

### API Design

| Choice | Tradeoff |
|--------|----------|
| **Unified response envelope** | Consistent format. Minimal overhead (`pagination: null` is cheap) vs mixed formats that surprise clients. |
| **Server-side company filter** | Requires SQL join, but ensures pagination correctness. |

### Frontend Architecture

| Choice | Tradeoff |
|--------|----------|
| **Legacy AngularJS 1.8.x** | Spec requirement. Shows ability to work in brownfield legacy environments with TypeScript typing. |
| **Component-based structure** | More files than single `app.ts`, but each under 200 lines. Easier to navigate and maintain. |

---

## Error Handling

### Backend Errors

| Scenario | HTTP Code | Error Code | Response |
|----------|-----------|------------|----------|
| Invalid page (negative, zero, non-numeric) | 400 | `INVALID_PAGINATION` | Error with details |
| Invalid per_page (negative, zero, >1000, non-numeric) | 400 | `INVALID_PAGINATION` | Error with details |
| Keyword too long (>255 chars) | 400 | `VALIDATION_ERROR` | Error with max length hint |
| Area not found (after confirming empty results) | 404 | `AREA_NOT_FOUND` | Error with hint to use `/api/areas` |
| Project ID not found | 404 | `PROJECT_NOT_FOUND` | Error with project ID |
| Rate limit exceeded (>120 req/min) | 429 | `RATE_LIMITED` | Error with retry-after info |
| Database connection error | 500 | `DATABASE_ERROR` | Safe error message (details in dev only) |
| Unknown route | 404 | `NOT_FOUND` | Resource not found message |
| Unexpected error | 500 | `INTERNAL_ERROR` | Generic error message (details in dev only) |

### Frontend Errors

- Displays user-friendly error messages in a banner
- Shows loading spinner during API calls
- Empty state when no results match filters
- Console logging for debugging

---

## Testing

### Unit Tests

The project includes comprehensive unit tests for both backend and frontend.

#### Backend Tests (Jest + Supertest)

```bash
cd backend

# Run all tests
npm test

# Run tests with watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

**Test Coverage: 40 tests across 3 test suites**

- **Exception Tests** (7 tests)
  - DomainException, NotFoundException, ValidationException
  - ApiException with/without details
  - ErrorCode enum validation

- **Repository Tests** (17 tests)
  - `ProjectRepository`: findProjects, findById, countProjects, areaExists
  - `AreaRepository`: findAll returns sorted UK areas
  - `CompanyRepository`: findAll returns companies with proper structure

- **API Endpoint Tests** (16 tests)
  - `GET /health` - health check with database status
  - `GET /api/areas` - area listing with cache headers
  - `GET /api/companies` - company listing with cache headers
  - `GET /api/projects/:id` - single project or PROJECT_NOT_FOUND 404
  - `GET /api/projects` - with pagination, area, keyword, company filters
  - Validation errors (400), Not found (404), Rate limiting (429)

#### Frontend Tests (Karma + Jasmine)

```bash
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

**Test Coverage: 34 tests**
- **ProjectService Tests** (8 tests)
  - API calls with unified envelope format (pagination: null when no pagination)
  - Filter parameter handling (keyword, area, company)
  - Error handling

- **ProjectListController Tests** (26 tests)
  - Initialization state (projects, areas, companies load)
  - Filter application and clearing (area, keyword, company)
  - Pagination navigation (next/prev/goToPage, boundary checks)
  - Helper functions (formatCurrency, formatDate)
  - Precomputed `pageNumbers` (tested after load, not as template function)

**Summary: 74 total tests (40 backend + 34 frontend) — all passing.**

### Manual API Testing

```bash
# Get all projects (no pagination, returns pagination: null)
curl "http://localhost:3000/api/projects"

# Get paginated projects
curl "http://localhost:3000/api/projects?page=1&per_page=10"

# Filter by area
curl "http://localhost:3000/api/projects?area=London&page=1&per_page=10"

# Search by keyword (case-insensitive)
curl "http://localhost:3000/api/projects?keyword=bridge&page=1&per_page=10"

# Filter by company (backend-based)
curl "http://localhost:3000/api/projects?company=ABC%20Construction&page=1&per_page=10"

# Combined filters
curl "http://localhost:3000/api/projects?area=Manchester&keyword=road&company=NorthBuild&page=1&per_page=20"

# Get single project (returns pagination: null)
curl "http://localhost:3000/api/projects/p-000001"

# Get areas (with Cache-Control header)
curl -i "http://localhost:3000/api/areas"

# Get companies (with Cache-Control header)
curl -i "http://localhost:3000/api/companies"

# Health check
curl "http://localhost:3000/health"

# Error cases
curl "http://localhost:3000/api/projects?area=InvalidArea"     # 404 AREA_NOT_FOUND
curl "http://localhost:3000/api/projects/invalid-id"           # 404 PROJECT_NOT_FOUND
curl "http://localhost:3000/api/projects?page=-1"              # 400 INVALID_PAGINATION
curl "http://localhost:3000/api/projects?page=abc"             # 400 INVALID_PAGINATION
curl "http://localhost:3000/api/projects?per_page=0"           # 400 INVALID_PAGINATION
curl "http://localhost:3000/api/projects?per_page=10001"       # 400 INVALID_PAGINATION (max 1000)
curl "http://localhost:3000/api/projects?keyword=$(python3 -c 'print(\"x\" * 300)')" # 400 VALIDATION_ERROR
```

### Docker Testing

```bash
# Build and run
docker-compose up --build

# Check backend health
curl http://localhost:3000/health

# Test API through nginx proxy
curl http://localhost:8080/api/projects?page=1&per_page=5

# View logs
docker-compose logs -f

# Check container status
docker-compose ps
```

---

## Architecture

### Backend 4-Layer Architecture

The backend follows a **Clean Architecture** pattern with 4 distinct layers, each with specific responsibilities:

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          BACKEND 4-LAYER ARCHITECTURE                      │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  LAYER 4: PRESENTATION (HTTP Interface)                              │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────────┐   │  │
│  │  │ Controllers│  │   Routes   │  │ Middlewares│  │  Express App  │   │  │
│  │  │ • Project  │  │ • /api/*   │  │ • Error    │  │ • CORS        │   │  │
│  │  │ • Area     │  │ • /health  │  │ • Validate │  │ • Rate Limit  │   │  │
│  │  │ • Company  │  │            │  │ • Logger   │  │ • JSON Parse  │   │  │
│  │  │ • Health   │  │            │  │            │  │               │   │  │
│  │  └─────┬──────┘  └────────────┘  └────────────┘  └───────────────┘   │  │
│  └────────┼─────────────────────────────────────────────────────────────┘  │
│           │ Calls services via DI                                          │
│  ┌────────▼─────────────────────────────────────────────────────────────┐  │
│  │  LAYER 3: APPLICATION (Use Cases / Business Logic)                   │  │
│  │  ┌──────────────────┐  ┌──────────────────────────────────────────┐  │  │
│  │  │     Services     │  │                  DTOs                     │  │  │
│  │  │  • ProjectService│  │  • ProjectDTO      • PaginationDTO       │  │  │
│  │  │  • AreaService   │  │  • CompanyDTO      • ApiResponseDTO      │  │  │
│  │  │  • CompanyService│  │  • GetProjectsQueryDTO                   │  │  │
│  │  │  • HealthService │  │                                          │  │  │
│  │  └────────┬─────────┘  └──────────────────────────────────────────┘  │  │
│  └───────────┼──────────────────────────────────────────────────────────┘  │
│              │ Depends on repository interfaces (not implementations)      │
│  ┌───────────▼──────────────────────────────────────────────────────────┐  │
│  │  LAYER 2: INFRASTRUCTURE (Data Access)                               │  │
│  │  ┌────────────────────┐  ┌────────────────────────────────────────┐  │  │
│  │  │    Repositories    │  │            Database                     │  │  │
│  │  │  • ProjectRepository│ │  • DatabaseConnection (Singleton)      │  │  │
│  │  │  • AreaRepository   │ │  • sql.js SQLite Driver                │  │  │
│  │  │  • CompanyRepository│ │  • Query helpers (queryAll, queryOne)  │  │  │
│  │  └────────┬───────────┘  └────────────────────────────────────────┘  │  │
│  └───────────┼──────────────────────────────────────────────────────────┘  │
│              │ Uses domain entities                                        │
│  ┌───────────▼──────────────────────────────────────────────────────────┐  │
│  │  LAYER 1: DOMAIN (Core Business Rules)                                │  │
│  │  ┌────────────────┐  ┌───────────────────┐  ┌─────────────────────┐  │  │
│  │  │    Entities    │  │    Interfaces     │  │     Exceptions      │  │  │
│  │  │  • Project     │  │ • IProjectRepo    │  │ • DomainException   │  │  │
│  │  │  • Company     │  │ • IAreaRepo       │  │ • NotFoundException │  │  │
│  │  │  • Area        │  │ • ICompanyRepo    │  │ • ValidationException│ │  │
│  │  └────────────────┘  └───────────────────┘  └─────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  DEPENDENCY INJECTION CONTAINER (container.ts)                       │  │
│  │  Wires: Database → Repositories → Services → Controllers → Routes   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### SOLID Principles Applied

| Principle | Implementation | Example |
|-----------|---------------|---------|
| **S**ingle Responsibility | Each class has one reason to change | `ProjectController` only handles HTTP; `ProjectService` only orchestrates use cases; `ProjectRepository` only queries data |
| **O**pen/Closed | Entities extendable via factory functions | `createProject()` factory allows adding computed fields without modifying entity structure |
| **L**iskov Substitution | Repository implementations are interchangeable | `IProjectRepository` can be implemented by `SqliteProjectRepository` or `PostgresProjectRepository` |
| **I**nterface Segregation | Small, focused interfaces | Separate `IProjectRepository`, `IAreaRepository`, `ICompanyRepository` instead of one large interface |
| **D**ependency Inversion | High-level modules depend on abstractions | `ProjectService` depends on `IProjectRepository` interface, not `SqliteProjectRepository` implementation |

### System Deployment Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Docker Network                           │
│  ┌─────────────────────────┐    ┌─────────────────────────────┐ │
│  │       Frontend          │    │         Backend              │ │
│  │    (nginx:alpine)       │    │    (node:20-alpine)          │ │
│  │                         │    │                              │ │
│  │  ┌──────────────────┐   │    │  ┌───────────────────────┐  │ │
│  │  │   Static Files   │   │    │  │   4-Layer Express.js  │  │ │
│  │  │  - index.html    │   │    │  │                       │  │ │
│  │  │  - styles.css    │   │    │  │  Presentation → App   │  │ │
│  │  │  - app.js        │   │    │  │       → Infra → Domain│  │ │
│  │  │  - angular.min.js│   │    │  │                       │  │ │
│  │  └──────────────────┘   │    │  └───────────────────────┘  │ │
│  │                         │    │              │              │ │
│  │  ┌──────────────────┐   │    │  ┌───────────▼───────────┐  │ │
│  │  │  Nginx Proxy     │───┼────┼─▶│  DI Container         │  │ │
│  │  │  /api/* → backend│   │    │  │  (Dependency Wiring)  │  │ │
│  │  └──────────────────┘   │    │  └───────────────────────┘  │ │
│  │                         │    │              │              │ │
│  │         :80             │    │  ┌───────────▼───────────┐  │ │
│  └─────────────────────────┘    │  │  SQLite Database      │  │ │
│            │                    │  │  (sql.js in-memory)   │  │ │
│            │                    │  └───────────────────────┘  │ │
│            │                    │              :3000           │ │
└────────────┼────────────────────┼──────────────────────────────┘
             │                    │
         Port 8080            Port 3000
             │                    │
      ┌──────┴────────────────────┴──────┐
      │           Host Machine           │
      │   Browser → localhost:8080       │
      │   API     → localhost:3000       │
      └──────────────────────────────────┘
```

### Request Data Flow (4-Layer)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              REQUEST FLOW                                   │
└─────────────────────────────────────────────────────────────────────────────┘

User Action: Search for "bridge" projects in London
                    │
                    ▼
┌───────────────────────────────────────────────────────────────────────────┐
│  FRONTEND (AngularJS)                                                      │
│  ┌─────────────────┐    ┌─────────────────────────────────────────────┐   │
│  │ Controller      │───▶│ ProjectService.getProjects({                │   │
│  │ (User clicks    │    │   keyword: 'bridge',                        │   │
│  │  Search button) │    │   area: 'London',                           │   │
│  └─────────────────┘    │   page: 1, per_page: 20                     │   │
│                         │ })                                           │   │
│                         └──────────────────┬──────────────────────────┘   │
└────────────────────────────────────────────┼──────────────────────────────┘
                                             │ HTTP GET /api/projects?
                                             │   keyword=bridge&area=London&page=1
                                             ▼
┌───────────────────────────────────────────────────────────────────────────┐
│  LAYER 4: PRESENTATION                                                     │
│  ┌─────────────┐    ┌───────────────┐    ┌─────────────────────────────┐  │
│  │   Router    │───▶│  Middlewares  │───▶│   ProjectController         │  │
│  │ /api/projects│   │ • rateLimit   │    │   .getProjects(req, res)    │  │
│  │             │    │ • validate    │    │                             │  │
│  └─────────────┘    └───────────────┘    └──────────────┬──────────────┘  │
└─────────────────────────────────────────────────────────┼─────────────────┘
                                                          │ Parse query → DTO
                                                          ▼
┌───────────────────────────────────────────────────────────────────────────┐
│  LAYER 3: APPLICATION                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  ProjectService.getProjects(query: GetProjectsQueryDTO)              │  │
│  │                                                                      │  │
│  │  1. Validate business rules (keyword length, pagination bounds)      │  │
│  │  2. Call repository via interface (DIP)                             │  │
│  │  3. Transform entities → DTOs for response                          │  │
│  │  4. Return ApiResponseDTO with pagination metadata                  │  │
│  └────────────────────────────────────┬────────────────────────────────┘  │
└───────────────────────────────────────┼────────────────────────────────────┘
                                        │ IProjectRepository.findProjects()
                                        ▼
┌───────────────────────────────────────────────────────────────────────────┐
│  LAYER 2: INFRASTRUCTURE                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐  │
│  │  ProjectRepository (implements IProjectRepository)                   │  │
│  │                                                                      │  │
│  │  1. Build SQL query with JOINs                                      │  │
│  │  2. Execute via DatabaseConnection.queryAll()                       │  │
│  │  3. Map raw rows → Project entities (via factory)                   │  │
│  │  4. Return entity array to service                                  │  │
│  └────────────────────────────────────┬────────────────────────────────┘  │
└───────────────────────────────────────┼────────────────────────────────────┘
                                        │ SQL query
                                        ▼
┌───────────────────────────────────────────────────────────────────────────┐
│  LAYER 1: DOMAIN                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │  Project Entity (pure data, no dependencies)                        │   │
│  │  {                                                                  │   │
│  │    project_id: string, project_name: string,                        │   │
│  │    project_start: string, project_end: string,                      │   │
│  │    company: string, description: string | null,                     │   │
│  │    project_value: number, area: string                              │   │
│  │  }                                                                  │   │
│  └────────────────────────────────────────────────────────────────────┘   │
│  ┌────────────────────────────────────────────────────────────────────┐   │
│  │  IProjectRepository Interface (contract)                            │   │
│  │  {                                                                  │   │
│  │    findProjects(filters, pagination): Promise<Project[]>            │   │
│  │    countProjects(filters): Promise<number>                          │   │
│  │    findById(id): Promise<Project | undefined>                       │   │
│  │    areaExists(area): Promise<boolean>                               │   │
│  │  }                                                                  │   │
│  └────────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────────┘

                              RESPONSE FLOW
                                   ▲
                                   │ JSON Response
┌──────────────────────────────────┴────────────────────────────────────────┐
│  {                                                                        │
│    "success": true,                                                       │
│    "data": [                                                              │
│      { "project_name": "London Bridge Renovation", "area": "London", ...}│
│    ],                                                                     │
│    "pagination": { "current_page": 1, "total_items": 42, ... }           │
│  }                                                                        │
└───────────────────────────────────────────────────────────────────────────┘
```

### Dependency Injection Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DEPENDENCY INJECTION (container.ts)                 │
└─────────────────────────────────────────────────────────────────────────────┘

Startup Sequence:
                                                                              
   ┌─────────────────┐                                                        
   │  1. Database    │  DatabaseConnection.getInstance()                      
   │     Singleton   │  ───────────────────────────────▶ SQLite loaded       
   └────────┬────────┘                                                        
            │                                                                 
            ▼ Injected into                                                   
   ┌─────────────────────────────────────────────────────────────────────┐   
   │  2. Repositories (Infrastructure Layer)                             │   
   │  ┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐  │   
   │  │ ProjectRepository │ │  AreaRepository   │ │ CompanyRepository │  │   
   │  │  (db: Database)   │ │  (db: Database)   │ │  (db: Database)   │  │   
   │  └─────────┬─────────┘ └─────────┬─────────┘ └─────────┬─────────┘  │   
   └────────────┼─────────────────────┼─────────────────────┼────────────┘   
                │                     │                     │                 
                ▼ Injected into       ▼                     ▼                 
   ┌─────────────────────────────────────────────────────────────────────┐   
   │  3. Services (Application Layer)                                    │   
   │  ┌──────────────────────┐ ┌────────────────┐ ┌────────────────────┐ │   
   │  │   ProjectService     │ │  AreaService   │ │  CompanyService    │ │   
   │  │ (repo: IProjectRepo) │ │ (repo: IArea)  │ │ (repo: ICompany)   │ │   
   │  └──────────┬───────────┘ └───────┬────────┘ └─────────┬──────────┘ │   
   └─────────────┼─────────────────────┼────────────────────┼────────────┘   
                 │                     │                    │                 
                 ▼ Injected into       ▼                    ▼                 
   ┌─────────────────────────────────────────────────────────────────────┐   
   │  4. Controllers (Presentation Layer)                                │   
   │  ┌─────────────────────┐ ┌─────────────────┐ ┌─────────────────────┐│   
   │  │ ProjectController   │ │ AreaController  │ │ CompanyController   ││   
   │  │ (svc: ProjectService)│ │(svc: AreaSvc)  │ │(svc: CompanySvc)    ││   
   │  └──────────┬──────────┘ └────────┬────────┘ └──────────┬──────────┘│   
   └─────────────┼─────────────────────┼─────────────────────┼───────────┘   
                 │                     │                     │                
                 ▼ Registered in       ▼                     ▼                
   ┌─────────────────────────────────────────────────────────────────────┐   
   │  5. Express Routes                                                  │   
   │  ┌──────────────────────────────────────────────────────────────┐   │   
   │  │  app.use('/api', createProjectRoutes(projectController));    │   │   
   │  │  app.use('/api', createAreaRoutes(areaController));          │   │   
   │  │  app.use('/api', createCompanyRoutes(companyController));    │   │   
   │  │  app.use('/', createHealthRoutes(healthController));         │   │   
   │  └──────────────────────────────────────────────────────────────┘   │   
   └─────────────────────────────────────────────────────────────────────┘   
                                                                              
Why DI Matters:
• Loose Coupling: Services depend on interfaces, not concrete implementations
• Testability: Mock repositories in unit tests without touching database
• Swappability: Replace SQLite with PostgreSQL by changing only container.ts
• Single Source: All dependencies wired in one place for visibility
```

### Database Schema

```sql
-- Companies table
CREATE TABLE companies (
    company_id TEXT PRIMARY KEY,
    company_name TEXT NOT NULL
);

-- Projects table
CREATE TABLE projects (
    project_id TEXT PRIMARY KEY,
    project_name TEXT NOT NULL,
    project_start TEXT NOT NULL,  -- "YYYY-MM-DD HH:MM:SS"
    project_end TEXT NOT NULL,    -- "YYYY-MM-DD HH:MM:SS"
    company_id TEXT NOT NULL,
    description TEXT,
    project_value INTEGER NOT NULL,  -- GBP (£)
    FOREIGN KEY (company_id) REFERENCES companies(company_id)
);

-- Project-Area mapping (many-to-many)
CREATE TABLE project_area_map (
    project_id TEXT NOT NULL,
    area TEXT NOT NULL,
    PRIMARY KEY (project_id, area),
    FOREIGN KEY (project_id) REFERENCES projects(project_id)
);

-- Indexes for performance
CREATE INDEX idx_project_area_map_area ON project_area_map(area);
CREATE INDEX idx_projects_company_id ON projects(company_id);
CREATE INDEX idx_projects_value ON projects(project_value DESC);
```

---

## Feedback Compliance

This implementation incorporates feedback from the recruitment team:

### 1. ✅ Area Parameter Optional
Already implemented. `area` is an optional query parameter in `GET /api/projects?area=...`. Request succeeds with or without it.

### 2. ✅ Unified Response Envelope
**Implemented per feedback.** All endpoints return consistent `{success, data, pagination}` format:
- With pagination: `pagination` contains metadata (current_page, per_page, total_items, total_pages, has_next, has_prev)
- Without pagination: `pagination` is explicitly `null` (not absent)
- Avoids mixed formats (raw array vs wrapped object) that confuse clients
- Matches industry standards (GitHub, Stripe, JSON:API)

### 3. ✅ Use Best Judgment
Documented design rationale in [Design Choices](#design-choices) section. Key decisions:
- Rate limiting (120 req/min) for abuse prevention
- Request timeout (30s) for hanging query protection
- Cache headers (1-hour) on reference data
- Graceful shutdown that drains in-flight requests
- Server-side company filter for pagination correctness

### 4. ✅ Keyword Search Case-Insensitive
SQL `LIKE` operator is case-insensitive for ASCII characters. Implemented and documented in Assumptions.

### 5. ✅ Filters Passed to Backend
Confirmed. All filters (area, keyword, company) are backend-based via SQL `WHERE` clauses. Frontend passes input to API, not client-side filtering. Ensures pagination metadata is always accurate.

### 6. ✅ AngularJS 1.8.x Legacy Context Understood
This is intentional per the team's note about future assignment to legacy Angular projects. Implementation demonstrates:
- Proper TypeScript typing (`IProjectListScope` interface) despite 1.8.x limitations
- Understanding of AngularJS digest cycle (precomputed pageNumbers, not template functions)
- Familiarity with legacy framework constraints and workarounds

---

## Notes & Clarifications

### Why Filter on Button Click (Not Instant)?

The assignment mentioned this choice should be documented. We chose **button click** over instant filtering because:

1. **Reduced API calls**: Instant filtering fires requests on every keystroke, potentially hundreds per search
2. **Better UX for slow typers**: Users can compose their full search term before executing
3. **Clear user intent**: The user explicitly chooses when to search
4. **Server load**: Prevents unnecessary load, especially important for "thousands of projects per area"
5. **Enter key support**: Power users can still press Enter for quick searches

### Export and Large Dataset Handling

The spec mentions that "your endpoint may be used to retrieve the projects in a target area" for XLSX exports and notes "thousands of projects per area." This is supported by:

- Omitting `page` and `per_page` returns **all** matching projects in one response
- Response is a simple JSON array within the envelope (easy to parse and convert to XLSX)
- Area filter reduces dataset to relevant subset before export
- Rate limiting (120 req/min) allows bursts for export operations without blocking users

### Database Choice (sql.js)

We use **sql.js** (pure JavaScript SQLite) instead of `better-sqlite3` because:

1. No native compilation required (works on any Node.js version)
2. No build tools or Python needed
3. Portable across different operating systems
4. Sufficient performance for this use case

The tradeoff is slightly higher memory usage (database loaded into memory).

---

## License

This project was created as a take-home assignment for Glenigan.

---

