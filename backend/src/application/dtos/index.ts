/**
 * Project DTO for API responses
 * Transforms domain entities to API format
 */
export interface ProjectDTO {
  project_name: string;
  project_start: string;
  project_end: string;
  company: string;
  description: string | null;
  project_value: number;
  area: string;
}

/**
 * Project with ID DTO (for single project response)
 */
export interface ProjectWithIdDTO extends ProjectDTO {
  project_id: string;
}

/**
 * Company DTO for API responses
 */
export interface CompanyDTO {
  company_id: string;
  company_name: string;
}

/**
 * Pagination DTO for API responses
 */
export interface PaginationDTO {
  current_page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

/**
 * Generic API response wrapper
 */
export interface ApiResponseDTO<T> {
  success: boolean;
  data: T;
  pagination: PaginationDTO | null;
}

/**
 * Error response DTO
 */
export interface ApiErrorDTO {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string;
  };
}

/**
 * Query params for project search
 */
export interface GetProjectsQueryDTO {
  area?: string;
  keyword?: string;
  company?: string;
  page?: number;
  perPage?: number;
}
