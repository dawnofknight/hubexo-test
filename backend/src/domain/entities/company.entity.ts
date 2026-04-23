/**
 * Company Entity
 * Domain model representing a construction company
 */
export interface Company {
  companyId: string;
  companyName: string;
}

/**
 * Create a Company entity from raw database row
 */
export function createCompany(data: {
  company_id: string;
  company_name: string;
}): Company {
  return {
    companyId: data.company_id,
    companyName: data.company_name
  };
}
