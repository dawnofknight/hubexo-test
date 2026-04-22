import { getDatabase, queryAll, queryOne } from './database';
import { Project, PaginationMeta } from './types';

/**
 * Raw project row from database query
 */
interface ProjectRow {
  project_name: string;
  project_start: string;
  project_end: string;
  company_name: string;
  description: string | null;
  project_value: number;
  area: string;
}

/**
 * Get all unique areas from the database
 */
export async function getAllAreas(): Promise<string[]> {
  const db = await getDatabase();
  const rows = queryAll<{ area: string }>(db, 'SELECT DISTINCT area FROM project_area_map ORDER BY area');
  return rows.map(r => r.area);
}

/**
 * Get all unique companies from the database
 */
export async function getAllCompanies(): Promise<{ company_id: string; company_name: string }[]> {
  const db = await getDatabase();
  return queryAll<{ company_id: string; company_name: string }>(
    db,
    'SELECT company_id, company_name FROM companies ORDER BY company_name'
  );
}

/**
 * Check if an area exists in the database
 */
export async function areaExists(area: string): Promise<boolean> {
  const db = await getDatabase();
  const result = queryOne<{ cnt: number }>(
    db,
    'SELECT 1 as cnt FROM project_area_map WHERE area = ? LIMIT 1',
    [area]
  );
  return result !== undefined;
}

/**
 * Query parameters for fetching projects
 */
interface FetchProjectsParams {
  area?: string;
  keyword?: string;
  page?: number;
  perPage?: number;
}

/**
 * Result of fetching projects
 */
interface FetchProjectsResult {
  projects: Project[];
  pagination?: PaginationMeta;
}

/**
 * Fetch projects from database with optional filtering and pagination
 */
export async function fetchProjects(params: FetchProjectsParams): Promise<FetchProjectsResult> {
  const db = await getDatabase();
  const { area, keyword, page, perPage } = params;

  // Build base query with JOINs
  // Note: A project can belong to multiple areas via project_area_map
  // When filtering by area, we return projects that match that area
  let baseQuery = `
    SELECT DISTINCT
      p.project_name,
      p.project_start,
      p.project_end,
      c.company_name,
      p.description,
      p.project_value,
      pam.area
    FROM projects p
    INNER JOIN companies c ON p.company_id = c.company_id
    INNER JOIN project_area_map pam ON p.project_id = pam.project_id
  `;

  const conditions: string[] = [];
  const queryParams: (string | number)[] = [];

  // Filter by area if provided
  if (area) {
    conditions.push('pam.area = ?');
    queryParams.push(area);
  }

  // Search by keyword in project name (case-insensitive)
  if (keyword) {
    conditions.push('p.project_name LIKE ?');
    queryParams.push(`%${keyword}%`);
  }

  // Append WHERE clause if we have conditions
  if (conditions.length > 0) {
    baseQuery += ' WHERE ' + conditions.join(' AND ');
  }

  // Add ordering - by project name for consistent results
  baseQuery += ' ORDER BY p.project_name ASC, pam.area ASC';

  // If pagination is provided, calculate totals and apply LIMIT/OFFSET
  if (page !== undefined && perPage !== undefined) {
    // Get total count first
    const countQuery = `
      SELECT COUNT(*) as total FROM (
        SELECT DISTINCT
          p.project_id,
          pam.area
        FROM projects p
        INNER JOIN project_area_map pam ON p.project_id = pam.project_id
        ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''}
      )
    `;
    
    const countResult = queryOne<{ total: number }>(db, countQuery, queryParams);
    const totalItems = countResult?.total ?? 0;
    const totalPages = Math.ceil(totalItems / perPage);
    const offset = (page - 1) * perPage;

    // Add pagination to query
    const paginatedQuery = baseQuery + ` LIMIT ? OFFSET ?`;
    const rows = queryAll<ProjectRow>(db, paginatedQuery, [...queryParams, perPage, offset]);

    const projects = mapRowsToProjects(rows);

    return {
      projects,
      pagination: {
        current_page: page,
        per_page: perPage,
        total_items: totalItems,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1
      }
    };
  }

  // No pagination - return all results
  const rows = queryAll<ProjectRow>(db, baseQuery, queryParams);
  const projects = mapRowsToProjects(rows);

  return { projects };
}

/**
 * Map database rows to Project interface
 */
function mapRowsToProjects(rows: ProjectRow[]): Project[] {
  return rows.map(row => ({
    project_name: row.project_name,
    project_start: row.project_start,
    project_end: row.project_end,
    company: row.company_name,
    description: row.description,
    project_value: row.project_value,
    area: row.area
  }));
}
