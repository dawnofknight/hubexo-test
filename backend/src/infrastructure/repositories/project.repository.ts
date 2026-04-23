import { IProjectRepository, ProjectQueryParams, PaginatedResult } from '../../domain/repositories';
import { Project, createProject } from '../../domain/entities';
import { databaseConnection, queryAll, queryOne } from '../database';

/**
 * Raw project row from database
 */
interface ProjectRow {
  project_id?: string;
  project_name: string;
  project_start: string;
  project_end: string;
  company_name: string;
  description: string | null;
  project_value: number;
  area: string;
}

/**
 * SQLite implementation of Project Repository
 * Implements IProjectRepository (Liskov Substitution)
 */
export class ProjectRepository implements IProjectRepository {
  
  async findAll(params: ProjectQueryParams): Promise<PaginatedResult<Project>> {
    const db = await databaseConnection.getConnection();
    const { area, keyword, company, page, perPage } = params;

    // Build base query
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

    if (area) {
      conditions.push('pam.area = ?');
      queryParams.push(area);
    }

    if (keyword) {
      conditions.push('p.project_name LIKE ?');
      queryParams.push(`%${keyword}%`);
    }

    if (company) {
      conditions.push('c.company_name = ?');
      queryParams.push(company);
    }

    if (conditions.length > 0) {
      baseQuery += ' WHERE ' + conditions.join(' AND ');
    }

    baseQuery += ' ORDER BY p.project_name ASC, pam.area ASC';

    // Handle pagination
    if (page !== undefined && perPage !== undefined) {
      const countQuery = `
        SELECT COUNT(*) as total FROM (
          SELECT DISTINCT p.project_id, pam.area
          FROM projects p
          INNER JOIN companies c ON p.company_id = c.company_id
          INNER JOIN project_area_map pam ON p.project_id = pam.project_id
          ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''}
        )
      `;

      const countResult = queryOne<{ total: number }>(db, countQuery, queryParams);
      const totalItems = countResult?.total ?? 0;
      const totalPages = Math.ceil(totalItems / perPage);
      const offset = (page - 1) * perPage;

      const paginatedQuery = baseQuery + ` LIMIT ? OFFSET ?`;
      const rows = queryAll<ProjectRow>(db, paginatedQuery, [...queryParams, perPage, offset]);

      return {
        items: rows.map(createProject),
        pagination: {
          currentPage: page,
          perPage,
          totalItems,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    }

    // No pagination
    const rows = queryAll<ProjectRow>(db, baseQuery, queryParams);
    return {
      items: rows.map(createProject),
      pagination: null
    };
  }

  async findById(projectId: string): Promise<Project[] | null> {
    const db = await databaseConnection.getConnection();
    
    const rows = queryAll<ProjectRow & { project_id: string }>(
      db,
      `SELECT
         p.project_id,
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
       WHERE p.project_id = ?
       ORDER BY pam.area ASC`,
      [projectId]
    );

    if (rows.length === 0) return null;

    return rows.map(createProject);
  }
}
