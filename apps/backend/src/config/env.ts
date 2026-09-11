import fs from 'node:fs';
import path from 'node:path';

const envFile = path.resolve(new URL('../../.env', import.meta.url).pathname);

if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const separator = trimmed.indexOf('=');
    if (separator === -1) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed
      .slice(separator + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    `DATABASE_URL is missing. Add it to ${envFile} before starting the backend.`,
  );
}
if (!process.env.JWT_SECRET) {
  throw new Error(
    `JWT_SECRET is missing. Add it to ${envFile} before starting the backend.`,
  );
}

export const env = {
  port: Number(process.env.PORT || 4100),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  frontendUrl: process.env.FRONTEND_URL || '',
};
