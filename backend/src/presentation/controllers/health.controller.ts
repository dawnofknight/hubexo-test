import { Request, Response } from 'express';
import { HealthService } from '../../application/services';

/**
 * Health Controller
 * Handles HTTP requests for health check (Single Responsibility)
 */
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /**
   * GET /health
   */
  checkHealth = async (_req: Request, res: Response): Promise<void> => {
    const health = await this.healthService.checkHealth();
    res.status(health.status === 'healthy' ? 200 : 503).json(health);
  };
}
