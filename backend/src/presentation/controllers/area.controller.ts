import { Request, Response, NextFunction } from 'express';
import { AreaService } from '../../application/services';

/**
 * Area Controller
 * Handles HTTP requests for area endpoints (Single Responsibility)
 */
export class AreaController {
  constructor(private readonly areaService: AreaService) {}

  /**
   * GET /api/areas
   */
  getAreas = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const areas = await this.areaService.getAllAreas();

      res.set('Cache-Control', 'public, max-age=3600');
      res.json({
        success: true,
        data: areas,
        pagination: null
      });
    } catch (error) {
      next(error);
    }
  };
}
