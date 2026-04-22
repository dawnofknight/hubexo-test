/**
 * Unit Tests for Glenigan Frontend - ProjectService
 */
describe('ProjectService', function() {
  var ProjectService, $httpBackend, $q;
  var API_BASE_URL = '/api';

  beforeEach(function() {
    // Set API_BASE_URL on window before module loads
    window.API_BASE_URL = '/api';
    
    // Load the module
    module('gleniganApp');
    
    // Inject dependencies
    inject(function(_$httpBackend_, _$q_, _ProjectService_) {
      $httpBackend = _$httpBackend_;
      $q = _$q_;
      ProjectService = _ProjectService_;
    });
  });

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  describe('getProjects', function() {
    it('should fetch projects without parameters', function() {
      var mockResponse = {
        success: true,
        data: [
          { project_name: 'Test Project 1', area: 'London', project_value: 1000000 },
          { project_name: 'Test Project 2', area: 'Birmingham', project_value: 2000000 }
        ],
        pagination: {
          current_page: 1,
          per_page: 20,
          total_items: 2,
          total_pages: 1,
          has_next: false,
          has_prev: false
        }
      };

      $httpBackend.expectGET(API_BASE_URL + '/projects').respond(200, mockResponse);

      var result;
      ProjectService.getProjects({}).then(function(response) {
        result = response;
      });

      $httpBackend.flush();

      expect(result).toBeDefined();
      expect(result.projects.length).toBe(2);
      expect(result.pagination.total_items).toBe(2);
    });

    it('should fetch projects with area filter', function() {
      var mockResponse = {
        success: true,
        data: [
          { project_name: 'London Project', area: 'London', project_value: 1500000 }
        ],
        pagination: {
          current_page: 1,
          per_page: 20,
          total_items: 1,
          total_pages: 1,
          has_next: false,
          has_prev: false
        }
      };

      $httpBackend.expectGET(API_BASE_URL + '/projects?area=London').respond(200, mockResponse);

      var result;
      ProjectService.getProjects({ area: 'London' }).then(function(response) {
        result = response;
      });

      $httpBackend.flush();

      expect(result.projects.length).toBe(1);
      expect(result.projects[0].area).toBe('London');
    });

    it('should fetch projects with keyword filter', function() {
      var mockResponse = {
        success: true,
        data: [
          { project_name: 'Bridge Construction', area: 'London', project_value: 5000000 }
        ]
      };

      $httpBackend.expectGET(API_BASE_URL + '/projects?keyword=Bridge').respond(200, mockResponse);

      var result;
      ProjectService.getProjects({ keyword: 'Bridge' }).then(function(response) {
        result = response;
      });

      $httpBackend.flush();

      expect(result.projects.length).toBe(1);
      expect(result.projects[0].project_name).toContain('Bridge');
    });

    it('should fetch projects with pagination', function() {
      var mockResponse = {
        success: true,
        data: [
          { project_name: 'Project Page 2', area: 'Manchester', project_value: 3000000 }
        ],
        pagination: {
          current_page: 2,
          per_page: 10,
          total_items: 15,
          total_pages: 2,
          has_next: false,
          has_prev: true
        }
      };

      $httpBackend.expectGET(API_BASE_URL + '/projects?page=2&per_page=10').respond(200, mockResponse);

      var result;
      ProjectService.getProjects({ page: 2, per_page: 10 }).then(function(response) {
        result = response;
      });

      $httpBackend.flush();

      expect(result.pagination.current_page).toBe(2);
      expect(result.pagination.has_prev).toBe(true);
    });

    it('should handle API errors gracefully', function() {
      $httpBackend.expectGET(API_BASE_URL + '/projects').respond(500, {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Server error' }
      });

      var error;
      ProjectService.getProjects({}).catch(function(err) {
        error = err;
      });

      $httpBackend.flush();

      expect(error).toBeDefined();
    });
  });

  describe('getAreas', function() {
    it('should fetch all areas', function() {
      var mockResponse = {
        success: true,
        data: ['Birmingham', 'Bristol', 'Cardiff', 'London', 'Manchester']
      };

      $httpBackend.expectGET(API_BASE_URL + '/areas').respond(200, mockResponse);

      var result;
      ProjectService.getAreas().then(function(areas) {
        result = areas;
      });

      $httpBackend.flush();

      expect(result.length).toBe(5);
      expect(result).toContain('London');
      expect(result).toContain('Birmingham');
    });

    it('should handle errors when fetching areas', function() {
      $httpBackend.expectGET(API_BASE_URL + '/areas').respond(500, {
        success: false,
        error: { message: 'Server error' }
      });

      var error;
      ProjectService.getAreas().catch(function(err) {
        error = err;
      });

      $httpBackend.flush();

      expect(error).toBeDefined();
    });
  });

  describe('getCompanies', function() {
    it('should fetch all companies', function() {
      var mockResponse = {
        success: true,
        data: [
          { company_id: '1', company_name: 'ABC Construction' },
          { company_id: '2', company_name: 'XYZ Builders' }
        ]
      };

      $httpBackend.expectGET(API_BASE_URL + '/companies').respond(200, mockResponse);

      var result;
      ProjectService.getCompanies().then(function(companies) {
        result = companies;
      });

      $httpBackend.flush();

      expect(result.length).toBe(2);
      expect(result[0].company_name).toBe('ABC Construction');
    });
  });
});
