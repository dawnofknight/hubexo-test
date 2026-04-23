import { Project } from '../entities';

/**
 * Query parameters for fetching projects
 */
export interface ProjectQueryParams {
  area?: string;
  keyword?: string;
  company?: string;
  page?: number;
  perPage?: number;
}

/**
 * Result of paginated project query
 */
export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    currentPage: number;
    perPage: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null;
}

/**
 * Project Repository Interface
 * Defines contract for project data access (Dependency Inversion)
 */
export interface IProjectRepository {
  /**
   * Find projects with optional filtering and pagination
   */
  findAll(params: ProjectQueryParams): Promise<PaginatedResult<Project>>;
  
  /**
   * Find a project by its ID
   */
  findById(projectId: string): Promise<Project[] | null>;
}
