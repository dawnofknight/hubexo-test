import { Request, Response, NextFunction } from 'express';
import { CompanyService } from '../../application/services';

/**
 * Company Controller
 * Handles HTTP requests for company endpoints (Single Responsibility)
 */
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  /**
   * GET /api/companies
   */
  getCompanies = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const companies = await this.companyService.getAllCompanies();

      res.set('Cache-Control', 'public, max-age=3600');
      res.json({
        success: true,
        data: companies,
        pagination: null
      });
    } catch (error) {
      next(error);
    }
  };
}
