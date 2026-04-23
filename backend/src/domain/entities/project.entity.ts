/**
 * Project Entity
 * Domain model representing a construction project
 */
export interface Project {
  projectId?: string;
  projectName: string;
  projectStart: string;
  projectEnd: string;
  company: string;
  description: string | null;
  projectValue: number;
  area: string;
}

/**
 * Create a Project entity from raw database row
 */
export function createProject(data: {
  project_id?: string;
  project_name: string;
  project_start: string;
  project_end: string;
  company_name: string;
  description: string | null;
  project_value: number;
  area: string;
}): Project {
  return {
    projectId: data.project_id,
    projectName: data.project_name,
    projectStart: data.project_start,
    projectEnd: data.project_end,
    company: data.company_name,
    description: data.description,
    projectValue: data.project_value,
    area: data.area
  };
}
