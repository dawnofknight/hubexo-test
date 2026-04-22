/// <reference types="angular" />
/// <reference path="types.ts" />

/**
 * Main AngularJS Application Module
 * Glenigan Construction Projects List
 */
const app = angular.module('gleniganApp', []);

// API Configuration
// In Docker: uses relative path (proxied by nginx)
// Local dev: set window.API_BASE_URL in index.html
const API_BASE_URL = (window as any).API_BASE_URL || '/api';

/**
 * Project Service - handles all API communication
 */
app.factory('ProjectService', ['$http', '$q', function($http: ng.IHttpService, $q: ng.IQService) {
  
  /**
   * Fetch projects with optional filters and pagination
   */
  function getProjects(params: {
    area?: string;
    keyword?: string;
    page?: number;
    per_page?: number;
  }): ng.IPromise<{ projects: IProject[]; pagination?: IPaginationMeta }> {
    const queryParams: any = {};
    
    if (params.area) queryParams.area = params.area;
    if (params.keyword) queryParams.keyword = params.keyword;
    if (params.page) queryParams.page = params.page;
    if (params.per_page) queryParams.per_page = params.per_page;
    
    return $http.get<IApiResponse<IProject[]> | IProject[]>(API_BASE_URL + '/projects', { params: queryParams })
      .then(function(response) {
        // Handle both paginated and non-paginated responses
        if (Array.isArray(response.data)) {
          // Non-paginated response - raw array
          return { projects: response.data };
        } else {
          // Paginated response - wrapped in ApiResponse
          const apiResponse = response.data as IApiResponse<IProject[]>;
          return {
            projects: apiResponse.data,
            pagination: apiResponse.pagination
          };
        }
      })
      .catch(function(error) {
        console.error('Error fetching projects:', error);
        return $q.reject(error);
      });
  }
  
  /**
   * Fetch all available areas
   */
  function getAreas(): ng.IPromise<string[]> {
    return $http.get<IApiResponse<string[]>>(API_BASE_URL + '/areas')
      .then(function(response) {
        return response.data.data;
      })
      .catch(function(error) {
        console.error('Error fetching areas:', error);
        return $q.reject(error);
      });
  }
  
  /**
   * Fetch all companies
   */
  function getCompanies(): ng.IPromise<ICompany[]> {
    return $http.get<IApiResponse<ICompany[]>>(API_BASE_URL + '/companies')
      .then(function(response) {
        return response.data.data;
      })
      .catch(function(error) {
        console.error('Error fetching companies:', error);
        return $q.reject(error);
      });
  }
  
  return {
    getProjects: getProjects,
    getAreas: getAreas,
    getCompanies: getCompanies
  };
}]);

/**
 * Project List Controller
 */
