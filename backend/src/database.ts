import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';

// Database path - check multiple locations
function getDatabasePath(): string {
  if (process.env.DB_PATH) {
    return process.env.DB_PATH;
  }
  
  const possiblePaths = [
    path.resolve(__dirname, '../../glenigan_takehome FS.db'),
    path.resolve(process.cwd(), 'glenigan_takehome FS.db'),
  ];
  
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  
  return possiblePaths[0]; // Default to first path
}

const DB_PATH = getDatabasePath();

let db: SqlJsDatabase | null = null;
let initPromise: Promise<SqlJsDatabase> | null = null;

/**
 * Initialize and get database connection (singleton pattern)
 */
export async function getDatabase(): Promise<SqlJsDatabase> {
  if (db) {
    return db;
  }
  
  if (initPromise) {
    return initPromise;
  }
  
  initPromise = (async () => {
    try {
      const SQL = await initSqlJs();
      const fileBuffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(fileBuffer);
      console.log(`Database loaded from: ${DB_PATH}`);
      return db;
    } catch (error) {
      throw new Error(`Failed to connect to database at ${DB_PATH}: ${(error as Error).message}`);
    }
  })();
  
  return initPromise;
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    initPromise = null;
  }
}

/**
 * Check if database is accessible
 */
export async function isDatabaseReady(): Promise<boolean> {
  try {
    const database = await getDatabase();
    database.exec('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

/**
 * Execute a query and return results as an array of objects
 */
export function queryAll<T>(db: SqlJsDatabase, sql: string, params: (string | number)[] = []): T[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  
  const results: T[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject() as T;
    results.push(row);
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
