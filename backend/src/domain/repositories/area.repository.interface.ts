import { Area } from '../entities';

/**
 * Area Repository Interface
 * WHY: Defines contract for area data access operations
 * - Enables Dependency Inversion: business logic depends on abstractions, not implementations
 * - Allows easy testing by mocking the repository
 * - Decouples domain logic from database technology
 * - Makes it simple to switch databases or storage mechanisms
 */
export interface IAreaRepository {
  /**
   * Get all unique areas
   * WHY: Retrieve areas for filtering, display purposes in UI
   */
  findAll(): Promise<Area[]>;
  
  /**
   * Check if an area exists
   * WHY: Validate input before processing related entities
   */
  exists(areaName: string): Promise<boolean>;

  // ===== COMMENTED OUT CRUD OPERATIONS =====
  // WHY: Full CRUD implementation ready for use when needed
  // These methods provide complete data manipulation capabilities
  
  /*
  // CREATE OPERATION
  // WHY: Allow inserting new area records into the database
  // - Enables data population and growth
  // - Required for business data that wasn't pre-seeded
  // - Provides foundation for other entities to reference areas
  create(area: Omit<Area, 'id'>): Promise<Area>;

  // READ OPERATIONS
  // WHY: Retrieve data efficiently with multiple query patterns
  // - findById: Get specific area by unique identifier
  // - findByName: Look up by business name (common UI filter)
  // - findAll: Retrieve full dataset for listings/dropdowns
  findById(id: string): Promise<Area | undefined>;
  
  findByName(name: string): Promise<Area | undefined>;

  // UPDATE OPERATION
  // WHY: Modify existing records to reflect business changes
  // - Correct data entry mistakes
  // - Update area details when requirements change
  // - Maintain data accuracy over time
  update(id: string, area: Partial<Omit<Area, 'id'>>): Promise<Area | undefined>;

  // DELETE OPERATION
  // WHY: Remove records that are no longer needed
  // - Clean up obsolete areas
  // - Handle data deletion requests
  // - Manage database size and performance
  delete(id: string): Promise<boolean>;

  // BATCH OPERATIONS
  // WHY: Handle multiple records efficiently in single database call
  // - Reduces round-trips to database
  // - Improves performance for bulk operations
  // - Common in real-world scenarios (bulk import/export)
  createBatch(areas: Omit<Area, 'id'>[]): Promise<Area[]>;
  
  deleteByIds(ids: string[]): Promise<number>;
  */
}
