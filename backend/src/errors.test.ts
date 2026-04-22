import { ApiException, ErrorCode } from './errors';

describe('Errors Module', () => {
  describe('ApiException', () => {
    it('should create an ApiException with all properties', () => {
      const exception = new ApiException(
        400,
        ErrorCode.VALIDATION_ERROR,
        'Validation failed',
        'Field X is required'
      );

      expect(exception.statusCode).toBe(400);
      expect(exception.errorCode).toBe('VALIDATION_ERROR');
      expect(exception.message).toBe('Validation failed');
      expect(exception.details).toBe('Field X is required');
      expect(exception.name).toBe('ApiException');
    });

    it('should create an ApiException without details', () => {
      const exception = new ApiException(
        404,
        ErrorCode.AREA_NOT_FOUND,
        'Area not found'
      );

      expect(exception.statusCode).toBe(404);
      expect(exception.errorCode).toBe('AREA_NOT_FOUND');
      expect(exception.message).toBe('Area not found');
      expect(exception.details).toBeUndefined();
    });

    it('should inherit from Error', () => {
      const exception = new ApiException(500, ErrorCode.INTERNAL_ERROR, 'Internal error');
      expect(exception instanceof Error).toBe(true);
    });
  });

  describe('ErrorCode enum', () => {
    it('should have all expected error codes', () => {
      expect(ErrorCode.INVALID_PAGINATION).toBe('INVALID_PAGINATION');
      expect(ErrorCode.AREA_NOT_FOUND).toBe('AREA_NOT_FOUND');
      expect(ErrorCode.NO_PROJECTS_FOUND).toBe('NO_PROJECTS_FOUND');
      expect(ErrorCode.DATABASE_ERROR).toBe('DATABASE_ERROR');
      expect(ErrorCode.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
      expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
    });
  });
});
