/**
 * Unit Tests for Glenigan Frontend - ProjectListController
 */
describe('ProjectListController', function() {
  var $controller, $scope, $q, $httpBackend, ProjectService;
  var API_BASE_URL = '/api';

  // Mock data
  var mockProjects = [
    {
      project_name: 'London Bridge Construction',
      project_start: '2024-01-01 00:00:00',
      project_end: '2025-06-30 00:00:00',
      company: 'ABC Construction',
      description: 'Major bridge project',
      project_value: 5000000,
      area: 'London'
    },
    {
      project_name: 'Manchester Hospital',
      project_start: '2024-03-15 00:00:00',
      project_end: '2026-12-31 00:00:00',
      company: 'XYZ Builders',
      description: 'Hospital construction',
      project_value: 10000000,
      area: 'Manchester'
    }
  ];

  var mockAreas = ['Birmingham', 'Bristol', 'London', 'Manchester', 'Newcastle'];
  
  var mockCompanies = [
    { company_id: '1', company_name: 'ABC Construction' },
    { company_id: '2', company_name: 'XYZ Builders' }
  ];

  var mockPagination = {
    current_page: 1,
    per_page: 20,
    total_items: 2,
    total_pages: 1,
    has_next: false,
    has_prev: false
  };

  beforeEach(function() {
    window.API_BASE_URL = '/api';
    module('gleniganApp');
    
    inject(function(_$controller_, $rootScope, _$q_, _$httpBackend_) {
      $controller = _$controller_;
      $scope = $rootScope.$new();
      $q = _$q_;
      $httpBackend = _$httpBackend_;
    });
  });

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  function createController() {
    // Set up default HTTP expectations for initialization
    $httpBackend.expectGET(API_BASE_URL + '/areas').respond(200, {
      success: true,
      data: mockAreas
    });
    $httpBackend.expectGET(API_BASE_URL + '/companies').respond(200, {
      success: true,
      data: mockCompanies
    });
    $httpBackend.expectGET(API_BASE_URL + '/projects?page=1&per_page=20').respond(200, {
      success: true,
      data: mockProjects,
      pagination: mockPagination
    });

    var controller = $controller('ProjectListController', { $scope: $scope });
    $httpBackend.flush();
    
    return controller;
  }

  describe('initialization', function() {
    it('should initialize with empty state', function() {
      createController();
      
      expect($scope.projects).toBeDefined();
      expect($scope.areas).toBeDefined();
      expect($scope.companies).toBeDefined();
    });

    it('should load areas on init', function() {
      createController();
      
      expect($scope.areas.length).toBe(5);
      expect($scope.areas).toContain('London');
    });

    it('should load companies on init', function() {
      createController();
      
      expect($scope.companies.length).toBe(2);
    });

    it('should load projects on init', function() {
      createController();
      
      expect($scope.projects.length).toBe(2);
    });

    it('should initialize pagination with defaults', function() {
      createController();
      
      expect($scope.pagination.currentPage).toBe(1);
      expect($scope.pagination.perPage).toBe(20);
    });

    it('should initialize filters as empty', function() {
      createController();
      
      expect($scope.filters.keyword).toBe('');
      expect($scope.filters.area).toBe('');
    });
  });

  describe('loadProjects', function() {
    it('should set loading to true while fetching', function() {
      createController();
      
      $httpBackend.expectGET(API_BASE_URL + '/projects?page=1&per_page=20').respond(200, {
        success: true,
        data: mockProjects,
        pagination: mockPagination
      });
      
      $scope.loadProjects();
      expect($scope.loading).toBe(true);
      
      $httpBackend.flush();
      expect($scope.loading).toBe(false);
    });

    it('should clear error on load', function() {
      createController();
      $scope.error = 'Previous error';
      
      $httpBackend.expectGET(API_BASE_URL + '/projects?page=1&per_page=20').respond(200, {
        success: true,
        data: mockProjects,
        pagination: mockPagination
      });
      
      $scope.loadProjects();
      expect($scope.error).toBeNull();
      
      $httpBackend.flush();
    });

    it('should apply area filter', function() {
      createController();
      $scope.filters.area = 'London';
      
      $httpBackend.expectGET(API_BASE_URL + '/projects?page=1&per_page=20&area=London').respond(200, {
        success: true,
        data: [mockProjects[0]],
        pagination: { ...mockPagination, total_items: 1 }
      });
      
      $scope.loadProjects();
      $httpBackend.flush();
      
      expect($scope.projects.length).toBe(1);
    });

    it('should apply keyword filter', function() {
      createController();
      $scope.filters.keyword = 'Bridge';
      
      $httpBackend.expectGET(API_BASE_URL + '/projects?page=1&per_page=20&keyword=Bridge').respond(200, {
        success: true,
        data: [mockProjects[0]],
        pagination: mockPagination
      });
      
      $scope.loadProjects();
      $httpBackend.flush();
    });

    it('should update pagination after load', function() {
      createController();
      
      var newPagination = {
        current_page: 2,
        per_page: 10,
        total_items: 100,
        total_pages: 10,
        has_next: true,
        has_prev: true
      };
      
      $scope.pagination.currentPage = 2;
      $scope.pagination.perPage = 10;
      
      $httpBackend.expectGET(API_BASE_URL + '/projects?page=2&per_page=10').respond(200, {
        success: true,
        data: mockProjects,
        pagination: newPagination
      });
      
      $scope.loadProjects();
      $httpBackend.flush();
      
      expect($scope.pagination.totalItems).toBe(100);
      expect($scope.pagination.totalPages).toBe(10);
    });
  });

  describe('pagination methods', function() {
    it('nextPage should increment page and reload when hasNext is true', function() {
      createController();
      
      // Set up pagination state that allows next
      $scope.pagination.hasNext = true;
      $scope.pagination.totalPages = 5;
      
      $httpBackend.expectGET(API_BASE_URL + '/projects?page=2&per_page=20').respond(200, {
        success: true,
        data: mockProjects,
        pagination: { ...mockPagination, current_page: 2, has_prev: true }
      });
      
      $scope.nextPage();
      
      $httpBackend.flush();
      expect($scope.pagination.currentPage).toBe(2);
    });

    it('nextPage should not increment when hasNext is false', function() {
      createController();
      $scope.pagination.hasNext = false;
      
      $scope.nextPage();
      // Should not make any request
      expect($scope.pagination.currentPage).toBe(1);
    });

    it('prevPage should decrement page and reload', function() {
      createController();
      $scope.pagination.currentPage = 2;
      $scope.pagination.hasPrev = true;
      $scope.pagination.totalPages = 5;
      
      $httpBackend.expectGET(API_BASE_URL + '/projects?page=1&per_page=20').respond(200, {
        success: true,
        data: mockProjects,
        pagination: mockPagination
      });
      
      $scope.prevPage();
      
      $httpBackend.flush();
      expect($scope.pagination.currentPage).toBe(1);
    });

    it('goToPage should set page and reload for valid page', function() {
      createController();
      $scope.pagination.totalPages = 10;
      
      $httpBackend.expectGET(API_BASE_URL + '/projects?page=5&per_page=20').respond(200, {
        success: true,
        data: mockProjects,
        pagination: { ...mockPagination, current_page: 5, total_pages: 10 }
      });
      
      $scope.goToPage(5);
      
      $httpBackend.flush();
      expect($scope.pagination.currentPage).toBe(5);
    });

    it('goToPage should not navigate to invalid page', function() {
      createController();
      $scope.pagination.totalPages = 5;
      
      $scope.goToPage(10); // Invalid - beyond totalPages
      expect($scope.pagination.currentPage).toBe(1); // Should stay at 1
      
      $scope.goToPage(0); // Invalid - less than 1
      expect($scope.pagination.currentPage).toBe(1); // Should stay at 1
    });

    it('changePerPage should reset to page 1 and reload', function() {
      createController();
      $scope.pagination.currentPage = 5;
      $scope.pagination.perPage = 50;
      
      $httpBackend.expectGET(API_BASE_URL + '/projects?page=1&per_page=50').respond(200, {
        success: true,
        data: mockProjects,
        pagination: { ...mockPagination, per_page: 50 }
      });
      
      $scope.changePerPage();
      expect($scope.pagination.currentPage).toBe(1);
      
      $httpBackend.flush();
    });
  });

  describe('filter methods', function() {
    it('applyFilters should reset to page 1 and reload', function() {
      createController();
      $scope.pagination.currentPage = 3;
      $scope.filters.area = 'Manchester';
      
      $httpBackend.expectGET(API_BASE_URL + '/projects?page=1&per_page=20&area=Manchester').respond(200, {
        success: true,
        data: [mockProjects[1]],
        pagination: mockPagination
      });
      
      $scope.applyFilters();
      expect($scope.pagination.currentPage).toBe(1);
      
      $httpBackend.flush();
    });

    it('clearFilters should reset all filters and reload', function() {
      createController();
      $scope.filters.area = 'London';
      $scope.filters.keyword = 'Bridge';
      $scope.pagination.currentPage = 3;
      
      $httpBackend.expectGET(API_BASE_URL + '/projects?page=1&per_page=20').respond(200, {
        success: true,
        data: mockProjects,
        pagination: mockPagination
      });
      
      $scope.clearFilters();
      
      expect($scope.filters.area).toBe('');
      expect($scope.filters.keyword).toBe('');
      expect($scope.pagination.currentPage).toBe(1);
      
      $httpBackend.flush();
    });
  });

  describe('helper methods', function() {
    it('formatCurrency should format numbers as GBP', function() {
      createController();
      
      var formatted = $scope.formatCurrency(1500000);
      expect(formatted).toContain('1,500,000');
      expect(formatted).toContain('£');
    });

    it('formatCurrency should handle zero', function() {
      createController();
      
      var formatted = $scope.formatCurrency(0);
      expect(formatted).toBe('£0');
    });

    it('formatDate should format date strings', function() {
      createController();
      
      var formatted = $scope.formatDate('2024-01-15 00:00:00');
      expect(formatted).toBeDefined();
      expect(typeof formatted).toBe('string');
      // Check it contains expected parts (month, day, year)
      expect(formatted).toContain('2024');
    });

    it('formatDate should handle empty string', function() {
      createController();
      
      expect($scope.formatDate('')).toBe('-');
    });

    it('getPageNumbers should return array of page numbers', function() {
      createController();
      $scope.pagination.totalPages = 10;
      $scope.pagination.currentPage = 5;
      
      var pages = $scope.getPageNumbers();
      
      expect(Array.isArray(pages)).toBe(true);
      expect(pages.length).toBeGreaterThan(0);
      expect(pages.length).toBeLessThanOrEqual(5);
    });

    it('getPageNumbers should center around current page', function() {
      createController();
      $scope.pagination.totalPages = 10;
      $scope.pagination.currentPage = 5;
      
      var pages = $scope.getPageNumbers();
      
      expect(pages).toContain(5);
      expect(pages).toContain(3);
      expect(pages).toContain(7);
    });

    it('getPageNumbers should handle first page', function() {
      createController();
      $scope.pagination.totalPages = 10;
      $scope.pagination.currentPage = 1;
      
      var pages = $scope.getPageNumbers();
      
      expect(pages[0]).toBe(1);
      expect(pages.length).toBeLessThanOrEqual(5);
    });
  });
});
