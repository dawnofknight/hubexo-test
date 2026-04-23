import { IAreaRepository } from '../../domain/repositories';
import { Area, createArea } from '../../domain/entities';
import { databaseConnection, queryAll, queryOne } from '../database';

/**
 * SQLite implementation of Area Repository
 * Implements IAreaRepository (Liskov Substitution)
 */
export class AreaRepository implements IAreaRepository {
  
  async findAll(): Promise<Area[]> {
    const db = await databaseConnection.getConnection();
    const rows = queryAll<{ area: string }>(
      db,
      'SELECT DISTINCT area FROM project_area_map ORDER BY area'
    );
    return rows.map(createArea);
  }

  async exists(areaName: string): Promise<boolean> {
    const db = await databaseConnection.getConnection();
    const result = queryOne<{ cnt: number }>(
      db,
      'SELECT 1 as cnt FROM project_area_map WHERE area = ? LIMIT 1',
      [areaName]
    );
    return result !== undefined;
  }
}
