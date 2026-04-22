import { Request, Response, NextFunction } from 'express';
import { ApiError } from './types';

/**
 * Custom error class for API errors
 */
export class ApiException extends Error {
  public statusCode: number;
  public errorCode: string;
  public details?: string;

  constructor(statusCode: number, errorCode: string, message: string, details?: string) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.name = 'ApiException';
  }
}

/**
 * Error codes enum for consistent error responses
 */
export enum ErrorCode {
  INVALID_PAGINATION = 'INVALID_PAGINATION',
  AREA_NOT_FOUND = 'AREA_NOT_FOUND',
  NO_PROJECTS_FOUND = 'NO_PROJECTS_FOUND',
  DATABASE_ERROR = 'DATABASE_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
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

  if (err instanceof ApiException) {
    const response: ApiError = {
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

  // Handle SQLite/database errors
  if (err.message?.includes('SQLITE') || err.message?.includes('database')) {
    const response: ApiError = {
      success: false,
      error: {
        code: ErrorCode.DATABASE_ERROR,
        message: 'Database error occurred',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
      }
    };
    res.status(500).json(response);
    return;
  }

  // Generic internal error
  const response: ApiError = {
    success: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }
  };
  res.status(500).json(response);
}

/**
 * 404 handler for undefined routes
 */
export function notFoundHandler(_req: Request, res: Response): void {
  const response: ApiError = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found'
    }
  };
  res.status(404).json(response);
}
