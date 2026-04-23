import { Router } from 'express';
import { HealthController } from '../controllers';

/**
 * Create health routes
 */
export function createHealthRoutes(controller: HealthController): Router {
  const router = Router();

  /**
   * @swagger
   * /health:
   *   get:
   *     summary: Health check
   *     tags: [Health]
   */
  router.get('/', controller.checkHealth);

  return router;
}
