import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Glenigan Construction Projects API',
      version: '1.0.0',
      description: 'REST API for browsing and filtering UK construction projects',
      contact: {
        name: 'Support',
        email: 'alvin.megatroika@bcicentral.hubexo.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Development server'
      },
      {
        url: '/api',
        description: 'Production server (relative)'
      }
    ],
    components: {
      schemas: {
        Project: {
          type: 'object',
          required: ['project_name', 'company', 'project_value', 'area'],
          properties: {
            project_name: {
              type: 'string',
              description: 'Name of the project',
              example: 'Manchester Bridge Phase 2'
            },
            project_start: {
              type: 'string',
              format: 'date-time',
              description: 'Project start date',
              example: '2026-01-01 00:00:00'
            },
            project_end: {
              type: 'string',
              format: 'date-time',
              description: 'Project end date',
              example: '2027-01-10 00:00:00'
            },
            company: {
              type: 'string',
              description: 'Company name',
              example: 'NorthBuild Ltd'
            },
            description: {
              type: 'string',
              nullable: true,
              description: 'Project description',
              example: 'A major bridge construction project'
            },
            project_value: {
              type: 'integer',
              description: 'Project value in GBP (£)',
              example: 4832115
            },
            area: {
              type: 'string',
              description: 'Geographic area',
              example: 'Manchester'
            }
          }
        },
        ProjectDetail: {
          allOf: [
            { $ref: '#/components/schemas/Project' },
            {
              type: 'object',
              properties: {
                project_id: {
                  type: 'string',
                  description: 'Unique project identifier',
                  example: 'p-000001'
                }
              }
            }
          ]
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            current_page: {
              type: 'integer',
              description: 'Current page number',
              example: 1
            },
            per_page: {
              type: 'integer',
              description: 'Items per page',
              example: 20
            },
            total_items: {
              type: 'integer',
              description: 'Total number of items matching filters',
              example: 1800
            },
            total_pages: {
              type: 'integer',
              description: 'Total number of pages',
              example: 90
            },
            has_next: {
              type: 'boolean',
              description: 'Whether next page exists',
              example: true
            },
            has_prev: {
              type: 'boolean',
              description: 'Whether previous page exists',
              example: false
            }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/Project' }
            },
            pagination: {
              oneOf: [
                { $ref: '#/components/schemas/PaginationMeta' },
                { type: 'null' }
              ],
              description: 'Pagination metadata (null when not paginated)'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'Error code',
                  example: 'INVALID_PAGINATION'
                },
                message: {
                  type: 'string',
                  description: 'Human-readable error message',
                  example: 'Invalid page parameter'
                },
                details: {
                  type: 'string',
                  nullable: true,
                  description: 'Optional additional context'
                }
              }
            }
          }
        },
        Company: {
          type: 'object',
          properties: {
            company_id: {
              type: 'string',
              example: 'c-001'
            },
            company_name: {
              type: 'string',
              example: 'ABC Construction'
            }
          }
        }
      }
    }
  },
  apis: [__filename.replace('swagger.ts', 'index.ts')]
};

export const swaggerSpec = swaggerJsdoc(options);
