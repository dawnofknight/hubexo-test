import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { isDatabaseReady, closeDatabase, getDatabase } from './database';
import { fetchProjects, getAllAreas, getAllCompanies, areaExists } from './projectService';
import { ApiException, ErrorCode, errorHandler, notFoundHandler } from './errors';
import { ProjectQueryParams, ApiResponse, Project } from './types';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

/**
 * Health check endpoint
 */
app.get('/health', async (_req: Request, res: Response) => {
  const dbReady = await isDatabaseReady();
  res.status(dbReady ? 200 : 503).json({
    status: dbReady ? 'healthy' : 'unhealthy',
    database: dbReady ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /api/areas
 * Returns list of all available areas for filtering dropdown
 */
app.get('/api/areas', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const areas = await getAllAreas();
    const response: ApiResponse<string[]> = {
      success: true,
      data: areas
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/companies
 * Returns list of all companies for filtering dropdown
 */
app.get('/api/companies', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const companies = await getAllCompanies();
    const response: ApiResponse<typeof companies> = {
      success: true,
      data: companies
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/projects
 * Returns list of projects with optional filtering and pagination
 * 
 * Query Parameters:
 * - area (optional): Filter projects by area
 * - keyword (optional): Search by project name
 * - page (optional): Page number (1-based)
 * - per_page (optional): Number of items per page
 * 
 * If both page and per_page are not provided, returns all projects
 */
app.get('/api/projects', async (req: Request<{}, {}, {}, ProjectQueryParams>, res: Response, next: NextFunction) => {
  try {
    const { area, keyword, page, per_page } = req.query;

    // Validate pagination parameters if provided
    let pageNum: number | undefined;
    let perPageNum: number | undefined;

    if (page !== undefined || per_page !== undefined) {
      // If one pagination param is provided, both should ideally be provided
      // But we'll handle partial cases gracefully
      
      if (page !== undefined) {
        pageNum = parseInt(page, 10);
        if (isNaN(pageNum) || pageNum < 1) {
          throw new ApiException(
            400,
            ErrorCode.INVALID_PAGINATION,
            'Invalid page parameter',
            'Page must be a positive integer (1-based)'
          );
        }
      }

      if (per_page !== undefined) {
        perPageNum = parseInt(per_page, 10);
        if (isNaN(perPageNum) || perPageNum < 1) {
          throw new ApiException(
            400,
            ErrorCode.INVALID_PAGINATION,
            'Invalid per_page parameter',
            'per_page must be a positive integer'
          );
        }
        // Reasonable max limit to prevent abuse
        if (perPageNum > 1000) {
          throw new ApiException(
            400,
            ErrorCode.INVALID_PAGINATION,
            'Invalid per_page parameter',
            'per_page cannot exceed 1000'
          );
        }
      }

      // Default values if only one pagination param is provided
      if (pageNum === undefined) pageNum = 1;
      if (perPageNum === undefined) perPageNum = 20;
    }

    // Validate area exists if provided
    if (area && !(await areaExists(area))) {
      throw new ApiException(
        404,
        ErrorCode.AREA_NOT_FOUND,
        'Area not found',
        `No area found matching '${area}'. Use GET /api/areas to see available areas.`
      );
    }

    // Fetch projects
    const result = await fetchProjects({
      area,
      keyword,
      page: pageNum,
      perPage: perPageNum
    });

    // Build response
    // Per spec: return array format for the data
    // But include pagination metadata if pagination was used
    if (result.pagination) {
      const response: ApiResponse<Project[]> = {
        success: true,
        data: result.projects,
        pagination: result.pagination
      };
      res.json(response);
    } else {
      // When no pagination, return the array directly as per spec requirement
      // "return all projects in the database" in the exact format specified
      res.json(result.projects);
    }
  } catch (error) {
    next(error);
  }
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  closeDatabase();
  process.exit(0);
});

// Start server - initialize DB first
async function startServer() {
  try {
    // Pre-load database
    await getDatabase();
    console.log('✅ Database connected successfully');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`📋 Projects API: http://localhost:${PORT}/api/projects`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
