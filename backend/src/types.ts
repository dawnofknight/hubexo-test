/**
 * Project interface matching the API response format
 */
export interface Project {
  project_name: string;
  project_start: string;
  project_end: string;
  company: string;
  description: string | null;
  project_value: number;
  area: string;
}

/**
 * Query parameters for the projects endpoint
 */
export interface ProjectQueryParams {
  area?: string;
  keyword?: string;
  page?: string;
  per_page?: string;
}

/**
 * Pagination metadata for response
 */
export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

/**
 * Standard API response wrapper
 * pagination is null when no pagination was requested (fetch all mode)
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination: PaginationMeta | null;
}

/**
 * Error response structure
 */
export interface ApiError {
  success: boolean;
  error: {
    code: string;
    message: string;
    details?: string;
  };
}

/**
 * Raw project row from database query
 */
export interface ProjectRow {
  project_name: string;
  project_start: string;
  project_end: string;
  company_name: string;
  description: string | null;
  project_value: number;
  area: string;
}