app.controller('ProjectListController', [
  '$scope', 
  'ProjectService', 
  function($scope: ng.IScope & any, ProjectService: any) {
    
    // State
    $scope.projects = [] as IProject[];
    $scope.areas = [] as string[];
    $scope.companies = [] as ICompany[];
    $scope.loading = false;
    $scope.error = null as string | null;
    
    // Filters
    $scope.filters = {
      keyword: '',
      area: '',
      company: ''
    } as IFilterState;
    
    // Pagination
    $scope.pagination = {
      currentPage: 1,
      perPage: 20,
      totalItems: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false
    };
    
    // Per-page options
    $scope.perPageOptions = [10, 20, 50, 100];
    
    /**
     * Load projects based on current filters and pagination
     */
    $scope.loadProjects = function(): void {
      $scope.loading = true;
      $scope.error = null;
      
      const params: any = {
        page: $scope.pagination.currentPage,
        per_page: $scope.pagination.perPage
      };
      
      if ($scope.filters.area) {
        params.area = $scope.filters.area;
      }
      
      if ($scope.filters.keyword && $scope.filters.keyword.trim()) {
        params.keyword = $scope.filters.keyword.trim();
      }
      
      ProjectService.getProjects(params)
        .then(function(result: { projects: IProject[]; pagination?: IPaginationMeta }) {
          // Client-side company filtering (since backend doesn't have this filter)
          let filteredProjects = result.projects;
          if ($scope.filters.company) {
            filteredProjects = result.projects.filter(function(p: IProject) {
              return p.company === $scope.filters.company;
            });
          }
          
          $scope.projects = filteredProjects;
          
          if (result.pagination) {
            $scope.pagination.currentPage = result.pagination.current_page;
            $scope.pagination.perPage = result.pagination.per_page;
            $scope.pagination.totalItems = result.pagination.total_items;
            $scope.pagination.totalPages = result.pagination.total_pages;
            $scope.pagination.hasNext = result.pagination.has_next;
            $scope.pagination.hasPrev = result.pagination.has_prev;
          } else {
            // No pagination in response
            $scope.pagination.totalItems = filteredProjects.length;
            $scope.pagination.totalPages = 1;
            $scope.pagination.hasNext = false;
            $scope.pagination.hasPrev = false;
          }
        })
        .catch(function(error: any) {
          console.error('Failed to load projects:', error);
          $scope.error = error.data?.error?.message || 'Failed to load projects. Please try again.';
          $scope.projects = [];
        })
        .finally(function() {
          $scope.loading = false;
        });
    };
    
    /**
     * Load filter options (areas and companies)
     */
    $scope.loadFilterOptions = function(): void {
      ProjectService.getAreas()
        .then(function(areas: string[]) {
          $scope.areas = areas;
        })
        .catch(function(error: any) {
          console.error('Failed to load areas:', error);
        });
      
      ProjectService.getCompanies()
        .then(function(companies: ICompany[]) {
          $scope.companies = companies;
        })
        .catch(function(error: any) {
          console.error('Failed to load companies:', error);
        });
    };
    
    /**
     * Apply filters - triggered on button click
     * Design choice: Using button click instead of instant filtering
     * to reduce API calls and provide better UX for users who type slowly
     */
    $scope.applyFilters = function(): void {
      $scope.pagination.currentPage = 1; // Reset to first page when filtering
      $scope.loadProjects();
    };
    
    /**
     * Clear all filters
     */
    $scope.clearFilters = function(): void {
      $scope.filters = {
        keyword: '',
        area: '',
        company: ''
      };
      $scope.pagination.currentPage = 1;
      $scope.loadProjects();
    };
    
    /**
     * Go to specific page
     */
    $scope.goToPage = function(page: number): void {
      if (page < 1 || page > $scope.pagination.totalPages) return;
      $scope.pagination.currentPage = page;
      $scope.loadProjects();
    };
    
    /**
     * Next page
     */
    $scope.nextPage = function(): void {
      if ($scope.pagination.hasNext) {
        $scope.goToPage($scope.pagination.currentPage + 1);
      }
    };
    
    /**
     * Previous page
     */
    $scope.prevPage = function(): void {
      if ($scope.pagination.hasPrev) {
        $scope.goToPage($scope.pagination.currentPage - 1);
      }
    };
    
    /**
     * Change items per page
     */
    $scope.changePerPage = function(): void {
      $scope.pagination.currentPage = 1;
      $scope.loadProjects();
    };
    
    /**
     * Format currency (GBP)
     */
    $scope.formatCurrency = function(value: number): string {
      return '£' + value.toLocaleString('en-GB');
    };
    
    /**
     * Format date for display
     */
    $scope.formatDate = function(dateStr: string): string {
      if (!dateStr) return '-';
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    };
    
    /**
     * Get array of page numbers for pagination display
     */
    $scope.getPageNumbers = function(): number[] {
      const pages: number[] = [];
      const total = $scope.pagination.totalPages;
      const current = $scope.pagination.currentPage;
      
      // Show up to 5 page numbers centered around current page
      let start = Math.max(1, current - 2);
      let end = Math.min(total, current + 2);
      
      // Adjust if we're near the beginning or end
      if (current <= 3) {
        end = Math.min(5, total);
      }
      if (current >= total - 2) {
        start = Math.max(1, total - 4);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      return pages;
    };
    
    // Initialize
    $scope.loadFilterOptions();
    $scope.loadProjects();
  }
]);
