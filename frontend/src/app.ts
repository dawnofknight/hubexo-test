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

  function getProjects(params: {
    area?: string;
    keyword?: string;
    company?: string;
    page?: number;
    per_page?: number;
  }): ng.IPromise<{ projects: IProject[]; pagination?: IPaginationMeta }> {
    const queryParams: any = {};

    if (params.area) queryParams.area = params.area;
    if (params.keyword) queryParams.keyword = params.keyword;
    if (params.company) queryParams.company = params.company;
    if (params.page) queryParams.page = params.page;
    if (params.per_page) queryParams.per_page = params.per_page;

    return $http.get<IApiResponse<IProject[]> | IProject[]>(API_BASE_URL + '/projects', { params: queryParams })
      .then(function(response) {
        if (Array.isArray(response.data)) {
          return { projects: response.data };
        } else {
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
  function($scope: IProjectListScope, ProjectService: any) {

    $scope.projects = [];
    $scope.areas = [];
    $scope.companies = [];
    $scope.loading = false;
    $scope.error = null;

    $scope.filters = { keyword: '', area: '', company: '' };

    $scope.pagination = {
      currentPage: 1,
      perPage: 20,
      totalItems: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false
    };

    $scope.perPageOptions = [10, 20, 50, 100];
    $scope.pageNumbers = [];

    /**
     * Recompute the bounded page-number window. Called when pagination state
     * changes rather than on every digest (which is what happens when a
     * template invokes a getter function inside ng-repeat).
     */
    function updatePageNumbers(): void {
      const pages: number[] = [];
      const total = $scope.pagination.totalPages;
      const current = $scope.pagination.currentPage;

      if (total <= 0) {
        $scope.pageNumbers = [];
        return;
      }

      let start = Math.max(1, current - 2);
      let end = Math.min(total, current + 2);
      if (current <= 3) end = Math.min(5, total);
      if (current >= total - 2) start = Math.max(1, total - 4);

      for (let i = start; i <= end; i++) pages.push(i);
      $scope.pageNumbers = pages;
    }

    $scope.loadProjects = function(): void {
      $scope.loading = true;
      $scope.error = null;

      const params: any = {
        page: $scope.pagination.currentPage,
        per_page: $scope.pagination.perPage
      };

      if ($scope.filters.area) params.area = $scope.filters.area;
      if ($scope.filters.keyword && $scope.filters.keyword.trim()) {
        params.keyword = $scope.filters.keyword.trim();
      }
      if ($scope.filters.company) params.company = $scope.filters.company;

      ProjectService.getProjects(params)
        .then(function(result: { projects: IProject[]; pagination?: IPaginationMeta }) {
          $scope.projects = result.projects;

          if (result.pagination) {
            $scope.pagination.currentPage = result.pagination.current_page;
            $scope.pagination.perPage = result.pagination.per_page;
            $scope.pagination.totalItems = result.pagination.total_items;
            $scope.pagination.totalPages = result.pagination.total_pages;
            $scope.pagination.hasNext = result.pagination.has_next;
            $scope.pagination.hasPrev = result.pagination.has_prev;
          } else {
            $scope.pagination.totalItems = result.projects.length;
            $scope.pagination.totalPages = 1;
            $scope.pagination.hasNext = false;
            $scope.pagination.hasPrev = false;
          }
          updatePageNumbers();
        })
        .catch(function(error: any) {
          console.error('Failed to load projects:', error);
          $scope.error = (error && error.data && error.data.error && error.data.error.message)
            || 'Failed to load projects. Please try again.';
          $scope.projects = [];
          updatePageNumbers();
        })
        .finally(function() {
          $scope.loading = false;
        });
    };

    $scope.loadFilterOptions = function(): void {
      ProjectService.getAreas()
        .then(function(areas: string[]) { $scope.areas = areas; })
        .catch(function(error: any) { console.error('Failed to load areas:', error); });

      ProjectService.getCompanies()
        .then(function(companies: ICompany[]) { $scope.companies = companies; })
        .catch(function(error: any) { console.error('Failed to load companies:', error); });
    };

    /**
     * Apply filters on button click (not instant) to reduce API calls and
     * give the user explicit control over when a search executes.
     */
    $scope.applyFilters = function(): void {
      $scope.pagination.currentPage = 1;
      $scope.loadProjects();
    };

    $scope.clearFilters = function(): void {
      $scope.filters = { keyword: '', area: '', company: '' };
      $scope.pagination.currentPage = 1;
      $scope.loadProjects();
    };

    $scope.goToPage = function(page: number): void {
      if (page < 1 || page > $scope.pagination.totalPages) return;
      $scope.pagination.currentPage = page;
      $scope.loadProjects();
    };

    $scope.nextPage = function(): void {
      if ($scope.pagination.hasNext) $scope.goToPage($scope.pagination.currentPage + 1);
    };

    $scope.prevPage = function(): void {
      if ($scope.pagination.hasPrev) $scope.goToPage($scope.pagination.currentPage - 1);
    };

    $scope.changePerPage = function(): void {
      $scope.pagination.currentPage = 1;
      $scope.loadProjects();
    };

    $scope.formatCurrency = function(value: number): string {
      return '£' + value.toLocaleString('en-GB');
    };

    $scope.formatDate = function(dateStr: string): string {
      if (!dateStr) return '-';
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    };

    $scope.loadFilterOptions();
    $scope.loadProjects();
  }
]);
