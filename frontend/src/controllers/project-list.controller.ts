/// <reference types="angular" />
/// <reference path="../types.ts" />

/**
 * Project List Controller
 * Manages the project listing view with filtering and pagination
 */
angular.module('gleniganApp').controller('ProjectListController', [
  '$scope',
  'ProjectService',
  function($scope: IProjectListScope, ProjectService: IProjectService) {

    // Initialize state
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

    // Private helper to update page number window
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

    // Load projects with current filters and pagination
    $scope.loadProjects = function(): void {
      $scope.loading = true;
      $scope.error = null;

      const params: IProjectQueryParams = {
        page: $scope.pagination.currentPage,
        per_page: $scope.pagination.perPage
      };

      if ($scope.filters.area) params.area = $scope.filters.area;
      if ($scope.filters.keyword?.trim()) params.keyword = $scope.filters.keyword.trim();
      if ($scope.filters.company) params.company = $scope.filters.company;

      ProjectService.getProjects(params)
        .then(function(result) {
          $scope.projects = result.projects;

          if (result.pagination) {
            $scope.pagination.currentPage = result.pagination.current_page;
            $scope.pagination.perPage = result.pagination.per_page;
            $scope.pagination.totalItems = result.pagination.total_items;
            $scope.pagination.totalPages = result.pagination.total_pages;
            $scope.pagination.hasNext = result.pagination.has_next;
            $scope.pagination.hasPrev = result.pagination.has_prev;
          } else {
            $scope.pagination.currentPage = 1;
            $scope.pagination.totalItems = result.projects.length;
            $scope.pagination.totalPages = 1;
            $scope.pagination.hasNext = false;
            $scope.pagination.hasPrev = false;
          }
          updatePageNumbers();
        })
        .catch(function(error) {
          console.error('Failed to load projects:', error);
          $scope.error = error?.data?.error?.message || 'Failed to load projects. Please try again.';
          $scope.projects = [];
          updatePageNumbers();
        })
        .finally(function() {
          $scope.loading = false;
        });
    };

    // Load filter dropdown options
    $scope.loadFilterOptions = function(): void {
      ProjectService.getAreas()
        .then(function(areas) { $scope.areas = areas; })
        .catch(function(error) { console.error('Failed to load areas:', error); });

      ProjectService.getCompanies()
        .then(function(companies) { $scope.companies = companies; })
        .catch(function(error) { console.error('Failed to load companies:', error); });
    };

    // Filter actions
    $scope.applyFilters = function(): void {
      $scope.pagination.currentPage = 1;
      $scope.loadProjects();
    };

    $scope.clearFilters = function(): void {
      $scope.filters = { keyword: '', area: '', company: '' };
      $scope.pagination.currentPage = 1;
      $scope.loadProjects();
    };

    // Pagination actions
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

    // Formatters
    $scope.formatCurrency = function(value: number): string {
      return '£' + value.toLocaleString('en-GB');
    };

    $scope.formatDate = function(dateStr: string): string {
      if (!dateStr) return '-';
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    };

    // Initialize
    $scope.loadFilterOptions();
    $scope.loadProjects();
  }
]);
