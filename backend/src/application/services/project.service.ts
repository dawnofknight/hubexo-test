import { IProjectRepository } from '../../domain/repositories';
import { NotFoundException } from '../../domain/exceptions';
import { ProjectDTO, ProjectWithIdDTO, GetProjectsQueryDTO, PaginationDTO } from '../dtos';

/**
 * Project Application Service
 * Orchestrates project-related use cases (Single Responsibility)
 */
export class ProjectService {
  constructor(private readonly projectRepository: IProjectRepository) {}

  /**
   * Get projects with optional filtering and pagination
   */
  async getProjects(query: GetProjectsQueryDTO): Promise<{
    projects: ProjectDTO[];
    pagination: PaginationDTO | null;
  }> {
    const result = await this.projectRepository.findAll({
      area: query.area,
      keyword: query.keyword,
      company: query.company,
      page: query.page,
      perPage: query.perPage
    });

    const projects = result.items.map(this.toProjectDTO);
    
    const pagination = result.pagination ? {
      current_page: result.pagination.currentPage,
      per_page: result.pagination.perPage,
      total_items: result.pagination.totalItems,
      total_pages: result.pagination.totalPages,
      has_next: result.pagination.hasNext,
      has_prev: result.pagination.hasPrev
    } : null;

    return { projects, pagination };
  }

  /**
   * Get a project by ID
   */
  async getProjectById(projectId: string): Promise<ProjectWithIdDTO[]> {
    const projects = await this.projectRepository.findById(projectId);
    
    if (!projects) {
      throw new NotFoundException('Project', projectId);
    }

    return projects.map(p => ({
      project_id: p.projectId!,
      ...this.toProjectDTO(p)
    }));
  }

  /**
   * Transform domain entity to DTO
   */
  private toProjectDTO(project: { 
    projectName: string;
    projectStart: string;
    projectEnd: string;
    company: string;
    description: string | null;
    projectValue: number;
    area: string;
  }): ProjectDTO {
    return {
      project_name: project.projectName,
      project_start: project.projectStart,
      project_end: project.projectEnd,
      company: project.company,
      description: project.description,
      project_value: project.projectValue,
      area: project.area
    };
  }
}
