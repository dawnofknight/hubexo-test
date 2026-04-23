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
- [Design Choices](#design-choices)
- [Assumptions](#assumptions)
- [Tradeoffs](#tradeoffs)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [Architecture](#architecture)

---

## Overview

This application provides a searchable, filterable list of construction projects across the UK. It was built as a take-home assignment demonstrating:

- REST API design and implementation
- Database querying with pagination
- Error handling best practices
- Legacy AngularJS frontend development
- Docker containerization

---

## Features

### Backend
- ✅ **RESTful API** with Express.js and TypeScript (strict mode)
- ✅ **SQLite database** with efficient querying via sql.js
- ✅ **Server-side pagination** with optional fetch-all mode
- ✅ **Advanced filtering**: area, keyword (case-insensitive), company
- ✅ **Single project lookup** via `GET /api/projects/:id` (PROJECT_NOT_FOUND 404)
- ✅ **Unified response envelope** — all endpoints return consistent `{success, data, pagination}` format
- ✅ **Rate limiting** — 120 req/min per IP with X-RateLimit headers
- ✅ **Request timeout** — 30s with X-Request-Id correlation
- ✅ **Cache headers** — 1-hour public cache on reference data (`/areas`, `/companies`)
- ✅ **Graceful shutdown** — drains in-flight requests, 10s safety timeout
- ✅ **Comprehensive error handling** with error codes (INVALID_PAGINATION, AREA_NOT_FOUND, PROJECT_NOT_FOUND, RATE_LIMITED, etc.)
- ✅ **Health check** endpoint with database status
- ✅ **Configurable CORS** via `ALLOWED_ORIGINS` env var (wide-open only when unset)

### Frontend
- ✅ **AngularJS 1.8.x** single-page application with proper TypeScript typing
- ✅ **Project list** with all required fields (name, company, dates, value, area)
- ✅ **Button-click filtering** (not instant) to reduce API calls and improve UX
- ✅ **Advanced filters**: keyword, area, company (now backend-based for pagination correctness)
- ✅ **Precomputed pagination numbers** — avoids per-digest recalculation in AngularJS
- ✅ **Responsive design** with modern CSS
- ✅ **Pagination controls** (first, prev, numbered buttons, next, last)
- ✅ **Loading states and error handling** with user-friendly messages
- ✅ **Currency formatting** (£ with locale separators)
- ✅ **Date formatting** (DD MMM YYYY, en-GB locale)

### DevOps
- ✅ **Docker containerization** with multi-stage builds for minimal images
- ✅ **Docker Compose** orchestration with health checks
- ✅ **Nginx reverse proxy** as single entry point (eliminates CORS in production)
- ✅ **Gzip compression** on static assets
- ✅ **1-year cache** for static files (.js, .css, images)
- ✅ **Security headers** (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)

---

## Project Structure

```
glenigan-takehome/
├── backend/                      # Express.js API
│   ├── src/
│   │   ├── index.ts              # Application entry point
│   │   ├── database.ts           # SQLite database connection (sql.js)
│   │   ├── projectService.ts     # Business logic for projects
│   │   ├── types.ts              # TypeScript interfaces
│   │   └── errors.ts             # Error handling utilities
│   ├── glenigan_takehome FS.db   # SQLite database
│   ├── Dockerfile                # Backend Docker configuration
│   ├── .dockerignore
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                     # AngularJS 1.8.x application
│   ├── src/
│   │   ├── app.ts                # Module, service, and controller
│   │   └── types.ts              # TypeScript interfaces
│   ├── dist/                     # Compiled JavaScript (generated)
│   ├── index.html                # Main HTML page
│   ├── styles.css                # CSS styling
│   ├── nginx.conf                # Nginx configuration for Docker
│   ├── Dockerfile                # Frontend Docker configuration
│   ├── .dockerignore
│   ├── package.json
│   └── tsconfig.json
│
├── docker-compose.yml            # Docker Compose configuration
├── .gitignore                    # Git ignore rules
└── README.md                     # This file
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

### Backend

| Decision | Rationale |
|----------|-----------|
| **Unified response envelope** | All endpoints return `{success, data, pagination}` where pagination is null when not requested. Avoids mixed formats (raw array vs wrapped object) which confuse frontend clients. Matches industry practice (GitHub, Stripe, JSON:API). |
| **Company filter in backend** | Server-side filtering ensures pagination metadata is always correct (not misleading when client-side filters). Reduces data transfer for large company result sets. |
| **Rate limiting (120 req/min)** | Protects API from abuse; X-RateLimit headers inform clients of quota status. Prevents brute-force attacks on filterable endpoints. |
| **Request timeout (30s)** | Kills long-running queries that would hang; returns 408 with X-Request-Id for debugging. Prevents connection exhaustion. |
| **Cache headers (1-hour)** | Reference data (`/areas`, `/companies`) changes rarely; browsers/CDNs cache to reduce server load. |
| **Graceful shutdown** | `server.close()` drains in-flight requests; 10s safety timeout prevents hang. Critical in containerized deployments (rolling updates). |
| **Deferred area validation** | `areaExists()` check only runs when results are empty, saving 1 DB query on the common happy path. |
| **Express.js + TypeScript** | Lightweight, widely adopted, with type safety |
| **sql.js (Pure JS SQLite)** | No native compilation required, works everywhere |
| **Singleton database pattern** | Efficient connection reuse |
| **Async/await throughout** | Clean, readable async code |
| **Separate service layer** | Business logic isolated from routes |
| **Structured error handling** | Error codes (AREA_NOT_FOUND, PROJECT_NOT_FOUND, RATE_LIMITED, etc.) allow programmatic client handling |

### Frontend

| Decision | Rationale |
|----------|-----------|
| **Filter on button click** | Reduces API calls, better UX for slow typers, clear user control. Avoids hundreds of requests per typing session. |
| **Server-side company filter** | Ensures pagination metadata is accurate when company is selected. Deferred to backend for correctness (not just scope). |
| **Precomputed page numbers** | `$scope.pageNumbers` updated on pagination change, not called from template inside ng-repeat (avoids per-digest recomputation in AngularJS). |
| **Proper `$scope` typing** | `IProjectListScope` interface replaces `$scope: any`, catching type errors at compile-time despite legacy AngularJS 1.8.x. |
| **Server-side pagination** | Efficient for large datasets (1800+ records). Pagination is optional; omitting both `page`/`per_page` returns all records for exports. |
| **Responsive design** | CSS Grid + media queries, works on desktop and mobile. |
| **Plain CSS** | No build tooling required, matches spec. CSS variables for maintainability. |

### Docker

| Decision | Rationale |
|----------|-----------|
| **Multi-stage builds** | Smaller production images |
| **nginx for frontend** | Production-grade static file serving |
| **nginx as API proxy** | Single entry point, eliminates CORS in production |
| **Health checks** | Container orchestration support |
| **Named network** | Clean service discovery |

---

## Assumptions

1. **One project per area in results**: While the database supports many-to-many relationships between projects and areas, when filtering by area, only that area is returned for each matching project. (A project may appear on multiple rows if it maps to multiple areas, but each row is distinct.)

2. **Pagination is optional**: When both `page` and `per_page` are omitted, all projects are returned without pagination metadata (`pagination: null`). This supports export/report use cases mentioned in requirements.

3. **Case-insensitive keyword search**: The keyword search uses SQL LIKE with wildcards for partial matching and is case-insensitive (works correctly for ASCII; Unicode handling depends on SQLite collation).

4. **Exact area matching**: Area names must match exactly (case-sensitive) since they're predefined values from `project_area_map`.

5. **Company filter is server-side**: Implemented in backend SQL (`WHERE c.company_name = ?`) for pagination correctness. Frontend passes the filter to the API, not just the client-side filtering mentioned in earlier iterations.

6. **Description can be null**: Projects without descriptions return `null` rather than empty strings.

7. **Unified response envelope**: All API responses use `{success, data, pagination}` format. This is consistent per the feedback and industry best practices.

---

## Tradeoffs

### Performance vs Simplicity

| Choice | Tradeoff |
|--------|----------|
| **sql.js (pure JS SQLite)** | Slightly slower than native SQLite, but no compilation issues across OS/Node versions. Database loaded into memory. |
| **Single-threaded Node.js** | Simple, but may bottleneck under heavy concurrent load. Rate limiting mitigates brute-force; load balancing handles scaling. |
| **Deferred `areaExists()` validation** | Saves 1 DB query on happy path but adds check on empty results. Trade: complexity for 1-query reduction on 99% of requests. |

### API Design

| Choice | Tradeoff |
|--------|----------|
| **Unified response envelope** | Consistent format across all endpoints. Minimal overhead (`pagination: null` is cheap) vs mixed formats that surprise clients. |
| **Server-side company filter** | Requires SQL join, but ensures pagination correctness. Alternative (client-side) would mislead pagination metadata. |
| **Area exact-match validation** | Extra query only on empty results; prevents "no projects found" ambiguity (bad area vs zero matches). |

### Frontend Architecture

| Choice | Tradeoff |
|--------|----------|
| **Legacy AngularJS 1.8.x** | Not a choice (spec requirement), but shows ability to work in brownfield legacy environments with TypeScript typing. |
| **Precomputed `pageNumbers`** | Trades storage (one small array on scope) for eliminating per-digest function calls. Measurable performance gain in AngularJS 1.x. |

### Docker

| Choice | Tradeoff |
|--------|----------|
| **nginx reverse proxy** | Adds Docker image size (~10 MB), but eliminates CORS issues and provides single entry point for load balancing. |
| **Alpine Linux images** | Minimal (~40 MB Node), but fewer packages available if future needs arise. Sufficient for this app. |
| **Health checks** | Small overhead (10 endpoints/min) but critical for orchestration and rolling deployments. |

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

**Test Coverage: 47 tests**
- **Error Module Tests** (4 tests)
  - ApiException creation with/without details
  - ErrorCode enum with PROJECT_NOT_FOUND, RATE_LIMITED

- **ProjectService Integration Tests** (28 tests)
  - `getAllAreas()` - returns sorted UK areas
  - `getAllCompanies()` - returns companies with proper structure
  - `areaExists()` - validates area existence with deferred check
  - `getProjectById()` - returns project details or undefined
  - `fetchProjects()` - pagination, filtering by area/keyword/company

- **API Endpoint Tests** (15 tests)
  - `GET /health` - health check with database status
  - `GET /api/areas` - area listing with cache headers
  - `GET /api/companies` - company listing with cache headers
  - `GET /api/projects/:id` - single project or PROJECT_NOT_FOUND 404
  - `GET /api/projects` - with pagination, area, keyword, company filters
  - Keyword length validation (400 VALIDATION_ERROR)
  - Error handling (400, 404, 429 responses)

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

**Summary: 81 total tests (47 backend + 34 frontend) — all passing.**

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

### System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Docker Network                           │
│  ┌─────────────────────────┐    ┌─────────────────────────────┐ │
│  │       Frontend          │    │         Backend              │ │
│  │    (nginx:alpine)       │    │    (node:20-alpine)          │ │
│  │                         │    │                              │ │
│  │  ┌──────────────────┐   │    │  ┌───────────────────────┐  │ │
│  │  │   Static Files   │   │    │  │    Express.js API     │  │ │
│  │  │  - index.html    │   │    │  │                       │  │ │
│  │  │  - styles.css    │   │    │  │  /api/projects       │  │ │
│  │  │  - app.js        │   │    │  │  /api/areas          │  │ │
│  │  │  - angular.min.js│   │    │  │  /api/companies      │  │ │
│  │  └──────────────────┘   │    │  │  /health             │  │ │
│  │                         │    │  └───────────────────────┘  │ │
│  │  ┌──────────────────┐   │    │              │              │ │
│  │  │  Nginx Proxy     │───┼────┼──────────────┘              │ │
│  │  │  /api/* → backend│   │    │                              │ │
│  │  └──────────────────┘   │    │  ┌───────────────────────┐  │ │
│  │                         │    │  │  SQLite Database      │  │ │
│  │         :80             │    │  │  (sql.js in-memory)   │  │ │
│  └─────────────────────────┘    │  └───────────────────────┘  │ │
│            │                    │              :3000           │ │
└────────────┼────────────────────┼──────────────────────────────┘
             │                    │
         Port 8080            Port 3000
             │                    │
      ┌──────┴────────────────────┴──────┐
      │           Host Machine           │
      │                                  │
      │   Browser → localhost:8080       │
      │   API     → localhost:3000       │
      └──────────────────────────────────┘
```

### Data Flow

```
User Action (Filter/Search)
         │
         ▼
┌─────────────────────┐
│  AngularJS Frontend │
│  (ProjectService)   │
└─────────┬───────────┘
          │ HTTP GET /api/projects?...
          ▼
┌─────────────────────┐
│  Express.js Router  │
│  (Validation)       │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  ProjectService     │
│  (Business Logic)   │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│  Database Layer     │
│  (sql.js SQLite)    │
└─────────┬───────────┘
          │ SQL Query with JOINs
          ▼
┌─────────────────────┐
│  SQLite Database    │
│  - projects         │
│  - companies        │
│  - project_area_map │
└─────────────────────┘
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

## Contact

For questions about this assignment, contact: alvin.megatroika@bcicentral.hubexo.com
