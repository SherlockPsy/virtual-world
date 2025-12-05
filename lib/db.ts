import { Pool } from 'pg';

// Direct connection to Railway Postgres
// SSL disabled as per requirements
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:culKgySCXNOkKtYkPMRKqfweqYefvtTx@switchback.proxy.rlwy.net:59914/railway',
  ssl: false
});

export async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

export async function queryOne<T>(text: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows.length > 0 ? rows[0] : null;
}

export { pool };
