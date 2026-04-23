import { ProjectRepository, AreaRepository, CompanyRepository } from '../infrastructure/repositories';
import { databaseConnection } from '../infrastructure/database';
import { Project, Area, Company } from '../domain/entities';

describe('Repository Integration Tests', () => {
  beforeAll(async () => {
    await databaseConnection.getConnection();
  });

  afterAll(() => {
    databaseConnection.close();
  });

  describe('AreaRepository', () => {
    const areaRepo = new AreaRepository();

    it('should return all areas', async () => {
      const areas = await areaRepo.findAll();
      expect(Array.isArray(areas)).toBe(true);
      expect(areas.length).toBeGreaterThan(0);
      expect(areas[0]).toHaveProperty('name');
    });

    it('should return sorted areas', async () => {
      const areas = await areaRepo.findAll();
      const names = areas.map((a: Area) => a.name);
      const sorted = [...names].sort();
      expect(names).toEqual(sorted);
    });

    it('should return true for existing area', async () => {
      const exists = await areaRepo.exists('London');
      expect(exists).toBe(true);
    });

    it('should return false for non-existing area', async () => {
      const exists = await areaRepo.exists('NonExistentArea');
      expect(exists).toBe(false);
    });
  });

  describe('CompanyRepository', () => {
    const companyRepo = new CompanyRepository();

    it('should return all companies', async () => {
      const companies = await companyRepo.findAll();
      expect(Array.isArray(companies)).toBe(true);
      expect(companies.length).toBeGreaterThan(0);
    });

    it('should return companies with proper structure', async () => {
      const companies = await companyRepo.findAll();
      companies.forEach((company: Company) => {
        expect(company).toHaveProperty('companyId');
        expect(company).toHaveProperty('companyName');
      });
    });

    it('should return sorted companies', async () => {
      const companies = await companyRepo.findAll();
      const names = companies.map((c: Company) => c.companyName);
      const sorted = [...names].sort();
      expect(names).toEqual(sorted);
    });
  });

  describe('ProjectRepository', () => {
    const projectRepo = new ProjectRepository();

    describe('findAll without filters', () => {
      it('should return projects', async () => {
        const result = await projectRepo.findAll({});
        expect(result.items.length).toBeGreaterThan(0);
        expect(result.pagination).toBeNull();
      });

      it('should return projects with proper structure', async () => {
        const result = await projectRepo.findAll({ page: 1, perPage: 10 });
        result.items.forEach((project: Project) => {
          expect(project).toHaveProperty('projectName');
          expect(project).toHaveProperty('projectStart');
          expect(project).toHaveProperty('projectEnd');
          expect(project).toHaveProperty('company');
          expect(project).toHaveProperty('projectValue');
          expect(project).toHaveProperty('area');
        });
      });
    });

    describe('findAll with pagination', () => {
      it('should return pagination metadata', async () => {
        const result = await projectRepo.findAll({ page: 1, perPage: 10 });
        expect(result.pagination).not.toBeNull();
        expect(result.pagination?.currentPage).toBe(1);
        expect(result.pagination?.perPage).toBe(10);
        expect(result.pagination).toHaveProperty('totalItems');
        expect(result.pagination).toHaveProperty('totalPages');
      });

      it('should respect perPage limit', async () => {
        const result = await projectRepo.findAll({ page: 1, perPage: 5 });
        expect(result.items.length).toBeLessThanOrEqual(5);
      });

      it('should calculate hasNext correctly', async () => {
        const result = await projectRepo.findAll({ page: 1, perPage: 10 });
        if (result.pagination!.totalPages > 1) {
          expect(result.pagination!.hasNext).toBe(true);
        }
      });

      it('should return different pages', async () => {
        const page1 = await projectRepo.findAll({ page: 1, perPage: 5 });
        const page2 = await projectRepo.findAll({ page: 2, perPage: 5 });
        
        const page1Names = page1.items.map((p: Project) => p.projectName + p.area);
        const page2Names = page2.items.map((p: Project) => p.projectName + p.area);
        
        const overlap = page1Names.filter((n: string) => page2Names.includes(n));
        expect(overlap.length).toBeLessThan(page1Names.length);
      });
    });

    describe('findAll with area filter', () => {
      it('should filter by area', async () => {
        const result = await projectRepo.findAll({ area: 'London', page: 1, perPage: 50 });
        expect(result.items.length).toBeGreaterThan(0);
        result.items.forEach((project: Project) => {
          expect(project.area).toBe('London');
        });
      });

      it('should return empty for non-existing area', async () => {
        const result = await projectRepo.findAll({ area: 'NonExistent', page: 1, perPage: 10 });
        expect(result.items.length).toBe(0);
      });
    });

    describe('findAll with keyword filter', () => {
      it('should filter by keyword', async () => {
        const result = await projectRepo.findAll({ keyword: 'Bridge', page: 1, perPage: 50 });
        expect(result.items.length).toBeGreaterThan(0);
        result.items.forEach((project: Project) => {
          expect(project.projectName.toLowerCase()).toContain('bridge');
        });
      });

      it('should be case-insensitive', async () => {
        const lower = await projectRepo.findAll({ keyword: 'bridge', page: 1, perPage: 10 });
        const upper = await projectRepo.findAll({ keyword: 'BRIDGE', page: 1, perPage: 10 });
        expect(lower.pagination!.totalItems).toBe(upper.pagination!.totalItems);
      });
    });

    describe('findAll with combined filters', () => {
      it('should apply both area and keyword', async () => {
        const result = await projectRepo.findAll({
          area: 'London',
          keyword: 'Bridge',
          page: 1,
          perPage: 50
        });
        result.items.forEach((project: Project) => {
          expect(project.area).toBe('London');
          expect(project.projectName.toLowerCase()).toContain('bridge');
        });
      });
    });
  });
});

describe('Database Connection', () => {
  it('should report ready when connected', async () => {
    const ready = await databaseConnection.isReady();
    expect(ready).toBe(true);
  });
});
