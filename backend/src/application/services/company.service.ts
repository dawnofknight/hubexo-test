import { ICompanyRepository } from '../../domain/repositories';
import { CompanyDTO } from '../dtos';

/**
 * Company Application Service
 * Orchestrates company-related use cases (Single Responsibility)
 */
export class CompanyService {
  constructor(private readonly companyRepository: ICompanyRepository) {}

  /**
   * Get all companies
   */
  async getAllCompanies(): Promise<CompanyDTO[]> {
    const companies = await this.companyRepository.findAll();
    return companies.map(c => ({
      company_id: c.companyId,
      company_name: c.companyName
    }));
  }
}
