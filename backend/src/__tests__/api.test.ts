import request from 'supertest';
import { createApp, databaseConnection } from '../app';
import express from 'express';

describe('API Endpoints', () => {
  let app: express.Application;

  beforeAll(async () => {
    await databaseConnection.getConnection();
    app = createApp();
  });

  afterAll(() => {
    databaseConnection.close();
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

    it('should set cache header', async () => {
      const response = await request(app).get('/api/areas');
      expect(response.headers['cache-control']).toContain('max-age=3600');
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
          .query({ page: 1, per_page: 1001 });

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
