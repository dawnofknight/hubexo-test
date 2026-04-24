import { Request, Response, NextFunction } from 'express';
import { AreaService } from '../../application/services';

/**
 * Area Controller
 * WHY: HTTP request handler layer (Presentation/Interface Adapter)
 * - Single Responsibility: handles only HTTP concerns
 * - Translates HTTP requests → service calls → HTTP responses
 * - Input validation (query params, body)
 * - Output formatting (status codes, headers)
 * - Does NOT contain business logic (that's in services)
 * - Does NOT access database directly (that's in repositories)
 * - Bridge between Express HTTP layer and domain logic
 */
export class AreaController {
  constructor(private readonly areaService: AreaService) {}

  /**
   * GET /api/areas
   * WHY: Retrieve all areas for listing in UI (dropdowns, filters, etc.)
   * - HTTP GET: safe, idempotent operation
   * - Status 200: successful retrieval
   * - Caching headers allow browser caching of static area list
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

  // ===== COMMENTED OUT CRUD HTTP ENDPOINTS =====
  // WHY: Complete REST API implementation for area management
  // Each endpoint follows REST conventions and HTTP standards

  /*
  // CREATE ENDPOINT
  // POST /api/areas
  // WHY: HTTP endpoint to create new area
  // - HTTP POST: non-idempotent, creates resource
  // - Status 201: resource created successfully
  // - Returns created resource with ID
  // - Location header: where to find the resource
  createArea = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // WHY: Validate request body exists
      if (!req.body) {
        res.status(400).json({
          success: false,
          error: 'Request body required'
        });
        return;
      }

      // WHY: Validate required fields
      if (!req.body.name || typeof req.body.name !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Field "name" is required and must be a string'
        });
        return;
      }

      // WHY: Call service to create area
      const area = await this.areaService.createArea({
        name: req.body.name.trim(),
        description: req.body.description
      });

      // WHY: Return 201 Created status with resource location
      res.status(201)
        .set('Location', `/api/areas/${area.id}`)
        .json({
          success: true,
          data: area,
          message: 'Area created successfully'
        });
    } catch (error) {
      // WHY: Let error middleware handle exceptions
      // Includes logging, error formatting, appropriate status codes
      next(error);
    }
  };

  // READ ENDPOINTS
  // WHY: Different HTTP GET endpoints for different query patterns

  // Get area by ID
  // GET /api/areas/:id
  // WHY: Retrieve specific area for editing or viewing details
  // - HTTP GET: safe, idempotent
  // - URL parameter: clear RESTful pattern
  // - Status 200: success, 404: not found
  getAreaById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      // WHY: Validate ID format (prevent SQL injection, invalid lookups)
      if (!id || typeof id !== 'string' || id.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Area ID is required'
        });
        return;
      }

      // WHY: Call service which throws NotFoundException if not found
      const area = await this.areaService.getAreaById(id);

      res.json({
        success: true,
        data: area
      });
    } catch (error) {
      next(error);
    }
  };

  // Get area by name
  // GET /api/areas/by-name/:name
  // WHY: Allow lookup by business name instead of ID
  // - Users often know area names, not IDs
  // - Required for validation forms
  // - Query parameter alternative: GET /api/areas?name=North
  getAreaByName = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { name } = req.query;

      if (!name || typeof name !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Area name is required'
        });
        return;
      }

      const area = await this.areaService.getAreaByName(name);

      res.json({
        success: true,
        data: area
      });
    } catch (error) {
      next(error);
    }
  };

  // Get all areas with filtering
  // GET /api/areas?onlyActive=true&search=north
  // WHY: Support different listing scenarios
  // - Query parameters: allow flexible filtering
  // - onlyActive: show only active areas (business rule)
  // - search: filter by name/description
  getAllAreasFiltered = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { onlyActive, search } = req.query;

      const areas = await this.areaService.getAllAreasWithFilter({
        onlyActive: onlyActive === 'true',
        search: typeof search === 'string' ? search : undefined
      });

      res.json({
        success: true,
        data: areas,
        count: areas.length
      });
    } catch (error) {
      next(error);
    }
  };

  // UPDATE ENDPOINT
  // PUT /api/areas/:id (replace all) or PATCH /api/areas/:id (partial update)
  // WHY: HTTP endpoint to modify existing area
  // - HTTP PATCH: update partial resource (idempotent)
  // - URL parameter: clear RESTful pattern
  // - Status 200: success, 404: not found, 409: conflict
  updateArea = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      // WHY: Validate ID
      if (!id || typeof id !== 'string' || id.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Area ID is required'
        });
        return;
      }

      // WHY: Validate request body
      if (!req.body || Object.keys(req.body).length === 0) {
        res.status(400).json({
          success: false,
          error: 'At least one field to update is required'
        });
        return;
      }

      // WHY: Call service to update area
      const updated = await this.areaService.updateArea(id, {
        name: req.body.name,
        description: req.body.description,
        status: req.body.status
      });

      res.json({
        success: true,
        data: updated,
        message: 'Area updated successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  // DELETE ENDPOINT
  // DELETE /api/areas/:id
  // WHY: HTTP endpoint to remove area
  // - HTTP DELETE: removes resource
  // - Idempotent: calling twice should be safe
  // - Status 204: no content, 404: not found
  deleteArea = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      // WHY: Validate ID
      if (!id || typeof id !== 'string' || id.trim().length === 0) {
        res.status(400).json({
          success: false,
          error: 'Area ID is required'
        });
        return;
      }

      // WHY: Call service to delete area
      await this.areaService.deleteArea(id);

      // WHY: Return 204 No Content (success, no body to return)
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  // BULK OPERATIONS
  // WHY: Endpoints for bulk operations when multiple records needed

  // Create multiple areas
  // POST /api/areas/bulk/create
  // WHY: Import multiple areas from CSV/Excel
  // - Batch processing more efficient than individual calls
  // - Returns both successful and failed creates
  // - Useful for data migration, seed scripts
  createBulkAreas = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // WHY: Validate request is array
      if (!Array.isArray(req.body)) {
        res.status(400).json({
          success: false,
          error: 'Request body must be an array of area objects'
        });
        return;
      }

      // WHY: Call service for bulk creation
      const result = await this.areaService.createBulkAreas(req.body);

      // WHY: Return mixed success/failure details
      res.status(207).json({
        success: true,
        data: result,
        summary: {
          total: req.body.length,
          created: result.created.length,
          skipped: result.skipped.length
        }
      });
    } catch (error) {
      next(error);
    }
  };

  // Delete multiple areas
  // DELETE /api/areas/bulk/delete
  // WHY: Remove multiple areas in single operation
  deleteBulkAreas = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // WHY: Validate request body
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Request must include array of IDs'
        });
        return;
      }

      // WHY: Call service to delete multiple areas
      const deleted = await this.areaService.deleteBulkAreas(ids);

      res.json({
        success: true,
        data: { deleted },
        message: \`\${deleted} areas deleted successfully\`
      });
    } catch (error) {
      next(error);
    }
  };

  // Get statistics
  // GET /api/areas/stats
  // WHY: Analytics endpoint for dashboard/reporting
  // - Count total, active, archived areas
  // - Monitor data quality
  // - Business intelligence
  getAreaStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.areaService.getAreaStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  };

  // ===== ROUTE REGISTRATION EXAMPLE =====
  // WHY: Show how these endpoints would be registered (commented for now)
  /*
  // In area.routes.ts:
  const router = Router();
  const controller = new AreaController(areaService);

  // GET endpoints (safe, no side effects)
  router.get('/api/areas', controller.getAreas);
  router.get('/api/areas/:id', controller.getAreaById);
  router.get('/api/areas/by-name', controller.getAreaByName);
  router.get('/api/areas/stats', controller.getAreaStats);

  // POST endpoints (create)
  router.post('/api/areas', controller.createArea);
  router.post('/api/areas/bulk/create', controller.createBulkAreas);

  // PATCH endpoints (update)
  router.patch('/api/areas/:id', controller.updateArea);

  // DELETE endpoints (remove)
  router.delete('/api/areas/:id', controller.deleteArea);
  router.delete('/api/areas/bulk/delete', controller.deleteBulkAreas);

  export default router;
  */
  */
}
