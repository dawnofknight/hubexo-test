import { ICompanyRepository } from '../../domain/repositories';
import { Company, createCompany } from '../../domain/entities';
import { databaseConnection, queryAll } from '../database';

/**
 * SQLite implementation of Company Repository
 * Implements ICompanyRepository (Liskov Substitution)
 */
export class CompanyRepository implements ICompanyRepository {
  
  async findAll(): Promise<Company[]> {
    const db = await databaseConnection.getConnection();
    const rows = queryAll<{ company_id: string; company_name: string }>(
      db,
      'SELECT company_id, company_name FROM companies ORDER BY company_name'
    );
    return rows.map(createCompany);
  }
}
