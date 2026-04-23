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
- ✅ RESTful API with Express.js and TypeScript
- ✅ SQLite database with efficient querying
- ✅ Pagination support (server-side)
- ✅ Filtering by area and keyword search
- ✅ Comprehensive error handling
- ✅ Health check endpoint
- ✅ CORS enabled for development

### Frontend
- ✅ AngularJS 1.8.x single-page application
- ✅ Project list with all required fields
- ✅ Search bar for project name filtering
- ✅ Area dropdown filter
- ✅ Company filter (bonus feature)
- ✅ Responsive design
- ✅ Pagination controls
- ✅ Loading states and error handling

### DevOps
- ✅ Docker containerization
- ✅ Docker Compose for easy deployment
- ✅ Nginx reverse proxy
- ✅ Health checks
- ✅ Production-ready configuration

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

#### `GET /api/areas`

Returns all available areas for the filter dropdown.

**Response:**
```json
{
  "success": true,
  "data": ["Birmingham", "Bristol", "Cardiff", "Edinburgh", "Glasgow", "Leeds", "Liverpool", "London", "Manchester", "Newcastle"]
}
```

#### `GET /api/companies`

Returns all companies for the filter dropdown.

**Response:**
```json
{
  "success": true,
  "data": [
    { "company_id": "c-001", "company_name": "ABC Construction" },
    { "company_id": "c-002", "company_name": "AJAX Civil Works" }
  ]
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
| `AREA_NOT_FOUND`     | 404         | Specified area doesn't exist          |
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

**Filter by Company (Bonus):**
- Select a company from the dropdown
- Click "Search" to apply

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
| **Express.js + TypeScript** | Lightweight, widely adopted, with type safety |
| **sql.js (Pure JS SQLite)** | No native compilation required, works everywhere |
| **Singleton database pattern** | Efficient connection reuse |
| **Async/await throughout** | Clean, readable async code |
| **Separate service layer** | Business logic isolated from routes |
| **Structured error handling** | Consistent error responses with error codes |

### Frontend

| Decision | Rationale |
|----------|-----------|
| **Filter on button click** | Reduces API calls, better UX for slow typers, clear user control |
| **Client-side company filter** | API doesn't support this; keeps backend scope minimal |
| **Server-side pagination** | Efficient for large datasets (1800+ records) |
| **Responsive design** | Works on desktop and mobile |
| **Plain CSS** | No build tooling required, meets spec requirements |

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

1. **One project per area in results**: While the database supports many-to-many relationships between projects and areas, when filtering by area, only that area is returned for each matching project.

2. **Pagination is optional**: When both `page` and `per_page` are omitted, all projects are returned without pagination metadata. This supports export/report use cases mentioned in requirements.

3. **Case-insensitive keyword search**: The keyword search uses SQL LIKE with wildcards for partial matching and is case-insensitive.

4. **Exact area matching**: Area names must match exactly (case-sensitive) since they're predefined values.

5. **Company filter is client-side**: The spec lists this as optional ("nice to have"), so it's implemented as a client-side filter to avoid extending the API beyond requirements.

6. **Description can be null**: Projects without descriptions return `null` rather than empty strings.

---

## Tradeoffs

### Performance vs Simplicity

| Choice | Tradeoff |
|--------|----------|
| sql.js (pure JS) | Slightly slower than native SQLite, but no compilation issues |
| Single-threaded | Simple architecture, but may bottleneck under heavy load |
| Client-side company filter | Fetches more data than necessary |

### API Design

| Choice | Tradeoff |
|--------|----------|
| Different response formats (paginated vs non-paginated) | Frontend handles both cases, but matches spec exactly |
| Area validation against DB | Extra query per request, but prevents confusing "empty results" |

### Docker

| Choice | Tradeoff |
|--------|----------|
| nginx proxy | Adds complexity, but eliminates CORS and provides single entry point |
| Alpine images | Smaller size, but some compatibility concerns |

---

## Error Handling

### Backend Errors

| Scenario | HTTP Code | Error Code | Response |
|----------|-----------|------------|----------|
| Invalid page (negative, zero, non-numeric) | 400 | `INVALID_PAGINATION` | Error with details |
| Invalid per_page (negative, zero, >1000, non-numeric) | 400 | `INVALID_PAGINATION` | Error with details |
| Area not found | 404 | `AREA_NOT_FOUND` | Error with available areas hint |
| Database connection error | 500 | `DATABASE_ERROR` | Safe error message |
| Unknown route | 404 | `NOT_FOUND` | Resource not found message |
| Unexpected error | 500 | `INTERNAL_ERROR` | Generic error message |

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

**Test Coverage:**
- **Error Module Tests** (4 tests)
  - ApiException creation and properties
  - Error code enum validation

- **ProjectService Integration Tests** (28 tests)
  - `getAllAreas()` - returns sorted UK areas
  - `getAllCompanies()` - returns companies with proper structure
  - `areaExists()` - validates area existence
  - `fetchProjects()` - pagination, filtering by area/keyword

- **API Endpoint Tests** (15 tests)
  - `GET /health` - health check response
  - `GET /api/areas` - area listing
  - `GET /api/companies` - company listing
  - `GET /api/projects` - with all filter combinations
  - Error handling (400, 404 responses)

#### Frontend Tests (Karma + Jasmine)

```bash
cd frontend

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

**Test Coverage:**
- **ProjectService Tests** (8 tests)
  - API calls for projects, areas, companies
  - Filter parameter handling
  - Error handling

- **ProjectListController Tests** (26 tests)
  - Initialization state
  - Filter application and clearing
  - Pagination navigation (next/prev/goToPage)
  - Helper functions (formatCurrency, formatDate, getPageNumbers)

### Manual API Testing

```bash
# Get all projects (no pagination)
curl "http://localhost:3000/api/projects"

# Get paginated projects
curl "http://localhost:3000/api/projects?page=1&per_page=10"

# Filter by area
curl "http://localhost:3000/api/projects?area=London&page=1&per_page=10"

# Search by keyword
curl "http://localhost:3000/api/projects?keyword=bridge&page=1&per_page=10"

# Combined filters
curl "http://localhost:3000/api/projects?area=Manchester&keyword=road&page=1&per_page=20"

# Get areas
curl "http://localhost:3000/api/areas"

# Get companies
curl "http://localhost:3000/api/companies"

# Health check
curl "http://localhost:3000/health"

# Error cases
curl "http://localhost:3000/api/projects?area=InvalidArea"    # 404
curl "http://localhost:3000/api/projects?page=-1"              # 400
curl "http://localhost:3000/api/projects?page=abc"             # 400
curl "http://localhost:3000/api/projects?per_page=0"           # 400
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

## Notes & Clarifications

### Why Filter on Button Click (Not Instant)?

The assignment mentioned this choice should be documented. We chose **button click** over instant filtering because:

1. **Reduced API calls**: Instant filtering fires requests on every keystroke, potentially hundreds per search
2. **Better UX for slow typers**: Users can compose their full search term before executing
3. **Clear user intent**: The user explicitly chooses when to search
4. **Server load**: Prevents unnecessary load, especially important for "thousands of projects per area"
5. **Enter key support**: Power users can still press Enter for quick searches

### Report Export Consideration

The spec mentions that "your endpoint may be used to retrieve the projects in a target area" for XLSX exports. This is supported by:

- Omitting pagination parameters returns **all** projects
- Response is a simple JSON array (easy to convert to XLSX)
- Area filter reduces dataset to relevant subset

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
