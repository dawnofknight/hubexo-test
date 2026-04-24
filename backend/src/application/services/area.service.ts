import { IAreaRepository } from '../../domain/repositories';
import { Area } from '../../domain/entities';
import { NotFoundException } from '../../domain/exceptions';

/**
 * Area Application Service
 * WHY: Orchestrates area-related use cases (application business rules)
 * - Single Responsibility: handles only area use cases
 * - Sits between presentation (HTTP) and domain (business logic)
 * - Implements "application business rules" (Cross-cutting concerns)
 * - Examples: logging, transaction management, caching
 * - Does NOT contain core business logic (that's in entities)
 * - Does NOT know about databases or HTTP (that's in infrastructure/presentation)
 */
export class AreaService {
  constructor(private readonly areaRepository: IAreaRepository) {}

  /**
   * Get all areas
   * WHY: Application use case for listing/filtering areas in UI
   */
  async getAllAreas(): Promise<string[]> {
    const areas = await this.areaRepository.findAll();
    return areas.map(a => a.name);
  }

  /**
   * Validate that an area exists
   * WHY: Cross-cutting validation before processing related entities
   * @throws NotFoundException if area doesn't exist
   */
  async validateAreaExists(areaName: string): Promise<void> {
    const exists = await this.areaRepository.exists(areaName);
    if (!exists) {
      throw new NotFoundException('Area', areaName);
    }
  }

  /**
   * Check if area exists (without throwing)
   * WHY: Soft validation for conditional business logic
   */
  async areaExists(areaName: string): Promise<boolean> {
    return this.areaRepository.exists(areaName);
  }

  // ===== COMMENTED OUT CRUD APPLICATION OPERATIONS =====
  // WHY: Complete CRUD service implementation for all area management use cases
  // These operations orchestrate repository calls and handle application-level concerns

