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
