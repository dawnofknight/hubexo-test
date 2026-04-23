import { Request, Response, NextFunction } from 'express';
import { AppConfig } from '../../config/app.config';
import { ApiException, ErrorCode } from './error.middleware';

/**
 * Validate pagination parameters
 */
export function validatePagination(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const { page, per_page } = req.query;

  if (page !== undefined || per_page !== undefined) {
    if (page !== undefined) {
      const pageNum = parseInt(page as string, 10);
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
      const perPageNum = parseInt(per_page as string, 10);
      if (isNaN(perPageNum) || perPageNum < 1 || perPageNum > AppConfig.maxPerPage) {
        throw new ApiException(
          400,
          ErrorCode.INVALID_PAGINATION,
          'Invalid per_page parameter',
          `per_page must be between 1 and ${AppConfig.maxPerPage}`
        );
      }
    }
  }

  next();
}

/**
 * Validate keyword parameter
 */
export function validateKeyword(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const { keyword } = req.query;

  if (keyword && typeof keyword === 'string') {
    if (keyword.length > AppConfig.maxKeywordLength) {
      throw new ApiException(
        400,
        ErrorCode.VALIDATION_ERROR,
        'Keyword too long',
        `Keyword must be at most ${AppConfig.maxKeywordLength} characters`
      );
    }
  }

  next();
}

/**
 * Request logging middleware
 */
export function requestLogger(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
}
