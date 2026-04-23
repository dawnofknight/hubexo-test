import { Router } from 'express';
import { ProjectController } from '../controllers';
import { validatePagination, validateKeyword } from '../middlewares';

/**
 * Create project routes
 */
export function createProjectRoutes(controller: ProjectController): Router {
  const router = Router();

  /**
   * @swagger
   * /api/projects:
   *   get:
   *     summary: Get construction projects
   *     tags: [Projects]
   *     parameters:
   *       - in: query
   *         name: area
   *         schema:
   *           type: string
   *         description: Filter by area
   *       - in: query
   *         name: keyword
   *         schema:
   *           type: string
   *         description: Search keyword
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *         description: Page number
   *       - in: query
   *         name: per_page
   *         schema:
   *           type: integer
   *         description: Items per page
   */
  router.get(
    '/',
    validatePagination,
    validateKeyword,
    controller.getProjects
  );

  /**
   * @swagger
   * /api/projects/{id}:
   *   get:
   *     summary: Get project by ID
   *     tags: [Projects]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   */
  router.get('/:id', controller.getProjectById);

  return router;
}
