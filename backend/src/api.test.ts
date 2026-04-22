import express from 'express';
import request from 'supertest';
import * as path from 'path';

// Set database path for tests before importing modules
const testDbPath = path.join(__dirname, '..', 'glenigan_takehome FS.db');
process.env.DATABASE_PATH = testDbPath;

import { getDatabase, closeDatabase } from './database';
import { errorHandler, notFoundHandler, ApiException, ErrorCode } from './errors';
import { fetchProjects, getAllAreas, getAllCompanies, areaExists } from './projectService';
import { ProjectQueryParams, ApiResponse, Project } from './types';

// Create a test app with the same routes as the main app
function createTestApp() {
  const app = express();
  app.use(express.json());

  // Health check
  app.get('/health', async (_req, res) => {
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  });

  // Areas endpoint
  app.get('/api/areas', async (_req, res, next) => {
    try {
      const areas = await getAllAreas();
      res.json({ success: true, data: areas });
    } catch (error) {
      next(error);
    }
  });

  // Companies endpoint
  app.get('/api/companies', async (_req, res, next) => {
    try {
      const companies = await getAllCompanies();
      res.json({ success: true, data: companies });
    } catch (error) {
      next(error);
    }
  });

  // Projects endpoint
  app.get('/api/projects', async (req: express.Request<{}, {}, {}, ProjectQueryParams>, res, next) => {
    try {
      const { area, keyword, page, per_page } = req.query;

      let pageNum: number | undefined;
      let perPageNum: number | undefined;

      if (page !== undefined || per_page !== undefined) {
        if (page !== undefined) {
          pageNum = parseInt(page, 10);
          if (isNaN(pageNum) || pageNum < 1) {
            throw new ApiException(
              400,
              ErrorCode.INVALID_PAGINATION,
              'Invalid page parameter',
              'Page must be a positive integer (1-based)'
            );
          }
        }

        if (per_page !== undefined) {
          perPageNum = parseInt(per_page, 10);
          if (isNaN(perPageNum) || perPageNum < 1 || perPageNum > 100) {
            throw new ApiException(
              400,
              ErrorCode.INVALID_PAGINATION,
              'Invalid per_page parameter',
              'per_page must be a positive integer between 1 and 100'
            );
          }
        }

        pageNum = pageNum ?? 1;
        perPageNum = perPageNum ?? 20;
      }

      if (area) {
        const exists = await areaExists(area);
        if (!exists) {
          throw new ApiException(
            404,
            ErrorCode.AREA_NOT_FOUND,
            'Area not found',
            `No area found matching '${area}'. Use GET /api/areas to see available areas.`
          );
        }
      }

      const result = await fetchProjects({
        area,
        keyword,
        page: pageNum,
        perPage: perPageNum
      });

      const response: ApiResponse<Project[]> = {
        success: true,
        data: result.projects,
        pagination: result.pagination
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  });

  // Error handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

describe('API Endpoints', () => {
  let app: express.Application;

  beforeAll(async () => {
    await getDatabase();
    app = createTestApp();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('GET /health', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/health');
      
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(response.body.database).toBe('connected');
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('GET /api/areas', () => {
    it('should return list of areas', async () => {
      const response = await request(app).get('/api/areas');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should include expected areas', async () => {
      const response = await request(app).get('/api/areas');
      
      expect(response.body.data).toContain('London');
      expect(response.body.data).toContain('Birmingham');
    });
  });

  describe('GET /api/companies', () => {
    it('should return list of companies', async () => {
      const response = await request(app).get('/api/companies');
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should return companies with expected structure', async () => {
      const response = await request(app).get('/api/companies');
      
      response.body.data.forEach((company: any) => {
        expect(company).toHaveProperty('company_id');
        expect(company).toHaveProperty('company_name');
      });
    });
  });

  describe('GET /api/projects', () => {
    describe('without pagination', () => {
      it('should return projects', async () => {
        const response = await request(app).get('/api/projects');
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });

    describe('with pagination', () => {
      it('should return paginated results', async () => {
        const response = await request(app)
          .get('/api/projects')
          .query({ page: 1, per_page: 10 });
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.length).toBeLessThanOrEqual(10);
        expect(response.body.pagination).toBeDefined();
        expect(response.body.pagination.current_page).toBe(1);
        expect(response.body.pagination.per_page).toBe(10);
      });

      it('should return 400 for invalid page', async () => {
        const response = await request(app)
          .get('/api/projects')
          .query({ page: -1, per_page: 10 });
        
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INVALID_PAGINATION');
      });

      it('should return 400 for invalid per_page', async () => {
        const response = await request(app)
          .get('/api/projects')
          .query({ page: 1, per_page: 101 });
        
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INVALID_PAGINATION');
      });

      it('should return 400 for non-numeric page', async () => {
        const response = await request(app)
          .get('/api/projects')
          .query({ page: 'abc', per_page: 10 });
        
        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
      });
    });

    describe('with area filter', () => {
      it('should filter by valid area', async () => {
        const response = await request(app)
          .get('/api/projects')
          .query({ area: 'London', page: 1, per_page: 10 });
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        response.body.data.forEach((project: any) => {
          expect(project.area).toBe('London');
        });
      });

      it('should return 404 for invalid area', async () => {
        const response = await request(app)
          .get('/api/projects')
          .query({ area: 'InvalidArea', page: 1, per_page: 10 });
        
        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('AREA_NOT_FOUND');
      });
    });

    describe('with keyword filter', () => {
      it('should filter by keyword', async () => {
        const response = await request(app)
          .get('/api/projects')
          .query({ keyword: 'Bridge', page: 1, per_page: 50 });
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        response.body.data.forEach((project: any) => {
          expect(project.project_name.toLowerCase()).toContain('bridge');
        });
      });
    });

    describe('with combined filters', () => {
      it('should filter by area and keyword', async () => {
        const response = await request(app)
          .get('/api/projects')
          .query({ area: 'London', keyword: 'Bridge', page: 1, per_page: 50 });
        
        expect(response.status).toBe(200);
        response.body.data.forEach((project: any) => {
          expect(project.area).toBe('London');
          expect(project.project_name.toLowerCase()).toContain('bridge');
        });
      });
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/api/unknown');
      
      expect(response.status).toBe(404);
    });
  });
});
