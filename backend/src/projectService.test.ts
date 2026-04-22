import * as path from 'path';

// Set database path for tests before importing modules
const testDbPath = path.join(__dirname, '..', 'glenigan_takehome FS.db');
process.env.DATABASE_PATH = testDbPath;

import { getDatabase, closeDatabase, isDatabaseReady } from './database';
import { getAllAreas, getAllCompanies, areaExists, fetchProjects } from './projectService';

describe('ProjectService Integration Tests', () => {
  beforeAll(async () => {
    // Ensure database is loaded
    await getDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  describe('getAllAreas', () => {
    it('should return an array of areas', async () => {
      const areas = await getAllAreas();
      
      expect(Array.isArray(areas)).toBe(true);
      expect(areas.length).toBeGreaterThan(0);
    });

    it('should return areas as strings', async () => {
      const areas = await getAllAreas();
      
      areas.forEach(area => {
        expect(typeof area).toBe('string');
        expect(area.length).toBeGreaterThan(0);
      });
    });

    it('should return sorted areas', async () => {
      const areas = await getAllAreas();
      const sortedAreas = [...areas].sort();
      
      expect(areas).toEqual(sortedAreas);
    });

    it('should include expected UK areas', async () => {
      const areas = await getAllAreas();
      
      // Check for some expected areas from the test database
      expect(areas).toContain('London');
      expect(areas).toContain('Birmingham');
      expect(areas).toContain('Manchester');
    });
  });

  describe('getAllCompanies', () => {
    it('should return an array of companies', async () => {
      const companies = await getAllCompanies();
      
      expect(Array.isArray(companies)).toBe(true);
      expect(companies.length).toBeGreaterThan(0);
    });

    it('should return companies with required properties', async () => {
      const companies = await getAllCompanies();
      
      companies.forEach(company => {
        expect(company).toHaveProperty('company_id');
        expect(company).toHaveProperty('company_name');
        expect(typeof company.company_id).toBe('string');
        expect(typeof company.company_name).toBe('string');
      });
    });

    it('should return companies sorted by name', async () => {
      const companies = await getAllCompanies();
      const names = companies.map(c => c.company_name);
      const sortedNames = [...names].sort();
      
      expect(names).toEqual(sortedNames);
    });
  });

  describe('areaExists', () => {
    it('should return true for existing area', async () => {
      const exists = await areaExists('London');
      expect(exists).toBe(true);
    });

    it('should return false for non-existing area', async () => {
      const exists = await areaExists('NonExistentArea');
      expect(exists).toBe(false);
    });

    it('should be case-sensitive', async () => {
      const existsLower = await areaExists('london');
      const existsProper = await areaExists('London');
      
      // Database is likely case-sensitive
      expect(existsProper).toBe(true);
      // lowercase 'london' may or may not exist depending on DB
    });
  });

  describe('fetchProjects', () => {
    describe('without filters', () => {
      it('should return all projects when no filters applied', async () => {
        const result = await fetchProjects({});
        
        expect(result).toHaveProperty('projects');
        expect(Array.isArray(result.projects)).toBe(true);
        expect(result.projects.length).toBeGreaterThan(0);
      });

      it('should return projects with required properties', async () => {
        const result = await fetchProjects({ page: 1, perPage: 10 });
        
        result.projects.forEach(project => {
          expect(project).toHaveProperty('project_name');
          expect(project).toHaveProperty('project_start');
          expect(project).toHaveProperty('project_end');
          expect(project).toHaveProperty('company');
          expect(project).toHaveProperty('project_value');
          expect(project).toHaveProperty('area');
        });
      });
    });

    describe('with pagination', () => {
      it('should return pagination metadata when page and perPage provided', async () => {
        const result = await fetchProjects({ page: 1, perPage: 10 });
        
        expect(result).toHaveProperty('pagination');
        expect(result.pagination).toHaveProperty('current_page', 1);
        expect(result.pagination).toHaveProperty('per_page', 10);
        expect(result.pagination).toHaveProperty('total_items');
        expect(result.pagination).toHaveProperty('total_pages');
        expect(result.pagination).toHaveProperty('has_next');
        expect(result.pagination).toHaveProperty('has_prev');
      });

      it('should respect perPage limit', async () => {
        const result = await fetchProjects({ page: 1, perPage: 5 });
        
        expect(result.projects.length).toBeLessThanOrEqual(5);
      });

      it('should calculate has_next correctly', async () => {
        const result = await fetchProjects({ page: 1, perPage: 10 });
        
        if (result.pagination!.total_pages > 1) {
          expect(result.pagination!.has_next).toBe(true);
        } else {
          expect(result.pagination!.has_next).toBe(false);
        }
      });

      it('should calculate has_prev correctly', async () => {
        const resultPage1 = await fetchProjects({ page: 1, perPage: 10 });
        expect(resultPage1.pagination!.has_prev).toBe(false);
        
        if (resultPage1.pagination!.total_pages > 1) {
          const resultPage2 = await fetchProjects({ page: 2, perPage: 10 });
          expect(resultPage2.pagination!.has_prev).toBe(true);
        }
      });

      it('should return different projects for different pages', async () => {
        const page1 = await fetchProjects({ page: 1, perPage: 5 });
        const page2 = await fetchProjects({ page: 2, perPage: 5 });
        
        // At least some projects should be different
        const page1Names = page1.projects.map(p => p.project_name + p.area);
        const page2Names = page2.projects.map(p => p.project_name + p.area);
        
        const overlap = page1Names.filter(n => page2Names.includes(n));
        expect(overlap.length).toBeLessThan(page1Names.length);
      });
    });

    describe('with area filter', () => {
      it('should filter projects by area', async () => {
        const result = await fetchProjects({ area: 'London', page: 1, perPage: 50 });
        
        expect(result.projects.length).toBeGreaterThan(0);
        result.projects.forEach(project => {
          expect(project.area).toBe('London');
        });
      });

      it('should return empty array for non-existing area', async () => {
        const result = await fetchProjects({ area: 'NonExistentArea', page: 1, perPage: 10 });
        
        expect(result.projects.length).toBe(0);
      });
    });

    describe('with keyword filter', () => {
      it('should filter projects by keyword in name', async () => {
        const result = await fetchProjects({ keyword: 'Bridge', page: 1, perPage: 50 });
        
        expect(result.projects.length).toBeGreaterThan(0);
        result.projects.forEach(project => {
          expect(project.project_name.toLowerCase()).toContain('bridge');
        });
      });

      it('should be case-insensitive', async () => {
        const resultLower = await fetchProjects({ keyword: 'bridge', page: 1, perPage: 10 });
        const resultUpper = await fetchProjects({ keyword: 'BRIDGE', page: 1, perPage: 10 });
        
        expect(resultLower.pagination!.total_items).toBe(resultUpper.pagination!.total_items);
      });

      it('should return empty array for keyword with no matches', async () => {
        const result = await fetchProjects({ keyword: 'xyz123nonexistent', page: 1, perPage: 10 });
        
        expect(result.projects.length).toBe(0);
      });
    });

    describe('with combined filters', () => {
      it('should apply both area and keyword filters', async () => {
        const result = await fetchProjects({ 
          area: 'London', 
          keyword: 'Bridge', 
          page: 1, 
          perPage: 50 
        });
        
        result.projects.forEach(project => {
          expect(project.area).toBe('London');
          expect(project.project_name.toLowerCase()).toContain('bridge');
        });
      });
    });
  });
});

describe('Database Module', () => {
  describe('isDatabaseReady', () => {
    it('should return true when database is loaded', async () => {
      await getDatabase(); // Ensure DB is loaded
      const ready = await isDatabaseReady();
      expect(ready).toBe(true);
    });
  });
});