  /*
  // CREATE USE CASE
  // WHY: Application logic for creating new area
  // - Validates input data
  // - Checks for duplicates
  // - Triggers domain events if needed
  // - Handles transaction management
  // - Logs for audit trail
  async createArea(input: { name: string; description?: string }): Promise<Area> {
    // WHY: Check duplicate name before creating
    // - Prevents data duplication
    // - Provides better error message to user
    // - Improves database constraint performance
    const existing = await this.areaRepository.findByName(input.name);
    if (existing) {
      throw new Error(`Area "${input.name}" already exists`);
    }

    // WHY: Use factory function to create entity with validation
    // - Ensures entity is properly initialized
    // - Single place for entity creation rules
    // - May throw if input is invalid
    const area = createNewArea({
      name: input.name,
      description: input.description
    });

    // WHY: Persist to database through repository
    // - Repository handles SQL details
    // - Service doesn't know HOW to save, only WHAT to save
    const created = await this.areaRepository.create(area);

    // WHY: Could log audit event or trigger domain event here
    // this.logger.info(`Area created: ${created.id}`);
    // this.eventBus.publish(new AreaCreatedEvent(created));

    return created;
  }

  // READ USE CASES
  // WHY: Different read patterns for different business needs

  // Get area by ID for editing or display
  // WHY: Retrieve specific area details
  // - Used in edit forms, detail pages
  // - Required for PUT/PATCH operations
  // - Could cache this result for performance
  async getAreaById(id: string): Promise<Area> {
    const area = await this.areaRepository.findById(id);
    if (!area) {
      throw new NotFoundException('Area', id);
    }
    return area;
  }

  // Get area by name for lookups
  // WHY: Find area using natural business identifier
  // - Users search by name, not ID
  // - Validation logic uses names
  // - API might accept name as parameter
  async getAreaByName(name: string): Promise<Area> {
    const area = await this.areaRepository.findByName(name);
    if (!area) {
      throw new NotFoundException('Area', name);
    }
    return area;
  }

  // Get all areas with optional filtering
  // WHY: Support different listing scenarios
  // - Admin: show all including archived
  // - Users: show only active areas
  // - Reports: show with specific criteria
  async getAllAreasWithFilter(options?: {
    onlyActive?: boolean;
    search?: string;
  }): Promise<Area[]> {
    let areas = await this.areaRepository.findAll();

    // WHY: Filter for active areas only (business rule)
    if (options?.onlyActive) {
      areas = areas.filter(a => a.status === 'active');
    }

    // WHY: Search filtering (business rule)
    if (options?.search) {
      const searchLower = options.search.toLowerCase();
      areas = areas.filter(a => 
        a.name.toLowerCase().includes(searchLower) ||
        a.description?.toLowerCase().includes(searchLower)
      );
    }

    return areas;
  }

  // UPDATE USE CASE
  // WHY: Application logic for modifying existing area
  // - Validates that area exists
  // - Checks for constraint violations (e.g., duplicate names)
  // - Updates audit timestamps
  // - Could invalidate caches
  async updateArea(
    id: string,
    updates: Partial<Omit<Area, 'id' | 'createdAt'>>
  ): Promise<Area> {
    // WHY: Verify area exists before updating
    // - Provides clear error if area not found
    // - Prevents subtle bugs from null references
    const existing = await this.getAreaById(id);

    // WHY: Check if new name creates duplicate
    if (updates.name && updates.name !== existing.name) {
      const duplicate = await this.areaRepository.findByName(updates.name);
      if (duplicate && duplicate.id !== id) {
        throw new Error(`Area name "${updates.name}" is already in use`);
      }
    }

    // WHY: Apply updates through repository
    const updated = await this.areaRepository.update(id, updates);
    
    if (!updated) {
      throw new Error('Failed to update area');
    }

    // WHY: Could log or publish event here
    // this.logger.info(`Area updated: ${id}`);
    // this.eventBus.publish(new AreaUpdatedEvent(updated));

    return updated;
  }

  // DELETE USE CASE
  // WHY: Application logic for removing area
  // - Checks if area has dependencies
  // - Chooses soft delete (archive) for safety
  // - Logs deletion for audit
  // - May need approval workflow for critical data
  async deleteArea(id: string): Promise<void> {
    // WHY: Verify area exists
    const area = await this.getAreaById(id);

    // WHY: Check for active dependencies
    // - Prevents orphaned data
    // - Enforces referential integrity at app level
    const hasReferences = await this.areaRepository.hasActiveReferences(id);
    if (hasReferences) {
      throw new Error(
        'Cannot delete area with active projects. Archive it instead.'
      );
    }

    // WHY: Delete through repository (soft delete)
    const success = await this.areaRepository.delete(id);
    if (!success) {
      throw new Error('Failed to delete area');
    }

    // WHY: Log deletion for compliance
    // this.logger.warn(`Area deleted by ${currentUser}: ${id}`);
    // this.eventBus.publish(new AreaDeletedEvent(area));
  }

  // BULK OPERATIONS
  // WHY: Efficient handling of multiple records
  // - Import multiple areas from CSV/Excel
  // - Performance-critical for large datasets
  // - Maintains data consistency with transactions

  // Bulk create with duplicate checking
  // WHY: Import many areas while preventing duplicates
  async createBulkAreas(inputs: Array<{ name: string; description?: string }>): Promise<{
    created: Area[];
    skipped: Array<{ name: string; reason: string }>;
  }> {
    const created: Area[] = [];
    const skipped: Array<{ name: string; reason: string }> = [];
    const existingNames = new Set(
      (await this.areaRepository.findAll()).map(a => a.name.toLowerCase())
    );

    for (const input of inputs) {
      if (existingNames.has(input.name.toLowerCase())) {
        skipped.push({ name: input.name, reason: 'Duplicate name' });
        continue;
      }

      try {
        const area = await this.createArea(input);
        created.push(area);
        existingNames.add(area.name.toLowerCase());
      } catch (error) {
        skipped.push({ 
          name: input.name, 
          reason: (error as Error).message 
        });
      }
    }

    return { created, skipped };
  }

  // Bulk delete by IDs
  // WHY: Remove multiple areas efficiently
  async deleteBulkAreas(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;

    // WHY: Validate all exist before attempting deletion
    for (const id of ids) {
      await this.getAreaById(id);
    }

    // WHY: Delete through repository in single call
    return this.areaRepository.deleteByIds(ids);
  }

  // Stats/Analytics
  // WHY: Business intelligence operations

  // Get area statistics
  // WHY: Dashboard metrics and reporting
  async getAreaStats(): Promise<{
    total: number;
    active: number;
    archived: number;
  }> {
    const areas = await this.areaRepository.findAll();

    return {
      total: areas.length,
      active: areas.filter(a => a.status === 'active').length,
      archived: areas.filter(a => a.status === 'archived').length
    };
  }
  */
}
