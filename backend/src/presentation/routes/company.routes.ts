import { Router } from 'express';
import { CompanyController } from '../controllers';

/**
 * Create company routes
 */
export function createCompanyRoutes(controller: CompanyController): Router {
  const router = Router();

  /**
   * @swagger
   * /api/companies:
   *   get:
   *     summary: Get all companies
   *     tags: [Reference Data]
   */
  router.get('/', controller.getCompanies);

  return router;
}
