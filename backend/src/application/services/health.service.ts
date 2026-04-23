import { databaseConnection } from '../../infrastructure/database';

/**
 * Health Service
 * Handles health check logic (Single Responsibility)
 */
export class HealthService {
  async checkHealth(): Promise<{
    status: 'healthy' | 'unhealthy';
    database: 'connected' | 'disconnected';
    timestamp: string;
  }> {
    const isDbReady = await databaseConnection.isReady();
    
    return {
      status: isDbReady ? 'healthy' : 'unhealthy',
      database: isDbReady ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    };
  }
}
