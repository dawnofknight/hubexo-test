import { Area } from '../entities';

/**
 * Area Repository Interface
 * Defines contract for area data access (Dependency Inversion)
 */
export interface IAreaRepository {
  /**
   * Get all unique areas
   */
  findAll(): Promise<Area[]>;
  
  /**
   * Check if an area exists
   */
  exists(areaName: string): Promise<boolean>;
}
