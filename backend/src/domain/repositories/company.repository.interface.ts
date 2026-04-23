import { Company } from '../entities';

/**
 * Company Repository Interface
 * Defines contract for company data access (Dependency Inversion)
 */
export interface ICompanyRepository {
  /**
   * Get all companies
   */
  findAll(): Promise<Company[]>;
}
