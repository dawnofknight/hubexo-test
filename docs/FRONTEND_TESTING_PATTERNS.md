# Frontend Testing Patterns - Testing Strategies and Examples

Comprehensive guide for testing frontend applications, specifically AngularJS, with real examples from the Glenigan project.

---

## 📋 Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Pyramid](#test-pyramid)
3. [AngularJS Testing Fundamentals](#angularjs-testing-fundamentals)
4. [Unit Testing](#unit-testing)
5. [Integration Testing](#integration-testing)
6. [E2E Testing](#e2e-testing)
7. [Testing Best Practices](#testing-best-practices)
8. [Common Pitfalls](#common-pitfalls)
9. [Coverage & Metrics](#coverage--metrics)
10. [Performance Testing](#performance-testing)

---

## 🎯 Testing Philosophy

### Why Test Frontend Code?

```
WITHOUT TESTS (Risk Zone)
├─ Manual testing every change (slow)
├─ Regressions slip through (expensive)
├─ Refactoring is scary (brittle code)
├─ Debugging takes hours (no safety net)
└─ Confidence: 40%

WITH TESTS (Professional Zone)
├─ Automated verification (fast)
├─ Catch bugs immediately (cheap fix)
├─ Refactor with confidence (safe)
├─ Clear failure messages (quick debug)
└─ Confidence: 95%

ROI: First tests cost time, but pay dividends constantly
```

### Test-Driven Development (TDD)

```
Traditional Approach (❌ Risky)
Code ──→ Manual Test ──→ Deploy ──→ Users Find Bugs

TDD Approach (✅ Safe)
Test (fails) ──→ Code ──→ Test (passes) ──→ Deploy

Benefits of TDD:
✓ Forces good design (testable code)
✓ Catches bugs immediately
✓ Documents expected behavior (test = specification)
✓ Enables safe refactoring
✓ Reduces debugging time

For this project, we apply TDD principles to new features
```

---

## 📊 Test Pyramid

### The Testing Hierarchy

```
                    ▲
                   ╱│╲
                  ╱ │ ╲        E2E Tests (5-10%)
                 ╱  │  ╲       ├─ Full app workflows
                ╱   │   ╲      ├─ Complex user journeys
               ╱ E2E│    ╲     ├─ Slow, brittle
              ╱─────┼─────╲    └─ Most valuable
             ╱      │      ╲
            ╱       │       ╲   Integration Tests (30-40%)
           ╱        │        ╲  ├─ Component + service interaction
          ╱         │         ╲ ├─ Medium speed
         ╱          │          ╲├─ Good reliability
        ╱  INT      │     INT   ╲└─ Real behavior
       ╱───────────┼────────────╲
      ╱            │             ╲
     ╱             │              ╲ Unit Tests (50-60%)
    ╱   UNIT       │       UNIT    ╲ ├─ Individual functions/components
   ╱───────────────┼────────────────╲├─ Fast
  ╱________________│_________________╲└─ Isolated
                   │
```

### Which Test to Write?

```
Question 1: Is it business logic?
├─ YES → Write a UNIT test
└─ NO → Is it UI interaction?
    ├─ YES → INTEGRATION test (controller + service)
    └─ NO → Is it a complex user flow?
        ├─ YES → E2E test
        └─ NO → Maybe not worth testing

GUIDELINE:
├─ Unit tests: 60% of code
├─ Integration tests: 30% of code
├─ E2E tests: 10% of code
├─ Never test: Trivial getters, framework code
└─ Always test: Business logic, calculations, decision trees
```

---

## 🧪 AngularJS Testing Fundamentals

### Required Testing Tools

```
JASMINE (Test Framework)
├─ Write: describe(), it() blocks
├─ Assert: expect() with matchers
├─ Mock: spyOn(), jasmine.createSpy()
└─ async: done(), $timeout.flush()

KARMA (Test Runner)
├─ Run: npm test
├─ Watch: Auto-run on file change
├─ Browsers: Chrome, Firefox, PhantomJS
└─ Reports: LCOV coverage, JUnit reports

MOCKING
├─ $httpBackend: Mock HTTP calls
├─ $q: Create resolved/rejected promises
├─ $timeout: Control async execution
├─ jasmine.createSpy(): Mock functions
└─ $rootScope: Control digest cycles

ANGULARJS TESTING UTILITIES
├─ angular.mock.inject(): Inject dependencies
├─ module(): Load AngularJS modules
├─ beforeEach(module('app')): Setup
└─ $httpBackend.expectGET(): Assert HTTP calls
```

### Test Setup Pattern

```typescript
// Standard AngularJS test setup

describe('ProjectListController', function() {
  let $controller, $scope, $httpBackend, ProjectService;
  
  // Load module before each test
  beforeEach(module('gleniganApp'));
  
  // Inject dependencies before each test
  beforeEach(inject(function(_$controller_, $rootScope, _$httpBackend_, _ProjectService_) {
    $controller = _$controller_;
    $scope = $rootScope.$new();
    $httpBackend = _$httpBackend_;
    ProjectService = _ProjectService_;
  }));
  
  // Clean up after each test
  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });
  
  it('should create', function() {
    // Arrange
    const controller = $controller('ProjectListController', { $scope });
    
    // Act (nothing in this case)
    
    // Assert
    expect(controller).toBeDefined();
  });
});
```

---

## 🧩 Unit Testing

### Testing Services

```typescript
describe('ProjectService', function() {
  let ProjectService, $httpBackend;
  
  beforeEach(module('gleniganApp'));
  
  beforeEach(inject(function(_ProjectService_, _$httpBackend_) {
    ProjectService = _ProjectService_;
    $httpBackend = _$httpBackend_;
  }));
  
  // Test: getProjects makes HTTP call
  describe('getProjects', function() {
    it('should fetch projects with pagination params', function(done) {
      // Arrange
      const params = { page: 1, per_page: 10 };
      const mockResponse = {
        success: true,
        data: {
          projects: [{ project_id: 1, project_name: 'Project A' }],
          pagination: { current_page: 1, total_pages: 5 }
        }
      };
      
      // Mock the HTTP GET
      $httpBackend
        .expectGET('/api/projects?page=1&per_page=10')
        .respond(mockResponse);
      
      // Act
      ProjectService.getProjects(params).then(function(result) {
        // Assert
        expect(result.projects).toBeDefined();
        expect(result.projects.length).toBe(1);
        expect(result.projects[0].project_name).toBe('Project A');
        done();
      });
      
      // Trigger the HTTP request
      $httpBackend.flush();
    });
    
    // Test: error handling
    it('should handle errors gracefully', function(done) {
      $httpBackend
        .expectGET('/api/projects?page=1&per_page=10')
        .respond(500, { error: 'Server error' });
      
      ProjectService.getProjects({ page: 1, per_page: 10 })
        .then(function() {
          // Should not reach success
          expect(true).toBe(false);
        })
        .catch(function(error) {
          expect(error).toBeDefined();
          done();
        });
      
      $httpBackend.flush();
    });
  });
  
  // Test: getAreas with caching
  describe('getAreas', function() {
    it('should cache results', function(done) {
      const mockAreas = ['North', 'South', 'East', 'West'];
      
      // First call
      $httpBackend.expectGET('/api/areas').respond({ data: mockAreas });
      ProjectService.getAreas().then(function(result) {
        expect(result).toEqual(mockAreas);
        
        // Second call should not make HTTP request (from cache)
        ProjectService.getAreas().then(function(cached) {
          expect(cached).toEqual(mockAreas);
          
          // Verify only one HTTP request was made
          expect($httpBackend.pendingRequests.length).toBe(0);
          done();
        });
      });
      
      $httpBackend.flush();
    });
  });
});

// Testing pattern: Arrange-Act-Assert

/*
ARRANGE: Set up test conditions
├─ Create mock data
├─ Set up dependencies
└─ Configure expectations

ACT: Execute the code being tested
├─ Call the function/method
├─ Wait for async operations
└─ Trigger side effects

ASSERT: Verify results
├─ Check return values
├─ Verify side effects
├─ Check error handling
└─ Verify interactions (spies)
*/
```

### Testing Controllers

```typescript
describe('ProjectListController', function() {
  let $controller, $scope, $httpBackend, ProjectService;
  
  beforeEach(module('gleniganApp'));
  
  beforeEach(inject(function(_$controller_, $rootScope, _$httpBackend_, _ProjectService_) {
    $controller = _$controller_;
    $scope = $rootScope.$new();
    $httpBackend = _$httpBackend_;
    ProjectService = _ProjectService_;
  }));
  
  // Test: Controller initializes with default values
  it('should initialize with default state', function() {
    const ctrl = $controller('ProjectListController', { $scope });
    
    expect($scope.projects).toBeDefined();
    expect($scope.projects.length).toBe(0);
    expect($scope.loading).toBe(false);
    expect($scope.error).toBeNull();
    expect($scope.filters).toBeDefined();
  });
  
  // Test: Loading projects
  it('should load projects on init', function() {
    const mockProjects = [
      { project_id: 1, project_name: 'Build Park', area: 'North' },
      { project_id: 2, project_name: 'Build Mall', area: 'South' }
    ];
    
    // Mock all HTTP calls
    $httpBackend.expectGET('/api/projects?page=1&per_page=10')
      .respond({ success: true, data: { projects: mockProjects } });
    $httpBackend.expectGET('/api/areas')
      .respond({ data: ['North', 'South'] });
    $httpBackend.expectGET('/api/companies')
      .respond({ data: ['Company A', 'Company B'] });
    
    const ctrl = $controller('ProjectListController', { $scope });
    $httpBackend.flush();
    
    expect($scope.projects).toEqual(mockProjects);
    expect($scope.projects.length).toBe(2);
  });
  
  // Test: Filtering changes page
  it('should reset to page 1 when filtering', function() {
    $scope.pagination = { current_page: 3 };
    
    const mockProjects = [];
    $httpBackend.expectGET('/api/projects?page=1&per_page=10&keyword=test')
      .respond({ success: true, data: { projects: mockProjects } });
    
    $scope.filters = { keyword: 'test' };
    $scope.applyFilters();
    
    $httpBackend.flush();
    
    expect($scope.pagination.current_page).toBe(1);
  });
  
  // Test: Error handling
  it('should display error when request fails', function() {
    $httpBackend.expectGET(/.*/)
      .respond(500, { error: 'Server error' });
    
    const ctrl = $controller('ProjectListController', { $scope });
    $httpBackend.flush();
    
    expect($scope.error).toBeDefined();
    expect($scope.projects).toEqual([]);
  });
  
  // Test: Pagination
  it('should calculate page range correctly', function() {
    $scope.pagination = { current_page: 3, total_pages: 10 };
    
    $scope.calculatePageRange();
    
    // Should show 5-page range centered on current page
    expect($scope.pageRange).toContain(1);
    expect($scope.pageRange).toContain(5);
  });
});
```

### Testing Filters (if using)

```typescript
describe('Filters', function() {
  let $filter;
  
  beforeEach(module('gleniganApp'));
  
  beforeEach(inject(function(_$filter_) {
    $filter = _$filter_;
  }));
  
  // Example: Test a custom currency filter
  it('should format currency correctly', function() {
    const currencyFilter = $filter('currency');
    
    expect(currencyFilter(1000)).toBe('$1,000.00');
    expect(currencyFilter(50)).toBe('$50.00');
    expect(currencyFilter(0)).toBe('$0.00');
  });
});
```

---

## 🔗 Integration Testing

### Testing Component + Service Interaction

```typescript
describe('ProjectList Integration', function() {
  let $controller, $scope, $httpBackend, ProjectService;
  
  beforeEach(module('gleniganApp'));
  
  beforeEach(inject(function(_$controller_, $rootScope, _$httpBackend_, _ProjectService_) {
    $controller = _$controller_;
    $scope = $rootScope.$new();
    $httpBackend = _$httpBackend_;
    ProjectService = _ProjectService_;
  }));
  
  // Test: Full filter + load workflow
  it('should filter projects and update display', function() {
    // Initial load
    const allProjects = [
      { project_id: 1, project_name: 'North Tower', area: 'North' },
      { project_id: 2, project_name: 'South Mall', area: 'South' },
      { project_id: 3, project_name: 'North Park', area: 'North' }
    ];
    
    // Setup mocks
    $httpBackend.expectGET('/api/projects?page=1&per_page=10')
      .respond({ success: true, data: { projects: allProjects } });
    $httpBackend.expectGET('/api/areas')
      .respond({ data: ['North', 'South'] });
    $httpBackend.expectGET('/api/companies')
      .respond({ data: [] });
    
    // Initialize controller
    const ctrl = $controller('ProjectListController', { $scope });
    $httpBackend.flush();
    
    // Verify initial load
    expect($scope.projects.length).toBe(3);
    expect($scope.areas).toContain('North');
    
    // Apply filter
    $scope.filters.area = 'North';
    
    const filtered = [
      { project_id: 1, project_name: 'North Tower', area: 'North' },
      { project_id: 3, project_name: 'North Park', area: 'North' }
    ];
    
    $httpBackend.expectGET('/api/projects?page=1&per_page=10&area=North')
      .respond({ success: true, data: { projects: filtered } });
    
    $scope.applyFilters();
    $httpBackend.flush();
    
    // Verify filtered results
    expect($scope.projects.length).toBe(2);
    expect($scope.projects.every(p => p.area === 'North')).toBe(true);
  });
  
  // Test: Search with debounce (if implemented)
  it('should debounce search input', function() {
    $httpBackend.expectGET(/.*/)
      .respond({ success: true, data: { projects: [] } });
    
    const ctrl = $controller('ProjectListController', { $scope });
    $httpBackend.flush();
    
    // Simulate rapid search input
    $scope.search('a');
    $scope.search('ab');
    $scope.search('abc');
    
    // Only last search should trigger HTTP call
    // (This depends on debounce implementation)
    expect($httpBackend.pendingRequests.length).toBeLessThan(3);
  });
});
```

---

## 🌐 E2E Testing

### End-to-End Test Examples

```typescript
// Using Protractor (or modern Cypress)

describe('Project Listing E2E', function() {
  const browser = require('protractor').browser;
  
  // Test: User views project list
  it('should display projects when user loads page', function() {
    // Navigate
    browser.get('http://localhost:8000');
    
    // Wait for projects to load
    browser.wait(EC.presenceOf(element(by.css('.project-list'))), 5000);
    
    // Assertions
    const projects = element.all(by.css('.project-item'));
    expect(projects.count()).toBeGreaterThan(0);
  });
  
  // Test: User filters projects
  it('should filter projects by area', function() {
    browser.get('http://localhost:8000');
    browser.wait(EC.presenceOf(element(by.css('.project-list'))), 5000);
    
    // Get initial count
    const initialCount = element.all(by.css('.project-item')).count();
    
    // Select area filter
    const areaSelect = element(by.css('select[ng-model="filters.area"]'));
    areaSelect.click();
    element(by.css('option[value="North"]')).click();
    
    // Click filter button
    element(by.css('button[ng-click="applyFilters()"]')).click();
    
    // Wait for results
    browser.wait(EC.staleness(element(by.css('.loading'))), 5000);
    
    // Verify filtered results
    const filteredCount = element.all(by.css('.project-item')).count();
    expect(filteredCount).toBeLessThan(initialCount);
    
    // Verify area matches
    element.all(by.css('.project-area')).each(function(elem) {
      expect(elem.getText()).toContain('North');
    });
  });
  
  // Test: User navigates pages
  it('should paginate results', function() {
    browser.get('http://localhost:8000');
    browser.wait(EC.presenceOf(element(by.css('.pagination'))), 5000);
    
    // Click next page
    const nextButton = element(by.css('.pagination .next'));
    nextButton.click();
    
    // Wait for new results
    browser.wait(EC.urlContains('page=2'), 5000);
    
    // Verify URL updated
    expect(browser.getCurrentUrl()).toContain('page=2');
  });
  
  // Test: Error handling
  it('should display error message when API fails', function() {
    // This requires mocking API failure
    // In Protractor, you'd need to:
    // 1. Intercept HTTP requests
    // 2. Return error response
    // 3. Verify error message displayed
    
    browser.get('http://localhost:8000');
    // ... test error display
  });
});

/*
Modern Alternative: CYPRESS

// Cypress is more modern and reliable than Protractor

describe('Project List', () => {
  beforeEach(() => {
    cy.visit('http://localhost:8000');
  });
  
  it('should display projects', () => {
    cy.get('.project-list').should('be.visible');
    cy.get('.project-item').should('have.length.greaterThan', 0);
  });
  
  it('should filter by area', () => {
    cy.get('select[ng-model="filters.area"]').select('North');
    cy.get('button[ng-click="applyFilters()"]').click();
    cy.get('.project-item').should('have.length.lessThan', 5);
    cy.get('.project-area').each(($el) => {
      cy.wrap($el).should('contain', 'North');
    });
  });
});
*/
```

---

## ✅ Testing Best Practices

### Do's ✓

```typescript
// ✓ DO: Test behavior, not implementation
it('should filter projects by area', function() {
  $scope.filters.area = 'North';
  $scope.applyFilters();
  
  // We care about the behavior: projects are filtered
  expect($scope.projects.every(p => p.area === 'North')).toBe(true);
});

// ✗ DON'T: Test internal variables
it('should set internalFilterState', function() {
  // This is testing implementation, not behavior
  $scope.applyFilters();
  expect($scope.internalFilterState).toBe(true);  // Who cares?
});

// ✓ DO: Use descriptive test names
it('should display error message when API call fails', function() {});

// ✗ DON'T: Use vague test names
it('should handle error', function() {});

// ✓ DO: One assertion per test (or related assertions)
it('should load projects and areas', function() {
  $httpBackend.expectGET('/api/projects?page=1&per_page=10')
    .respond({ data: { projects: mockProjects } });
  $httpBackend.expectGET('/api/areas')
    .respond({ data: mockAreas });
  
  $controller('ProjectListController', { $scope });
  $httpBackend.flush();
  
  expect($scope.projects).toBeDefined();
  expect($scope.areas).toBeDefined();  // Related, acceptable
});

// ✗ DON'T: Multiple unrelated assertions
it('should do everything', function() {
  expect(value1).toBe(x);
  expect(value2).toBe(y);
  expect(value3).toBe(z);
  expect(unrelated).toBe(w);  // This fails? Now what?
});

// ✓ DO: Test edge cases
it('should handle empty results', function() {
  $httpBackend.expectGET(/.*/).respond({ data: { projects: [] } });
  $controller('ProjectListController', { $scope });
  $httpBackend.flush();
  
  expect($scope.projects).toEqual([]);
  expect($scope.noResults).toBe(true);
});

// ✓ DO: Mock external dependencies
it('should fetch projects from service', function() {
  spyOn(ProjectService, 'getProjects').and.returnValue($q.when(mockProjects));
  
  $controller('ProjectListController', { $scope });
  $scope.$digest();
  
  expect(ProjectService.getProjects).toHaveBeenCalled();
  expect($scope.projects).toEqual(mockProjects);
});

// ✓ DO: Test error paths
it('should handle network errors', function() {
  $httpBackend.expectGET(/.*/).respond(500);
  
  $controller('ProjectListController', { $scope });
  $httpBackend.flush();
  
  expect($scope.error).toBeDefined();
});
```

---

## ❌ Common Pitfalls

### Pitfall 1: Forgetting $httpBackend.flush()

```typescript
// ❌ WRONG: Test completes before HTTP response
it('should load projects', function() {
  $httpBackend.expectGET('/api/projects').respond([]);
  ProjectService.getProjects();
  expect($scope.projects).toBeDefined();  // FAILS: projects not set yet
});

// ✓ RIGHT: Flush HTTP queue
it('should load projects', function() {
  $httpBackend.expectGET('/api/projects').respond([]);
  ProjectService.getProjects();
  $httpBackend.flush();  // Execute pending HTTP
  expect($scope.projects).toBeDefined();  // PASSES
});
```

### Pitfall 2: Not cleaning up $httpBackend

```typescript
// ❌ WRONG: Leaves pending requests
describe('Tests', function() {
  it('test 1', function() {
    $httpBackend.expectGET('/api/x').respond([]);
    // Forgot to flush!
  });
  
  it('test 2', function() {
    // Previous request is still pending, causes noise
  });
});

// ✓ RIGHT: afterEach cleans up
afterEach(function() {
  $httpBackend.verifyNoOutstandingExpectation();  // Fails if expectations unmet
  $httpBackend.verifyNoOutstandingRequest();       // Fails if requests pending
});
```

### Pitfall 3: Async not properly handled

```typescript
// ❌ WRONG: Promise doesn't complete
it('should handle async', function() {
  let result;
  service.getAsync().then(function(data) {
    result = data;
  });
  expect(result).toBeDefined();  // FAILS: Promise hasn't resolved
});

// ✓ RIGHT: Done callback or $digest
it('should handle async', function(done) {
  service.getAsync().then(function(data) {
    expect(data).toBeDefined();
    done();  // Signal test completion
  });
});

// ✓ ALTERNATIVE: Digest cycle
it('should handle async', function() {
  $httpBackend.expectGET(/.*/).respond([]);
  service.getProjects();
  $httpBackend.flush();  // or $timeout.flush() or $rootScope.$digest()
  expect($scope.projects).toBeDefined();
});
```

### Pitfall 4: Brittle selectors in E2E

```typescript
// ❌ BRITTLE: Implementation detail
it('should click button', function() {
  element(by.css('div.container > div.row > button:nth-child(3)')).click();
});

// ✓ ROBUST: Semantic selector
it('should click button', function() {
  element(by.css('button[ng-click="applyFilters()"]')).click();
  // or
  element(by.buttonText('Filter')).click();
  // or
  element(by.id('apply-filter-btn')).click();
});
```

### Pitfall 5: Tests that are too slow

```typescript
// ❌ SLOW: Test takes 5 seconds
it('should load data', function() {
  // Makes 100 HTTP requests
  for (let i = 0; i < 100; i++) {
    $httpBackend.expectGET('/api/item/' + i).respond({});
  }
  // ...
  // Total test time: 5000ms
});

// ✓ FAST: Optimized
it('should load data', function() {
  // Only test relevant calls
  $httpBackend.expectGET('/api/items?limit=100').respond({});
  // ...
  // Total test time: 10ms
});

// Remember: If tests are slow, developers skip them
```

---

## 📊 Coverage & Metrics

### Code Coverage Goals

```
MINIMUM COVERAGE TARGETS
├─ Statements: 80%
├─ Branches: 75%
├─ Functions: 80%
├─ Lines: 80%
└─ Critical paths: 100%

COVERAGE BY COMPONENT TYPE
├─ Services: 90%+ (business logic)
├─ Controllers: 80%+ (user interaction)
├─ Filters: 90%+ (pure functions)
├─ Directives: 70%+ (template testing harder)
└─ Config: 50%+ (simple setup)

HOW TO CHECK COVERAGE

# Generate coverage report
npm test -- --coverage

# Open HTML report
open coverage/index.html

# Check coverage thresholds
npm test -- --check-coverage --coverage-threshold '{
  "lines": 80,
  "branches": 75,
  "functions": 80,
  "statements": 80
}'
```

### Interpreting Coverage Reports

```
GOOD COVERAGE (90%): "We catch most bugs early"
├─ Confidence: High
├─ Team trust: High
├─ Refactoring: Safe

MEDIUM COVERAGE (70%): "We catch some bugs early"
├─ Confidence: Medium
├─ Team trust: Medium
├─ Refactoring: Risky

LOW COVERAGE (30%): "We rely on manual testing"
├─ Confidence: Low
├─ Team trust: Low
├─ Refactoring: Very risky

What coverage doesn't measure:
├─ Test quality (coverage ≠ good tests)
├─ Integration issues
├─ Performance problems
├─ User experience
└─ Real-world edge cases

Ideal: 80%+ coverage + high-quality tests + manual testing
```

---

## ⚡ Performance Testing

### Frontend Performance Testing

```typescript
// Using Lighthouse CI or WebPageTest

describe('Performance', function() {
  it('should load in under 2 seconds', function(done) {
    const startTime = performance.now();
    
    browser.get('http://localhost:8000');
    browser.wait(EC.presenceOf(element(by.css('.project-list'))), 5000);
    
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    
    expect(loadTime).toBeLessThan(2000);  // 2 seconds
    done();
  });
  
  it('should not freeze while scrolling', function() {
    // Test for jank (dropped frames)
    browser.get('http://localhost:8000');
    
    // Simulate scroll
    browser.executeScript('window.scrollBy(0, window.innerHeight);');
    browser.executeScript('window.scrollBy(0, window.innerHeight);');
    
    // Check metrics (would need performance API)
    const metrics = browser.executeScript('return window.performance.timing');
    
    // Verify smooth scrolling (no 60ms+ frames)
  });
});

// CSS Performance Testing
describe('CSS Performance', function() {
  it('should not cause excessive repaints', function() {
    // Monitor paint/composite timing
    const before = performance.now();
    
    // Trigger state change
    $scope.filters.area = 'North';
    $scope.$digest();
    
    const after = performance.now();
    
    expect(after - before).toBeLessThan(16);  // 16ms = 60fps frame time
  });
});

// Bundle Size Testing
describe('Bundle Size', function() {
  it('should keep bundle under 100KB', function() {
    const bundleSize = fs.statSync('dist/app.bundle.js').size / 1024;
    expect(bundleSize).toBeLessThan(100);
  });
});
```

---

## 🎓 Testing Checklist

### Before Committing Code

- [ ] Unit tests for all functions
- [ ] Integration tests for workflows
- [ ] Edge case tests (empty, null, large data)
- [ ] Error path tests
- [ ] Coverage is 80%+
- [ ] All tests pass locally
- [ ] No console errors in tests
- [ ] No $httpBackend warnings
- [ ] Tests run in < 10 seconds
- [ ] Descriptive test names

### Before Deploying

- [ ] All tests pass in CI/CD
- [ ] Coverage not decreased
- [ ] E2E tests pass
- [ ] Performance metrics acceptable
- [ ] No new test warnings
- [ ] Code review approved
- [ ] Manual testing complete

---

## 📚 Testing Tools & Setup

### Karma Configuration

```javascript
// karma.conf.js
module.exports = function(config) {
  config.set({
    // Testing framework
    frameworks: ['jasmine'],
    
    // Files to test
    files: [
      'bower_components/angular/angular.js',
      'bower_components/angular-mocks/angular-mocks.js',
      'src/**/*.js',
      'test/**/*.spec.js'
    ],
    
    // Coverage
    coverageReporter: {
      type: 'lcov',
      dir: 'coverage/'
    },
    
    // Reporters
    reporters: ['spec', 'coverage'],
    
    // Run on save
    autoWatch: true,
    
    // Browsers to test
    browsers: ['Chrome'],
    
    // Single run for CI
    singleRun: false
  });
};
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "karma start",
    "test:ci": "karma start --single-run --coverage",
    "test:coverage": "karma start --coverage --single-run",
    "e2e": "protractor protractor.conf.js",
    "e2e:debug": "protractor protractor.conf.js --debug"
  }
}
```

---

## 📚 Related Documentation

- [FRONTEND_FUNDAMENTALS_INTERVIEW.md](FRONTEND_FUNDAMENTALS_INTERVIEW.md) - Frontend concepts
- [CRUD_DATAFLOW.md](CRUD_DATAFLOW.md) - Understanding data flow helps test design
- [ARCHITECTURE_OVERVIEW.md](ARCHITECTURE_OVERVIEW.md) - System architecture
