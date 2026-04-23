/**
 * Area Entity
 * Domain model representing a geographic area
 */
export interface Area {
  name: string;
}

/**
 * Create an Area entity from raw database row
 */
export function createArea(data: { area: string }): Area {
  return {
    name: data.area
  };
}
