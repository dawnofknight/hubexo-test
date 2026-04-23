/**
 * Base Domain Exception
 */
export class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainException';
  }
}

/**
 * Entity not found exception
 */
export class NotFoundException extends DomainException {
  public readonly entityName: string;
  public readonly identifier: string;
  
  constructor(entityName: string, identifier: string) {
    super(`${entityName} not found: ${identifier}`);
    this.name = 'NotFoundException';
    this.entityName = entityName;
    this.identifier = identifier;
  }
}

/**
 * Validation exception for domain rules
 */
export class ValidationException extends DomainException {
  public readonly field: string;
  public readonly reason: string;
  
  constructor(field: string, reason: string) {
    super(`Validation failed for ${field}: ${reason}`);
    this.name = 'ValidationException';
    this.field = field;
    this.reason = reason;
  }
}
