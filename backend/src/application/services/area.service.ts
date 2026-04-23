import { IAreaRepository } from '../../domain/repositories';
import { NotFoundException } from '../../domain/exceptions';

/**
 * Area Application Service
 * Orchestrates area-related use cases (Single Responsibility)
 */
export class AreaService {
  constructor(private readonly areaRepository: IAreaRepository) {}

  /**
   * Get all areas
   */
  async getAllAreas(): Promise<string[]> {
    const areas = await this.areaRepository.findAll();
    return areas.map(a => a.name);
  }

  /**
   * Validate that an area exists
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
   */
  async areaExists(areaName: string): Promise<boolean> {
    return this.areaRepository.exists(areaName);
  }
}
