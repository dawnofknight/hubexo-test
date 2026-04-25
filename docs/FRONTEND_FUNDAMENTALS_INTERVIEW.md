# Senior Fullstack Interview Prep - Frontend Fundamentals & Architecture

Complete guide covering frontend architecture, design patterns, and how the frontend integrates with this project's backend.

---

## 📋 Table of Contents

1. [Frontend Architecture Overview](#frontend-architecture-overview)
2. [AngularJS Framework Deep Dive](#angularjs-framework-deep-dive)
3. [Data Flow: Frontend to Backend](#data-flow-frontend-to-backend)
4. [Component Design Patterns](#component-design-patterns)
5. [HTTP Communication](#http-communication)
6. [State Management](#state-management)
7. [Error Handling](#error-handling)
8. [Testing Strategy](#testing-strategy)
9. [Interview Questions & Answers](#interview-questions--answers)
10. [Fullstack Considerations](#fullstack-considerations)

---

## 🏗️ Frontend Architecture Overview

### Project Structure

```
frontend/
├── index.html              ← Entry point, bootstraps AngularJS
├── styles.css              ← Global styles
├── src/
│   ├── app.ts              ← Main module, bootstraps application
│   ├── types.ts            ← TypeScript interfaces
│   ├── config/
│   │   └── api.config.ts   ← API endpoints configuration
│   ├── services/
│   │   └── project.service.ts      ← HTTP communication (Data layer)
│   └── controllers/
│       └── project-list.controller.ts  ← View logic (Presentation layer)
└── test/
    ├── projectService.spec.js       ← Service tests
    └── projectListController.spec.js ← Controller tests
```

### Architecture Pattern: MVC (Model-View-Controller)

```
┌────────────────────────────────────────────┐
│ VIEW LAYER (HTML/DOM)                      │
│ - Displays data to user                    │
│ - Listens to user interactions             │
│ - Bound to $scope via ng-model, ng-repeat  │
└────────────────────┬───────────────────────┘
                     │ Events (ng-click)
                     │ Two-way binding (ng-model)
                     ▼
┌────────────────────────────────────────────┐
│ CONTROLLER LAYER                           │
│ - ProjectListController                    │
│ - Manages UI state ($scope)                │
│ - Handles user interactions                │
│ - Orchestrates service calls               │
└────────────────────┬───────────────────────┘
                     │ Service calls
                     │ Data manipulation
                     ▼
┌────────────────────────────────────────────┐
│ MODEL/SERVICE LAYER                        │
│ - ProjectService                           │
│ - Makes HTTP requests                      │
│ - Transforms API responses                 │
│ - Caches data (optional)                   │
└────────────────────┬───────────────────────┘
                     │ HTTP requests
                     │ API calls
                     ▼
            [BACKEND API]
            - Express.js
            - REST endpoints
            - Database operations
```

### Why MVC for Frontend?

| Benefit | Reason |
|---------|--------|
| **Separation of Concerns** | View, Logic, and Data are separate |
| **Testability** | Each layer can be tested independently |
| **Reusability** | Services can be used by multiple controllers |
| **Maintainability** | Easy to locate and fix bugs |
| **Scalability** | Can add new features without affecting existing code |

---

## 🔄 AngularJS Framework Deep Dive

### AngularJS Concepts Explained

#### 1. Modules

```typescript
// app.ts - Creating a module
angular.module('gleniganApp', []);
// ├─ First parameter: module name ('gleniganApp')
// ├─ Second parameter: dependencies array (empty in this case)
// └─ Purpose: Container for controllers, services, filters, directives

// Usage: Reference the module
angular.module('gleniganApp').controller(...);
angular.module('gleniganApp').factory(...);
```

**WHY modules?**
- Organize code into logical units
- Enable dependency injection
- Support testing (can mock dependencies)

---

#### 2. Dependency Injection (DI)

```typescript
// Pattern 1: Array notation (RECOMMENDED - survives minification)
angular.module('gleniganApp').controller('ProjectListController', [
  '$scope',
  'ProjectService',
  function($scope: IProjectListScope, ProjectService: IProjectService) {
    // $scope and ProjectService are injected
  }
]);

// Pattern 2: Function notation (breaks after minification)
angular.module('gleniganApp').controller('ProjectListController',
  function($scope, ProjectService) {
    // This breaks if code is minified (parameters renamed)
    // $scope becomes $a, ProjectService becomes $b
  }
);

// WHY array notation?
// ├─ Minifier cannot rename services in array
// ├─ Parameter names don't matter, array order does
// └─ Production-safe
```

**DI in Action:**

```
┌────────────────────────────────────┐
│ AngularJS Injector                 │
│ (Service Container)                │
├────────────────────────────────────┤
│ Registered services:               │
│ ├─ $scope                          │
│ ├─ $http                           │
│ ├─ $q                              │
│ ├─ ProjectService (custom)         │
│ └─ ... more services               │
└────────────────────────────────────┘
        │
        │ Provides requested services
        │
        ▼
┌────────────────────────────────────┐
│ Constructor/Function               │
│ ['$scope', 'ProjectService', func] │
├────────────────────────────────────┤
│ Injector matches:                  │
│ ├─ Parameter 1 ← $scope            │
│ ├─ Parameter 2 ← ProjectService    │
│ └─ Function called with services   │
└────────────────────────────────────┘
```

---

#### 3. Services (Factories)

```typescript
// project.service.ts
angular.module('gleniganApp').factory('ProjectService', [
  '$http',
  '$q',
  function($http, $q) {
    // Service definition
    return {
      getProjects: function(params) { ... },
      getAreas: function() { ... }
    };
  }
]);

// Why services?
// ├─ Singleton (single instance across app)
// ├─ Reusable across multiple controllers
// ├─ Encapsulate business logic
// ├─ Testable independently
// └─ Handle API communication
```

**Service vs Factory vs Controller:**

| Type | Purpose | Lifetime |
|------|---------|----------|
| **Controller** | Manage view state, handle user interactions | Created/destroyed with view |
| **Service (Factory)** | Shared logic, API calls, data transformation | Singleton (one instance) |
| **Filter** | Transform data display (currency, date, uppercase) | Called on demand |
| **Directive** | Reusable DOM components (ng-repeat, ng-model) | Attached to DOM |

---

#### 4. Scope ($scope)

```typescript
// In ProjectListController
$scope.projects = [];           // Data
$scope.loadProjects = function() { ... };  // Method
$scope.filters = { ... };       // Filter state

// $scope is:
// ├─ Glue between controller and view
// ├─ Two-way binding source
// ├─ Event emitter (broadcast/emit)
// └─ Lifecycle management

// Life cycle:
// 1. Creation: Controller instantiated, $scope created
// 2. Watcher registration: ng-model, ng-if watch for changes
// 3. Model mutation: $scope properties change
// 4. Observation: Watchers detect changes
// 5. View update: DOM updates automatically
// 6. Destruction: When view destroyed, $scope cleaned up
```

---

#### 5. Two-Way Data Binding

```html
<!-- In HTML (index.html) -->
<input ng-model="filters.keyword" />

<!-- How it works -->
1. User types in input
   ↓
2. ng-model listener detects change
   ↓
3. Updates $scope.filters.keyword
   ↓
4. Angular digest cycle runs
   ↓
5. Controller detects change
   ↓
6. Can call loadProjects() with new filters
   ↓
7. Data fetched from API
   ↓
8. $scope.projects updated
   ↓
9. View updates with new data

<!-- Benefits -->
✓ No manual DOM manipulation
✓ Declarative (HTML shows intent)
✓ Automatic synchronization
```

---

#### 6. Promises and Async Operations

```typescript
// $q service (AngularJS Promise library)
getProjects(params): ng.IPromise<IProjectsResult> {
  return $http.get(API_ENDPOINTS.PROJECTS, { params })
    .then(function(response) {
      // Success handler
      // Transform response data
      return { projects: response.data.data, ... };
    })
    .catch(function(error) {
      // Error handler
      console.error('Error:', error);
      return $q.reject(error);
    });
}

// How promises work:
// Pending → (async operation) → Resolved or Rejected
//
// Then handlers:
// .then(success, error, progress)  // Old Promise API
// .then(success).catch(error)      // Modern API

// In controller:
ProjectService.getProjects(params)
  .then(function(result) {
    // Called when promise resolves
    $scope.projects = result.projects;
  })
  .catch(function(error) {
    // Called when promise rejects
    $scope.error = error.message;
  })
  .finally(function() {
    // Always called
    $scope.loading = false;
  });
```

**Promise State Flow:**

```
REQUEST INITIATED
    │
    ▼
PENDING (waiting for response)
    │
    ├─ Response arrives ✓
    │  │
    │  ▼
    │  RESOLVED
    │  │
    │  ├─ .then() handler called
    │  ├─ Success callback executes
    │  └─ Data flows to controller
    │
    └─ Error occurs ✗
       │
       ▼
       REJECTED
       │
       ├─ .catch() handler called
       ├─ Error callback executes
       └─ Error flows to controller
```

---

## 📊 Data Flow: Frontend to Backend

### Complete User Interaction Flow

```
STEP 1: USER ACTION (Frontend)
────────────────────────────────
User types in search box and clicks "Search"

HTML:
<input ng-model="filters.keyword" />
<button ng-click="applyFilters()">Search</button>

                    │
                    ▼

STEP 2: CONTROLLER HANDLES EVENT
────────────────────────────────────
$scope.applyFilters = function() {
  $scope.pagination.currentPage = 1;
  $scope.loadProjects();
}

$scope.loadProjects = function() {
  $scope.loading = true;
  
  const params = {
    page: $scope.pagination.currentPage,
    per_page: $scope.pagination.perPage,
    keyword: $scope.filters.keyword.trim()
  };
  
  ProjectService.getProjects(params)
    .then(handleSuccess)
    .catch(handleError)
    .finally(() => $scope.loading = false);
}

                    │
                    ▼

STEP 3: SERVICE MAKES HTTP REQUEST
──────────────────────────────────────
$http.get('/api/projects?page=1&per_page=20&keyword=north')

                    │
                    ▼

STEP 4: BACKEND PROCESSES
──────────────────────────────────────
Express → Controller → Service → Repository → Database

                    │
                    ▼

STEP 5: BACKEND SENDS RESPONSE
───────────────────────────────────
HTTP 200 OK
{
  "success": true,
  "data": [...projects],
  "pagination": {...}
}

                    │
                    ▼

STEP 6: CONTROLLER UPDATES STATE
────────────────────────────────────
$scope.projects = result.projects;
$scope.pagination = result.pagination;

                    │
                    ▼

STEP 7: VIEW UPDATES
─────────────────────
ng-repeat renders new projects

                    │
                    ▼

STEP 8: USER SEES RESULTS
───────────────────────────
Projects table updates on screen
```

---

## 🎨 Component Design Patterns

### Pattern 1: Container vs Presentational Components

```typescript
// CONTAINER COMPONENT (Smart)
angular.module('gleniganApp').controller('ProjectListController', [
  '$scope',
  'ProjectService',
  function($scope, ProjectService) {
    // SMART: Knows about ProjectService
    // SMART: Orchestrates data fetching
    // SMART: Manages complex state
    
    $scope.loadProjects = function() {
      ProjectService.getProjects(params)
        .then(...) 
        .catch(...) 
    };
  }
]);

// PRESENTATIONAL COMPONENT (Dumb)
// In the HTML view
// - Receives data via $scope
// - Renders data
// - Emits events via ng-click
// - Doesn't know about services

// WHY this pattern?
// ├─ Container handles complexity
// ├─ View stays simple
// ├─ Easy to test each separately
// └─ Reusable views
```

### Pattern 2: Dependency Injection (Not Service Locator)

```typescript
// ❌ ANTI-PATTERN: Service Locator
angular.module('gleniganApp').controller('BadController', [
  '$http',
  function($http) {
    this.getData = function() {
      $http.get('/api/projects').then(...);
    };
  }
]);

// ✓ PATTERN: Dependency Injection
angular.module('gleniganApp').controller('GoodController', [
  'ProjectService',
  function(ProjectService) {
    this.getData = function() {
      ProjectService.getProjects().then(...);
    };
  }
]);
```

---

## 🌐 HTTP Communication

### API Configuration

```typescript
// config/api.config.ts
const API_BASE_URL = (window as any).API_BASE_URL || '/api';

const API_ENDPOINTS = {
  PROJECTS: API_BASE_URL + '/projects',
  AREAS: API_BASE_URL + '/areas',
  COMPANIES: API_BASE_URL + '/companies'
} as const;

// WHY centralize?
// ├─ Single source of truth
// ├─ Easy to change in one place
// ├─ Supports environment configuration
// └─ Docker: window.API_BASE_URL set by container
//    Local: defaults to '/api' (proxied)
//    Production: can inject URL at runtime
```

### HTTP Request/Response Cycle

```typescript
function getProjects(params: IProjectQueryParams): ng.IPromise<IProjectsResult> {
  const queryParams: Record<string, string | number> = {};
  if (params.area) queryParams.area = params.area;
  if (params.keyword) queryParams.keyword = params.keyword;
  
  return $http.get<IApiResponse<IProject[]>>(
    API_ENDPOINTS.PROJECTS,
    { params: queryParams }
  )
    .then(function(response) {
      const apiResponse = response.data;
      return {
        projects: apiResponse.data,
        pagination: apiResponse.pagination
      };
    })
    .catch(function(error) {
      console.error('Error fetching projects:', error);
      return $q.reject(error);
    });
}
```

---

## 🗂️ State Management

### State in This Project

```typescript
// Pattern: $scope as state container
$scope.projects = [];              // Data from API
$scope.areas = [];                 // Dropdown options
$scope.loading = false;            // Loading indicator
$scope.error = null;               // Error messages
$scope.filters = {                 // Filter state
  keyword: '',
  area: '',
  company: ''
};
$scope.pagination = {              // Pagination state
  currentPage: 1,
  perPage: 20,
  totalItems: 0,
  totalPages: 0,
  hasNext: false,
  hasPrev: false
};

// Why this approach?
// ✓ Simple for small apps
// ✓ Automatic two-way binding
// ✗ Hard to track state changes in large apps
// ✗ No single source of truth
// ✗ Watchers can impact performance
```

---

## ⚠️ Error Handling

### Multi-Layer Error Handling

```typescript
// In Controller
$scope.error = null;

ProjectService.getProjects(params)
  .then(function(result) {
    $scope.projects = result.projects;
    $scope.error = null;
  })
  .catch(function(error) {
    console.error('Failed to load projects:', error);
    $scope.error = error?.data?.error?.message 
      || 'Failed to load projects. Please try again.';
    $scope.projects = [];
  })
  .finally(function() {
    $scope.loading = false;
  });

// In Template
<div ng-if="error" class="alert alert-danger">
  {{ error }}
</div>

<div ng-if="loading" class="spinner">
  Loading...
</div>

<table ng-if="!loading && projects.length > 0">
  <tr ng-repeat="project in projects">
    <td>{{ project.project_name }}</td>
  </tr>
</table>
```

---

## 🧪 Testing Strategy

### Unit Testing Services

```javascript
describe('ProjectService', function() {
  var ProjectService;
  var $httpBackend;
  
  beforeEach(module('gleniganApp'));
  
  beforeEach(inject(function(_ProjectService_, _$httpBackend_) {
    ProjectService = _ProjectService_;
    $httpBackend = _$httpBackend_;
  }));
  
  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });
  
  it('should fetch projects from API', function() {
    var mockResponse = {
      success: true,
      data: [{ project_name: 'Test Project' }]
    };
    
    $httpBackend.expectGET('/api/projects')
      .respond(mockResponse);
    
    var result = ProjectService.getProjects({});
    $httpBackend.flush();
    
    expect(result.projects.length).toBe(1);
  });
});
```

### Unit Testing Controllers

```javascript
describe('ProjectListController', function() {
  var $scope;
  var $controller;
  var ProjectService;
  
  beforeEach(module('gleniganApp'));
  
  beforeEach(inject(function(_$controller_, _$rootScope_, _ProjectService_) {
    $scope = _$rootScope_.$new();
    $controller = _$controller_;
    ProjectService = _ProjectService_;
  }));
  
  it('should load projects on init', function() {
    var mockProjects = [
      { project_name: 'Project A' }
    ];
    
    spyOn(ProjectService, 'getProjects')
      .and.returnValue(Promise.resolve({
        projects: mockProjects,
        pagination: {}
      }));
    
    $controller('ProjectListController', {
      $scope: $scope,
      ProjectService: ProjectService
    });
    
    $scope.$digest();
    expect($scope.projects).toEqual(mockProjects);
  });
});
```

---

## 🎤 Interview Questions & Answers

### Q1: Explain the data flow from user interaction to database and back

**Answer:**
User → HTML ng-click → Controller → Service → HTTP GET → Backend Controller → Service → Repository → Database → Response → Promise resolve → $scope update → ng-repeat render → DOM update

### Q2: What's the difference between Factory and Service in AngularJS?

**Answer:**
Both create singletons. Factory uses `.factory()` and returns anything. Service uses `.service()` and uses 'new' keyword. Factory is more flexible and commonly used.

### Q3: How does two-way data binding work?

**Answer:**
User types → ng-model detects → updates $scope property → digest cycle runs → watchers fire → callbacks execute → DOM updates automatically.

### Q4: Why dependency injection instead of global variables?

**Answer:**
DI provides loose coupling, testability (easy mocking), clear dependencies, and minification safety (array notation). Global variables are tightly coupled and hard to test.

### Q5: Explain error handling in this project

**Answer:**
Multi-layer: $http catches errors → Service propagates rejection → Controller catches promise rejection → Sets $scope.error → View displays error message.

### Q6: What are AngularJS advantages and disadvantages?

**Answer:**
Advantages: Two-way binding, DI, built-in services, directives, filters, MVC.
Disadvantages: Learning curve, performance (digest), large file size, deprecated framework (replaced by Angular 2+).

### Q7: How would you optimize this frontend?

**Answer:**
Cache responses (areas rarely change), lazy load dropdowns, pagination, minimize watches, use one-time binding, minify/uglify, code splitting, CDN for static assets.

### Q8: How would you test ProjectListController?

**Answer:**
Mock ProjectService, inject into controller, spy on methods, digest $scope, verify calls and state changes. Test success, error, and edge cases separately.

---

## 🔗 Fullstack Considerations

### Frontend-Backend Integration

```typescript
// Frontend calls backend CRUD endpoints

// CREATE
POST /api/areas → Backend generates ID → Returns with createdAt, status

// READ
GET /api/areas?filters → Backend queries database → Returns filtered paginated results

// UPDATE
PATCH /api/areas/id → Backend updates and sets updatedAt → Returns updated entity

// DELETE
DELETE /api/areas/id → Backend soft-deletes (sets status='archived')

// BULK
POST /api/areas/bulk/create → Returns created and skipped
DELETE /api/areas/bulk/delete → Returns count deleted
```

### API Contract

Both frontend and backend must agree on:

```typescript
interface IArea {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

interface IApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: IPaginationMeta;
}
```

### Environment Configuration

```typescript
// Development: window.API_BASE_URL = 'http://localhost:3000/api'
// Docker: nginx proxies /api to backend, window.API_BASE_URL = '/api'
// Production: Injected at runtime
```

---

## 📚 Related Documentation

- [CRUD_API_REFERENCE.md](CRUD_API_REFERENCE.md) - Backend API endpoints
- [CRUD_DATAFLOW.md](CRUD_DATAFLOW.md) - Backend data flow
- [CRUD_ARCHITECTURE_PATTERNS.md](CRUD_ARCHITECTURE_PATTERNS.md) - Design patterns
- [ARCHITECTURE_OVERVIEW.md](ARCHITECTURE_OVERVIEW.md) - Overall system architecture

---

## 🎓 Key Interview Takeaways

1. **MVC Pattern**: Separation of concerns (View, Controller, Service)
2. **Data Flow**: User → Controller → Service → HTTP → Backend → Database
3. **Dependency Injection**: Services injected, not created (testable)
4. **Two-way Binding**: Automatic $scope ↔ View sync
5. **Error Handling**: Multiple layers (service, controller, view)
6. **Testing**: Unit test with mocks, E2E for integration
7. **State Management**: $scope holds UI state, sync with backend
8. **HTTP**: Use promises, handle errors, transform responses
9. **CRUD Integration**: Frontend calls backend CRUD endpoints
10. **Performance**: Cache, lazy load, minimize watchers, optimize bundle
