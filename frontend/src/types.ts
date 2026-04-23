/// <reference types="angular" />

/**
 * Project interface matching the API response
 */
interface IProject {
  project_name: string;
  project_start: string;
  project_end: string;
  company: string;
  description: string | null;
  project_value: number;
  area: string;
}

/**
 * Pagination metadata from API
 */
interface IPaginationMeta {
  current_page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

/**
 * API Response wrapper
 */
interface IApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: IPaginationMeta;
}

/**
 * Company interface
 */
interface ICompany {
  company_id: string;
  company_name: string;
}

/**
 * Filter state
 */
interface IFilterState {
  keyword: string;
  area: string;
  company: string;
}

/**
 * Pagination state
 */
interface IPaginationState {
  currentPage: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Query parameters for project API
 */
interface IProjectQueryParams {
  area?: string;
  keyword?: string;
  company?: string;
  page?: number;
  per_page?: number;
}

/**
 * Result from getProjects
 */
interface IProjectsResult {
  projects: IProject[];
  pagination: IPaginationMeta | null;
}

/**
 * Project Service interface
 */
interface IProjectService {
  getProjects(params: IProjectQueryParams): ng.IPromise<IProjectsResult>;
  getAreas(): ng.IPromise<string[]>;
  getCompanies(): ng.IPromise<ICompany[]>;
}

/**
 * Project List Controller Scope
 */
interface IProjectListScope extends ng.IScope {
  projects: IProject[];
  areas: string[];
  companies: ICompany[];
  loading: boolean;
  error: string | null;
  filters: IFilterState;
  pagination: IPaginationState;
  perPageOptions: number[];
  pageNumbers: number[];
  loadProjects: () => void;
  loadFilterOptions: () => void;
  applyFilters: () => void;
  clearFilters: () => void;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  changePerPage: () => void;
  formatCurrency: (value: number) => string;
  formatDate: (dateStr: string) => string;
}
