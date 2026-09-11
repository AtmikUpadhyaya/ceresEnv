import pg from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;
export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.databaseUrl.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : undefined,
});
export async function closePool(): Promise<void> {
  await pool.end();
}
