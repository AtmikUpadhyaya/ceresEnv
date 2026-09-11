import { User } from '@fieldready/shared';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4100/api';
const TOKEN_KEY = 'fieldready-auth-token';
const USER_KEY = 'fieldready-auth-user';

export async function login(email: string, password: string): Promise<User> {
  const response = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message || 'Unable to sign in');
  localStorage.setItem(TOKEN_KEY, payload.data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(payload.data.user));
  return payload.data.user;
}
export async function register(
  name: string,
  email: string,
  password: string,
): Promise<User> {
  const response = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message || 'Unable to register');
  localStorage.setItem(TOKEN_KEY, payload.data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(payload.data.user));
  return payload.data.user;
}
export const getToken = () => localStorage.getItem(TOKEN_KEY) || '';
export const readUser = (): User | null =>
  JSON.parse(localStorage.getItem(USER_KEY) || 'null');
export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};
