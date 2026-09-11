import { FormEvent, useState } from 'react';
import { User } from '@fieldready/shared';
import { login, register } from '../api/auth';

interface AuthScreenProps {
  onAuthenticated: (user: User) => void;
  portal: 'admin' | 'assessor';
}

export function AuthScreen({ onAuthenticated, portal }: AuthScreenProps) {
  const admin = portal === 'admin';
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user =
        mode === 'login'
          ? await login(email, password)
          : await register(name, email, password);
      if (admin && user.role !== 'admin')
        throw new Error('This account is not an administrator.');
      if (!admin && user.role === 'admin')
        throw new Error('Use the administrator portal to sign in.');
      onAuthenticated(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to authenticate');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="brand">
          <span className="logo">⌁</span>
          <span>
            Field<span>Ready</span>
          </span>
        </div>
        <span className="kicker">
          {admin ? 'ADMIN CONTROL CENTER' : 'FIELD TEAM PORTAL'} · MADISON
          COUNTY
        </span>
        <h1>
          {admin
            ? 'Administrator sign in'
            : mode === 'login'
              ? 'Welcome back'
              : 'Create field account'}
        </h1>
        <p className="helper">
          {admin
            ? 'Review, approve, and flag field submissions.'
            : mode === 'login'
              ? 'Sign in to access your field assessments.'
              : 'Create an assessor account to begin logging sites.'}
        </p>
        <form onSubmit={submit}>
          {mode === 'register' && (
            <label>
              Full name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                minLength={2}
              />
            </label>
          )}
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="primary auth-submit" disabled={busy}>
            {busy
              ? 'Working…'
              : mode === 'login'
                ? 'Sign in'
                : 'Create account'}
          </button>
        </form>
        {!admin && (
          <button
            className="link auth-switch"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError('');
            }}
          >
            {mode === 'login'
              ? 'New here? Create an account'
              : 'Already registered? Sign in'}
          </button>
        )}
      </div>
    </div>
  );
}
