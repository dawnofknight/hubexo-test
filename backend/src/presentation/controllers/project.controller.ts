import { Request, Response, NextFunction } from 'express';
import { ProjectService } from '../../application/services';
import { AreaService } from '../../application/services';
import { AppConfig } from '../../config/app.config';

/**
 * Project Controller
 * Handles HTTP requests for project endpoints (Single Responsibility)
 */
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly areaService: AreaService
  ) {}

  /**
   * GET /api/projects
   */
  getProjects = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { area, keyword, company, page, per_page } = req.query;

      // Validate area exists if provided
      if (area && typeof area === 'string') {
        await this.areaService.validateAreaExists(area);
      }

      // Parse pagination
      let pageNum: number | undefined;
      let perPageNum: number | undefined;

      if (page !== undefined || per_page !== undefined) {
        pageNum = page ? parseInt(page as string, 10) : 1;
        perPageNum = per_page ? parseInt(per_page as string, 10) : AppConfig.defaultPerPage;
      }

      const result = await this.projectService.getProjects({
        area: area as string,
        keyword: keyword as string,
        company: company as string,
        page: pageNum,
        perPage: perPageNum
      });

      res.json({
        success: true,
        data: result.projects,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/projects/:id
   */
  getProjectById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const projects = await this.projectService.getProjectById(id);

      res.json({
        success: true,
        data: projects,
        pagination: null
      });
    } catch (error) {
      next(error);
    }
  };
}
