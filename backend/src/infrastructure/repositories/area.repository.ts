import { IAreaRepository } from '../../domain/repositories';
import { Area, createArea } from '../../domain/entities';
import { databaseConnection, queryAll, queryOne } from '../database';

/**
 * SQLite implementation of Area Repository
 * WHY: Concrete implementation of IAreaRepository for SQLite database
 * - Implements interface contract (Liskov Substitution Principle)
 * - Encapsulates database-specific SQL logic
 * - Can be swapped for PostgreSQL, MongoDB, etc. without affecting business logic
 * - Keeps database concerns out of domain and application layers
 */
export class AreaRepository implements IAreaRepository {
  
  /**
   * Retrieve all distinct areas from database
   * WHY: Get complete list for dropdowns, filters, or reporting
   */
  async findAll(): Promise<Area[]> {
    const db = await databaseConnection.getConnection();
    const rows = queryAll<{ area: string }>(
      db,
      'SELECT DISTINCT area FROM project_area_map ORDER BY area'
    );
    return rows.map(createArea);
  }

  /**
   * Check if specific area exists in database
   * WHY: Validate before creating references to prevent orphaned data
   */
  async exists(areaName: string): Promise<boolean> {
    const db = await databaseConnection.getConnection();
    const result = queryOne<{ cnt: number }>(
      db,
      'SELECT 1 as cnt FROM project_area_map WHERE area = ? LIMIT 1',
      [areaName]
    );
    return result !== undefined;
  }

  // ===== COMMENTED OUT CRUD OPERATIONS =====
  // WHY: Full CRUD implementation demonstrating all database operations
  // These show how to implement each database interaction pattern

  /*
  // CREATE: Insert new area record
  // WHY: Add new area to database with complete data
  // - Persists new business data
  // - Assigns unique identifier
  // - Records audit timestamps
  async create(area: Omit<Area, 'id'>): Promise<Area> {
    const db = await databaseConnection.getConnection();
    const id = generateUUID(); // Would need uuid library
    
    // Insert into area table (would need to exist)
    db.run(
      `INSERT INTO areas (id, name, description, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, area.name, area.description, area.status, new Date(), new Date()]
    );

    // Return the created entity with database-assigned values
    return { id, ...area, createdAt: new Date(), updatedAt: new Date() };
  }

  // READ: Get area by unique identifier
  // WHY: Retrieve specific area for editing, viewing details, or reference
  // - Used in edit forms and detail pages
  // - Required for relationship lookups
  // - Efficient indexed query on primary key
  async findById(id: string): Promise<Area | undefined> {
    const db = await databaseConnection.getConnection();
    const row = queryOne<any>(
      db,
      'SELECT * FROM areas WHERE id = ? LIMIT 1',
      [id]
    );
    
    if (!row) return undefined;
    
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  // READ: Get area by business name
  // WHY: Find area using natural identifier (name) instead of id
  // - Common in forms where users search by name
  // - Supports business logic validation
  // - Alternative query pattern for flexibility
  async findByName(name: string): Promise<Area | undefined> {
    const db = await databaseConnection.getConnection();
    const row = queryOne<any>(
      db,
      'SELECT * FROM areas WHERE LOWER(name) = LOWER(?) LIMIT 1',
      [name]
    );
    
    return row ? this.mapRowToArea(row) : undefined;
  }

  // UPDATE: Modify existing area record
  // WHY: Change area data while maintaining referential integrity
  // - Updates only specified fields (partial update)
  // - Preserves creation audit trail (createdAt, createdBy)
  // - Updates modification audit trail (updatedAt)
  // - Uses prepared statements for SQL injection safety
  async update(id: string, updates: Partial<Omit<Area, 'id'>>): Promise<Area | undefined> {
    const db = await databaseConnection.getConnection();
    
    // Build dynamic update clause (only update provided fields)
    const fields: string[] = [];
    const values: any[] = [];
    
    if (updates.name !== undefined) {
      fields.push('name = ?');
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }

    // Always update modification timestamp
    fields.push('updated_at = ?');
    values.push(new Date());
    
    // Add id to where clause
    values.push(id);

    if (fields.length === 1) {
      // Only timestamp was updated, no real changes
      return this.findById(id);
    }

    // Execute update
    db.run(
      `UPDATE areas SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    // Return updated entity
    return this.findById(id);
  }

  // DELETE: Remove area record
  // WHY: Delete obsolete or erroneous data
  // - Frees up database resources
  // - Removes incorrect entries
  // - Should validate no active references exist
  // - Note: Consider soft delete (archive) for audit trail
  async delete(id: string): Promise<boolean> {
    const db = await databaseConnection.getConnection();
    
    // Check if area has references (prevent orphaned data)
    const references = queryOne<{ cnt: number }>(
      db,
      'SELECT COUNT(*) as cnt FROM project_area_map WHERE area_id = ?',
      [id]
    );

    if (references && references.cnt > 0) {
      throw new Error(
        'Cannot delete area with active references. ' +
        'Consider archiving instead.'
      );
    }

    // Execute soft delete (safer than hard delete)
    const result = db.run(
      'UPDATE areas SET status = ?, updated_at = ? WHERE id = ?',
      ['archived', new Date(), id]
    );

    return result.changes > 0;
  }

  // BATCH CREATE: Insert multiple areas efficiently
  // WHY: Handle bulk operations in single transaction
  // - Reduces database round-trips significantly
  // - Improves performance for imports (10x+ faster than loop)
  // - Maintains data consistency with transaction
  // - Common in: data migrations, bulk uploads, seed scripts
  async createBatch(areas: Omit<Area, 'id'>[]): Promise<Area[]> {
    const db = await databaseConnection.getConnection();
    
    // Start transaction for atomicity (all-or-nothing)
    db.exec('BEGIN TRANSACTION');
    
    try {
      const created: Area[] = [];
      
      for (const area of areas) {
        const id = generateUUID();
        db.run(
          `INSERT INTO areas (id, name, description, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [id, area.name, area.description, area.status, new Date(), new Date()]
        );
        
        created.push({ id, ...area, createdAt: new Date(), updatedAt: new Date() });
      }
      
      db.exec('COMMIT');
      return created;
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }

  // BATCH DELETE: Remove multiple areas
  // WHY: Delete related areas efficiently
  // - Single database call instead of many
  // - More performant for cleanup operations
  // - Example: delete areas from selected list
  async deleteByIds(ids: string[]): Promise<number> {
    const db = await databaseConnection.getConnection();
    
    if (ids.length === 0) return 0;
    
    // Build placeholders for SQL IN clause
    const placeholders = ids.map(() => '?').join(',');
    
    // Execute batch delete
    const result = db.run(
      `UPDATE areas SET status = ?, updated_at = ? WHERE id IN (${placeholders})`,
      ['archived', new Date(), ...ids]
    );

    return result.changes;
  }

  // HELPER: Map database row to domain Area object
  // WHY: Encapsulate database schema to domain model transformation
  // - Single responsibility (conversion logic in one place)
  // - Allows database columns to differ from entity properties
  // - Reused by multiple methods (DRY principle)
  // - Easy to maintain if database schema changes
  private mapRowToArea(row: any): Area {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by,
      updatedBy: row.updated_by
    };
  }
  */
}
