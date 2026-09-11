import { User } from '@fieldready/shared';
import { pool } from '../db/pool.js';

interface UserRow {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: User['role'];
}
export async function findByEmail(email: string): Promise<UserRow | null> {
  const result = await pool.query<UserRow>(
    'SELECT id,name,email,password_hash,role FROM users WHERE email=$1',
    [email],
  );
  return result.rows[0] || null;
}
export async function createUser(
  name: string,
  email: string,
  passwordHash: string,
  ipAddress: string,
): Promise<User | null> {
  const result = await pool.query<User>(
    `WITH allowed_ip AS (
      INSERT INTO registration_ip_limits (ip_address, account_count)
      VALUES ($4::inet, 1)
      ON CONFLICT (ip_address) DO UPDATE
        SET account_count = registration_ip_limits.account_count + 1,
            updated_at = NOW()
        WHERE registration_ip_limits.account_count < 20
      RETURNING ip_address
    )
    INSERT INTO users (name, email, password_hash)
    SELECT $1, $2, $3 FROM allowed_ip
    RETURNING id, name, email, role`,
    [name, email, passwordHash, ipAddress],
  );
  return result.rows[0] || null;
}
