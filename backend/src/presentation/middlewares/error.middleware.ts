import { Request, Response, NextFunction } from 'express';
import { ApiErrorDTO } from '../../application/dtos';
import { NotFoundException, ValidationException } from '../../domain/exceptions';
import { AppConfig } from '../../config/app.config';

/**
 * Error codes for API responses
 */
export enum ErrorCode {
  INVALID_PAGINATION = 'INVALID_PAGINATION',
  AREA_NOT_FOUND = 'AREA_NOT_FOUND',
  PROJECT_NOT_FOUND = 'PROJECT_NOT_FOUND',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMITED = 'RATE_LIMITED'
}

/**
 * Custom API Exception
 */
export class ApiException extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly errorCode: string,
    message: string,
    public readonly details?: string
  ) {
    super(message);
    this.name = 'ApiException';
  }
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('Error:', err);

  // Handle API exceptions
  if (err instanceof ApiException) {
    const response: ApiErrorDTO = {
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
        details: err.details
      }
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // Handle domain exceptions
  if (err instanceof NotFoundException) {
    const code = err.entityName === 'Area' ? ErrorCode.AREA_NOT_FOUND : ErrorCode.PROJECT_NOT_FOUND;
    const response: ApiErrorDTO = {
      success: false,
      error: {
        code,
        message: `${err.entityName} not found`,
        details: `No ${err.entityName.toLowerCase()} found matching '${err.identifier}'. Use GET /api/${err.entityName.toLowerCase()}s to see available options.`
      }
    };
    res.status(404).json(response);
    return;
  }

  if (err instanceof ValidationException) {
    const response: ApiErrorDTO = {
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: err.message,
        details: err.reason
      }
    };
    res.status(400).json(response);
    return;
  }

  // Handle database errors
  if (err.message?.includes('SQLITE') || err.message?.includes('database')) {
    const response: ApiErrorDTO = {
      success: false,
      error: {
        code: ErrorCode.DATABASE_ERROR,
        message: 'Database error occurred',
        details: AppConfig.isDevelopment() ? err.message : undefined
      }
    };
    res.status(500).json(response);
    return;
  }

  // Generic internal error
  const response: ApiErrorDTO = {
    success: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'An unexpected error occurred',
      details: AppConfig.isDevelopment() ? err.message : undefined
    }
  };
  res.status(500).json(response);
}

/**
 * 404 handler for undefined routes
 */
export function notFoundHandler(_req: Request, res: Response): void {
  const response: ApiErrorDTO = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found'
    }
  };
  res.status(404).json(response);
}
