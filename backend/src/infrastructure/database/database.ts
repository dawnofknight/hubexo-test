import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';
import { AppConfig } from '../../config/app.config';

/**
 * Database Connection Manager
 * Singleton pattern for SQLite database access
 */
class DatabaseConnection {
  private db: SqlJsDatabase | null = null;
  private initPromise: Promise<SqlJsDatabase> | null = null;

  private getDatabasePath(): string {
    if (AppConfig.dbPath) {
      return AppConfig.dbPath;
    }

    const possiblePaths = [
      path.resolve(__dirname, '../../../glenigan_takehome FS.db'),
      path.resolve(process.cwd(), 'glenigan_takehome FS.db'),
    ];

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        return p;
      }
    }

    return possiblePaths[0];
  }

  async getConnection(): Promise<SqlJsDatabase> {
    if (this.db) {
      return this.db;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.initialize();
    return this.initPromise;
  }

  private async initialize(): Promise<SqlJsDatabase> {
    const dbPath = this.getDatabasePath();
    
    try {
      const SQL = await initSqlJs();
      const fileBuffer = fs.readFileSync(dbPath);
      this.db = new SQL.Database(fileBuffer);
      console.log(`Database loaded from: ${dbPath}`);
      return this.db;
    } catch (error) {
      throw new Error(`Failed to connect to database at ${dbPath}: ${(error as Error).message}`);
    }
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
    }
  }

  async isReady(): Promise<boolean> {
    try {
      const db = await this.getConnection();
      db.exec('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}

// Singleton instance
export const databaseConnection = new DatabaseConnection();

/**
 * Execute a query and return results as an array of objects
 */
export function queryAll<T>(db: SqlJsDatabase, sql: string, params: (string | number)[] = []): T[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);

  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();

  return results;
}

/**
 * Execute a query and return the first result
 */
export function queryOne<T>(db: SqlJsDatabase, sql: string, params: (string | number)[] = []): T | undefined {
  const results = queryAll<T>(db, sql, params);
  return results[0];
}
