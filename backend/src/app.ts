import express, { Request, Response } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import { AppConfig } from './config/app.config';
import { container } from './container';
import { databaseConnection } from './infrastructure/database';
import {
  createProjectRoutes,
  createAreaRoutes,
  createCompanyRoutes,
  createHealthRoutes
} from './presentation/routes';
import {
  errorHandler,
  notFoundHandler,
  requestLogger,
  ErrorCode
} from './presentation/middlewares';
import { swaggerSpec } from './swagger';

/**
 * Create and configure Express application
 */
export function createApp(): express.Application {
  const app = express();

  // CORS configuration
  app.use(cors({ origin: AppConfig.allowedOrigins }));
  app.use(express.json({ limit: '100kb' }));

  // Rate limiting (disabled in test environment)
  if (!AppConfig.isTest()) {
    app.use(
      '/api/',
      rateLimit({
        windowMs: 60 * 1000,
        max: AppConfig.rateLimitPerMin,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (_req: Request, res: Response) => {
          res.status(429).json({
            success: false,
            error: {
              code: ErrorCode.RATE_LIMITED,
              message: 'Too many requests, please try again later.'
            }
          });
        }
      })
    );
  }

  // Request logging
  app.use(requestLogger);

  // Swagger documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Routes
  app.use('/health', createHealthRoutes(container.healthController));
  app.use('/api/projects', createProjectRoutes(container.projectController));
  app.use('/api/areas', createAreaRoutes(container.areaController));
  app.use('/api/companies', createCompanyRoutes(container.companyController));

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

/**
 * Start the server
 */
async function main(): Promise<void> {
  try {
    // Initialize database connection
    await databaseConnection.getConnection();
    console.log('Database initialized');

    // Create and start app
    const app = createApp();
    
    app.listen(AppConfig.port, () => {
      console.log(`Server running at http://localhost:${AppConfig.port}`);
      console.log(`API Docs: http://localhost:${AppConfig.port}/api-docs`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down...');
      databaseConnection.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Run if this is the entry point
if (require.main === module) {
  main();
}

// Export for testing
export { databaseConnection };
