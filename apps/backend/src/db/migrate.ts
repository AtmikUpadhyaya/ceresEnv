import fs from 'node:fs/promises';
import path from 'node:path';
import { closePool, pool } from './pool.js';

const migrationDirectory = path.resolve(
  new URL('./migrations', import.meta.url).pathname,
);

async function migrate(): Promise<void> {
  const migrationFiles = (await fs.readdir(migrationDirectory))
    .filter((file) => file.endsWith('.sql'))
    .sort();
  for (const migrationFile of migrationFiles) {
    const sql = await fs.readFile(
      path.join(migrationDirectory, migrationFile),
      'utf8',
    );
    await pool.query(sql);
    console.log(`Applied ${migrationFile}`);
  }
  console.log('Database migrations completed successfully.');
}

migrate()
  .catch((error) => {
    console.error('Database migration failed:', error);
    process.exitCode = 1;
  })
  .finally(closePool);
