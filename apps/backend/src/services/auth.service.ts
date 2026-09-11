import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '@fieldready/shared';
import { env } from '../config/env.js';
import * as users from '../repositories/user.repository.js';

export class AuthError extends Error {}
export async function register(
  name: string,
  email: string,
  password: string,
  ipAddress: string,
) {
  const existing = await users.findByEmail(email);
  if (existing)
    throw new AuthError('An account with this email already exists');
  const user = await users.createUser(
    name,
    email,
    await bcrypt.hash(password, 12),
    ipAddress,
  );
  if (!user)
    throw new AuthError(
      'This IP address has reached the 20-account registration limit',
    );
  return issueToken(user);
}
export async function login(email: string, password: string) {
  const record = await users.findByEmail(email);
  if (!record || !(await bcrypt.compare(password, record.password_hash)))
    throw new AuthError('Invalid email or password');
  return issueToken({
    id: record.id,
    name: record.name,
    email: record.email,
    role: record.role,
  });
}
function issueToken(user: User) {
  return { token: jwt.sign(user, env.jwtSecret, { expiresIn: '8h' }), user };
}
