/**
 * Area Entity
 * WHY: Domain model representing a geographic area business concept
 * - Single source of truth for area data structure
 * - Language of the business (Ubiquitous Language from DDD)
 * - Independent from database or API concerns
 * - Can be reused across different parts of the application
 */
export interface Area {
  // Core Identity
  name: string;
  
  // ===== COMMENTED OUT EXTENDED PROPERTIES =====
  // WHY: Full domain model ready for expansion
  // These properties represent typical business requirements for areas
  
  /*
  // Unique identifier (database primary key)
  // WHY: Every entity must have a unique identity
  // - Enables tracking and referencing specific areas
  // - Primary mechanism for updates and deletes
  // - Prevents data duplication and confusion
  id: string;

  // Human-readable description
  // WHY: Provides context and meaning to users
  // - Helps distinguish similar area names
  // - Required for documentation and reporting
  // - Improves user experience in UIs
  description?: string;

  // Status tracking
  // WHY: Enable business logic for area lifecycle
  // - Active areas are currently in use
  // - Archived areas are historical but kept for reference
  // - Allows soft deletes instead of hard deletes
  status: 'active' | 'archived';

  // Geographic coordinates
  // WHY: Enable location-based features and mapping
  // - Proximity searches
  // - Map visualization
  // - Location analytics
  latitude?: number;
  longitude?: number;

  // Audit timestamps
  // WHY: Track data lineage and changes for compliance
  // - Know when area was created (creation audit)
  // - Know when last modified (change tracking)
  // - Support debugging and forensics
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;

  // Metadata
  // WHY: Support extensibility without database schema changes
  // - Store custom attributes per business need
  // - Enable third-party integrations
  // - Future-proof the entity
  tags?: string[];
  metadata?: Record<string, unknown>;
  */
}

/**
 * Create an Area entity from raw database row
 * WHY: Mapper function for infrastructure -> domain transformation
 * - Isolates domain model from database schema details
 * - Allows database schema to change without affecting business logic
 * - Single point of transformation logic (DRY principle)
 * - Type-safe conversion from database representation
 */
export function createArea(data: { area: string }): Area {
  return {
    name: data.area
  };
}

// ===== COMMENTED OUT FACTORY FUNCTIONS =====
// WHY: Centralized creation logic for different scenarios
// These functions encapsulate entity creation rules and validation

/*
// Create new area with all required fields
// WHY: Ensure new areas have all mandatory properties
// - Validation at creation time
// - Single place to add default values
// - Prevents partially initialized objects
export function createNewArea(input: {
  name: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  metadata?: Record<string, unknown>;
}): Area {
  // Validate required fields
  if (!input.name || input.name.trim().length === 0) {
    throw new Error('Area name is required and cannot be empty');
  }

  return {
    id: generateUUID(), // Would need uuid library
    name: input.name.trim(),
    description: input.description?.trim(),
    status: 'active',
    latitude: input.latitude,
    longitude: input.longitude,
    metadata: input.metadata,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

// Update existing area with partial changes
// WHY: Merge new data with existing while preserving audit trail
// - Preserve immutable fields like createdAt, id
// - Update audit timestamps
// - Support partial updates (don't require all fields)
export function updateArea(
  existing: Area,
  updates: Partial<Omit<Area, 'id' | 'createdAt' | 'createdBy'>>
): Area {
  return {
    ...existing,
    ...updates,
    updatedAt: new Date()
  };
}

// Soft delete: mark as archived instead of removing
// WHY: Preserve historical data while hiding from active use
// - Supports audit and compliance requirements
// - Allows "undelete" if mistake was made
// - Maintains referential integrity
export function archiveArea(area: Area): Area {
  return {
    ...area,
    status: 'archived',
    updatedAt: new Date()
  };
}
*/
