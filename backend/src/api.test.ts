import request from 'supertest';
import * as path from 'path';

// Set database path for tests before importing modules.
process.env.DB_PATH = path.join(__dirname, '..', 'glenigan_takehome FS.db');
process.env.NODE_ENV = 'test';

import { getDatabase, closeDatabase } from './database';
import app from './index';

describe('API Endpoints', () => {
  beforeAll(async () => {
    await getDatabase();
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

    it('should set a public cache-control header', async () => {
      const response = await request(app).get('/api/areas');
      expect(response.headers['cache-control']).toMatch(/public/);
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
      it('should return a raw array of projects', async () => {
        const response = await request(app).get('/api/projects');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
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

      it('should return 400 when per_page exceeds max', async () => {
        const response = await request(app)
          .get('/api/projects')
          .query({ page: 1, per_page: 10001 });

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
        response.body.data.forEach((project: any) => {
          expect(project.project_name.toLowerCase()).toContain('bridge');
        });
      });

      it('should reject overly long keywords', async () => {
        const response = await request(app)
          .get('/api/projects')
          .query({ keyword: 'x'.repeat(1000), page: 1, per_page: 10 });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('with company filter', () => {
      it('should filter by exact company name', async () => {
        const companiesResp = await request(app).get('/api/companies');
        const targetCompany = companiesResp.body.data[0].company_name;

        const response = await request(app)
          .get('/api/projects')
          .query({ company: targetCompany, page: 1, per_page: 50 });

        expect(response.status).toBe(200);
        response.body.data.forEach((project: any) => {
          expect(project.company).toBe(targetCompany);
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

  describe('GET /api/projects/:id', () => {
    it('should return 404 for unknown project id', async () => {
      const response = await request(app).get('/api/projects/nonexistent-id-xyz');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('PROJECT_NOT_FOUND');
    });

    it('should return a project when id exists', async () => {
      // Fetch one project via list endpoint, then read its id from the DB directly.
      const all = await request(app).get('/api/projects').query({ page: 1, per_page: 1 });
      expect(all.body.data.length).toBe(1);

      // We don't expose id in the list payload, so resolve via DB.
      const db = await getDatabase();
      const stmt = db.prepare('SELECT project_id FROM projects LIMIT 1');
      stmt.step();
      const row = stmt.getAsObject() as { project_id: string };
      stmt.free();

      const response = await request(app).get(`/api/projects/${encodeURIComponent(row.project_id)}`);
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data[0].project_id).toBe(row.project_id);
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/api/unknown');
      expect(response.status).toBe(404);
    });
  });
});
