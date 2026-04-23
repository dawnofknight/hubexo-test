import { ProjectRepository, AreaRepository, CompanyRepository } from './infrastructure/repositories';
import { ProjectService, AreaService, CompanyService, HealthService } from './application/services';
import { ProjectController, AreaController, CompanyController, HealthController } from './presentation/controllers';

/**
 * Dependency Injection Container
 * Wires up all dependencies (Dependency Inversion Principle)
 */
export class Container {
  // Repositories (Infrastructure Layer)
  private readonly projectRepository = new ProjectRepository();
  private readonly areaRepository = new AreaRepository();
  private readonly companyRepository = new CompanyRepository();

  // Services (Application Layer)
  private readonly projectService = new ProjectService(this.projectRepository);
  private readonly areaService = new AreaService(this.areaRepository);
  private readonly companyService = new CompanyService(this.companyRepository);
  private readonly healthService = new HealthService();

  // Controllers (Presentation Layer)
  readonly projectController = new ProjectController(this.projectService, this.areaService);
  readonly areaController = new AreaController(this.areaService);
  readonly companyController = new CompanyController(this.companyService);
  readonly healthController = new HealthController(this.healthService);
}

// Singleton container instance
export const container = new Container();
