/// <reference types="angular" />
/// <reference path="../types.ts" />
/// <reference path="../config/api.config.ts" />

/**
 * Project Service
 * Handles all API communication for projects, areas, and companies
 */
angular.module('gleniganApp').factory('ProjectService', [
  '$http',
  '$q',
  function($http: ng.IHttpService, $q: ng.IQService): IProjectService {

    function getProjects(params: IProjectQueryParams): ng.IPromise<IProjectsResult> {
      const queryParams: Record<string, string | number> = {};

      if (params.area) queryParams.area = params.area;
      if (params.keyword) queryParams.keyword = params.keyword;
      if (params.company) queryParams.company = params.company;
      if (params.page) queryParams.page = params.page;
      if (params.per_page) queryParams.per_page = params.per_page;

      return $http.get<IApiResponse<IProject[]>>(API_ENDPOINTS.PROJECTS, { params: queryParams })
        .then(function(response) {
          const apiResponse = response.data;
          return {
            projects: apiResponse.data,
            pagination: apiResponse.pagination || null
          };
        })
        .catch(function(error) {
          console.error('Error fetching projects:', error);
          return $q.reject(error);
        });
    }

    function getAreas(): ng.IPromise<string[]> {
      return $http.get<IApiResponse<string[]>>(API_ENDPOINTS.AREAS)
        .then(function(response) {
          return response.data.data;
        })
        .catch(function(error) {
          console.error('Error fetching areas:', error);
          return $q.reject(error);
        });
    }

    function getCompanies(): ng.IPromise<ICompany[]> {
      return $http.get<IApiResponse<ICompany[]>>(API_ENDPOINTS.COMPANIES)
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
  }
]);
