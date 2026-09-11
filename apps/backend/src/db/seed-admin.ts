import bcrypt from 'bcryptjs';
import { closePool, pool } from './pool.js';

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME || 'FieldReady Admin';

if (!email || !password)
  throw new Error(
    'Set ADMIN_EMAIL and ADMIN_PASSWORD before seeding an admin.',
  );

try {
  const passwordHash = await bcrypt.hash(password, 12);
  await pool.query(
    `INSERT INTO users (name,email,password_hash,role) VALUES ($1,$2,$3,'admin') ON CONFLICT (email) DO UPDATE SET name=EXCLUDED.name,password_hash=EXCLUDED.password_hash,role='admin'`,
    [name, email.toLowerCase(), passwordHash],
  );
  console.log(`Admin account ready for ${email.toLowerCase()}.`);
} finally {
  await closePool();
}
