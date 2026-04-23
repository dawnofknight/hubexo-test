import { NotFoundException, ValidationException, DomainException } from '../domain/exceptions';
import { ApiException, ErrorCode } from '../presentation/middlewares';

describe('Domain Exceptions', () => {
  describe('DomainException', () => {
    it('should create with message', () => {
      const exception = new DomainException('Test error');
      expect(exception.message).toBe('Test error');
      expect(exception.name).toBe('DomainException');
    });
  });

  describe('NotFoundException', () => {
    it('should create with entity name and identifier', () => {
      const exception = new NotFoundException('Project', '123');
      expect(exception.entityName).toBe('Project');
      expect(exception.identifier).toBe('123');
      expect(exception.message).toBe('Project not found: 123');
      expect(exception.name).toBe('NotFoundException');
    });
  });

  describe('ValidationException', () => {
    it('should create with field and reason', () => {
      const exception = new ValidationException('page', 'must be positive');
      expect(exception.field).toBe('page');
      expect(exception.reason).toBe('must be positive');
      expect(exception.name).toBe('ValidationException');
    });
  });
});

describe('API Exceptions', () => {
  describe('ApiException', () => {
    it('should create with all properties', () => {
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
    });
  });

  describe('ErrorCode enum', () => {
    it('should have all expected error codes', () => {
      expect(ErrorCode.INVALID_PAGINATION).toBe('INVALID_PAGINATION');
      expect(ErrorCode.AREA_NOT_FOUND).toBe('AREA_NOT_FOUND');
      expect(ErrorCode.PROJECT_NOT_FOUND).toBe('PROJECT_NOT_FOUND');
      expect(ErrorCode.DATABASE_ERROR).toBe('DATABASE_ERROR');
      expect(ErrorCode.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
      expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ErrorCode.RATE_LIMITED).toBe('RATE_LIMITED');
    });
  });
});
