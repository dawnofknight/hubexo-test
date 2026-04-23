import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger';
import { isDatabaseReady, closeDatabase, getDatabase } from './database';
import {
  fetchProjects,
  getAllAreas,
  getAllCompanies,
  areaExists,
  getProjectById
} from './projectService';
import { ApiException, ErrorCode, errorHandler, notFoundHandler } from './errors';
import { ProjectQueryParams, ApiResponse, Project } from './types';

export const MAX_PER_PAGE = 1000;
export const MAX_KEYWORD_LENGTH = 255;

const app = express();
const PORT = process.env.PORT || 3000;

// CORS: restrict to configured origin(s) in production; wide open only when unset (dev).
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : true; // `true` reflects request origin — acceptable for local dev only
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '100kb' }));

// Rate limiter for the public API — protects the DB from abuse.
// Disabled in test env to keep test suites deterministic.
if (process.env.NODE_ENV !== 'test') {
  app.use(
    '/api/',
    rateLimit({
      windowMs: 60 * 1000,
      max: Number(process.env.RATE_LIMIT_PER_MIN) || 120,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (_req, res) => {
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

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

/**
 * Swagger/OpenAPI documentation UI
 */
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * Health check endpoint
 * @swagger
 * /health:
 *   get:
 *     summary: Health check
 *     description: Check if the API is healthy and database is connected
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 database:
 *                   type: string
 *                   example: connected
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       503:
 *         description: API is unhealthy
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
 * GET /api/areas — reference data, cache-friendly.
 * @swagger
 * /api/areas:
 *   get:
 *     summary: Get all geographic areas
 *     description: Returns a list of all available geographic areas in the UK construction projects database. Results are cached for 1 hour.
 *     tags:
 *       - Reference Data
 *     responses:
 *       200:
 *         description: List of areas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: [London, Manchester, Birmingham, Bristol, Cardiff]
 *                 pagination:
 *                   type: 'null'
 */
app.get('/api/areas', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const areas = await getAllAreas();
    res.set('Cache-Control', 'public, max-age=3600');
    const response: ApiResponse<string[]> = { success: true, data: areas, pagination: null };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/companies — reference data, cache-friendly.
 * @swagger
 * /api/companies:
 *   get:
 *     summary: Get all companies
 *     description: Returns a list of all companies in the database. Results are cached for 1 hour.
 *     tags:
 *       - Reference Data
 *     responses:
 *       200:
 *         description: List of companies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Company'
 *                 pagination:
 *                   type: 'null'
 */
app.get('/api/companies', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const companies = await getAllCompanies();
    res.set('Cache-Control', 'public, max-age=3600');
    const response: ApiResponse<typeof companies> = { success: true, data: companies, pagination: null };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/projects/:id — single project details.
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get project by ID
 *     description: Returns detailed information about a specific project
 *     tags:
 *       - Projects
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Project ID
 *         schema:
 *           type: string
 *           example: p-000001
 *     responses:
 *       200:
 *         description: Project found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProjectDetail'
 *                 pagination:
 *                   type: 'null'
 *       400:
 *         description: Invalid project ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Project not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api/projects/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const projectId = req.params.id;
    if (!projectId || projectId.length > 128) {
      throw new ApiException(
        400,
        ErrorCode.VALIDATION_ERROR,
        'Invalid project id'
      );
    }

    const rows = await getProjectById(projectId);
    if (!rows) {
      throw new ApiException(
        404,
        ErrorCode.PROJECT_NOT_FOUND,
        'Project not found',
        `No project with id '${projectId}' exists.`
      );
    }

    const response: ApiResponse<(Project & { project_id: string })[]> = {
      success: true,
      data: rows,
      pagination: null
    };
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/projects
 *
 * Query Parameters:
 * - area (optional): filter by area (exact match)
 * - keyword (optional): case-insensitive substring match on project name
 * - company (optional): filter by exact company name
 * - page / per_page (optional): 1-based pagination; if both omitted, returns all
 *
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get projects
 *     description: Returns a list of construction projects with optional filtering and pagination. When pagination is not requested (page and per_page omitted), returns all matching projects with pagination set to null.
 *     tags:
 *       - Projects
 *     parameters:
 *       - name: area
 *         in: query
 *         description: Filter by geographic area (exact match)
 *         schema:
 *           type: string
 *           example: London
 *       - name: keyword
 *         in: query
 *         description: Search in project name (case-insensitive substring match, max 255 chars)
 *         schema:
 *           type: string
 *           example: Bridge
 *       - name: company
 *         in: query
 *         description: Filter by company name (exact match)
 *         schema:
 *           type: string
 *           example: NorthBuild Ltd
 *       - name: page
 *         in: query
 *         description: Page number (1-based). If provided, per_page defaults to 20
 *         schema:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *       - name: per_page
 *         in: query
 *         description: Items per page (max 1000). If provided, page defaults to 1
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           example: 20
 *     responses:
 *       200:
 *         description: List of projects
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid parameters (pagination, keyword length)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Area not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get(
  '/api/projects',
  async (
    req: Request<{}, {}, {}, ProjectQueryParams & { company?: string }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { area, keyword, page, per_page } = req.query;
      const company = req.query.company;

      if (keyword !== undefined && keyword.length > MAX_KEYWORD_LENGTH) {
        throw new ApiException(
          400,
          ErrorCode.VALIDATION_ERROR,
          'Invalid keyword',
          `keyword must be at most ${MAX_KEYWORD_LENGTH} characters`
        );
      }

      let pageNum: number | undefined;
      let perPageNum: number | undefined;

      if (page !== undefined || per_page !== undefined) {
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
          if (perPageNum > MAX_PER_PAGE) {
            throw new ApiException(
              400,
              ErrorCode.INVALID_PAGINATION,
              'Invalid per_page parameter',
              `per_page cannot exceed ${MAX_PER_PAGE}`
            );
          }
        }

        if (pageNum === undefined) pageNum = 1;
        if (perPageNum === undefined) perPageNum = 20;
      }

      const result = await fetchProjects({
        area,
        keyword,
        company,
        page: pageNum,
        perPage: perPageNum
      });

      // Defer area existence check: only pay the extra query when results are
      // empty AND area was provided — the common "good area, has results" path
      // now costs one fewer round-trip.
      const totalItems = result.pagination?.total_items ?? result.projects.length;
      if (totalItems === 0 && area && !(await areaExists(area))) {
        throw new ApiException(
          404,
          ErrorCode.AREA_NOT_FOUND,
          'Area not found',
          `No area found matching '${area}'. Use GET /api/areas to see available areas.`
        );
      }

      // Always return consistent envelope: {data, pagination}
      // When no pagination requested, pagination is null (allows frontend to know it got all records)
      const response: ApiResponse<Project[]> = {
        success: true,
        data: result.projects,
        pagination: result.pagination || null
      };
      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

app.use(notFoundHandler);
app.use(errorHandler);

let httpServer: ReturnType<typeof app.listen> | undefined;

function shutdown(signal: string): void {
  console.log(`\n${signal} received, shutting down gracefully...`);
  if (!httpServer) {
    closeDatabase();
    process.exit(0);
  }
  // Stop accepting new connections, wait for in-flight requests to finish.
  httpServer.close(err => {
    closeDatabase();
    process.exit(err ? 1 : 0);
  });
  // Safety net: force-exit if the server doesn't close in time.
  setTimeout(() => {
    console.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

async function startServer() {
  try {
    await getDatabase();
    console.log('Database connected successfully');

    httpServer = app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Projects API: http://localhost:${PORT}/api/projects`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

export default app;
