import { Router } from 'express';
import { AreaController } from '../controllers';

/**
 * Create area routes
 */
export function createAreaRoutes(controller: AreaController): Router {
  const router = Router();

  /**
   * @swagger
   * /api/areas:
   *   get:
   *     summary: Get all geographic areas
   *     tags: [Reference Data]
   */
  router.get('/', controller.getAreas);

  return router;
}
