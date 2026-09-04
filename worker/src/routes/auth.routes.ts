import { Hono } from 'hono';
import { Env, AuthContext } from '../types';
import { signToken, verifyToken, authenticate } from '../middleware/auth';
import { hashPassword, verifyPassword } from '../db/crypto';
import { camelCaseKeys } from '../db/transform';

type Variables = {
  auth: AuthContext;
};

const auth = new Hono<{ Bindings: Env; Variables: Variables }>();

auth.post('/login', async (c) => {
  const { email, password } = await c.req.json();
  if (!email || !password) return c.json({ error: 'Email and password required' }, 400);

  const user = await c.env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  if (!user) return c.json({ error: 'Invalid credentials' }, 401);
  if (!user.is_active) return c.json({ error: 'Account disabled' }, 403);

  const valid = await verifyPassword(password, user.password_hash as string);
  if (!valid) return c.json({ error: 'Invalid credentials' }, 401);

  const accessToken = await signToken(
    { sub: user.id as string, email: user.email as string, role: user.role as string, type: 'access' },
    c.env.JWT_ACCESS_SECRET, c.env.JWT_ACCESS_EXPIRY
  );
  const refreshToken = await signToken(
    { sub: user.id as string, email: user.email as string, role: user.role as string, type: 'refresh' },
    c.env.JWT_REFRESH_SECRET, c.env.JWT_REFRESH_EXPIRY
  );

  return c.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, accessToken, refreshToken });
});

auth.post('/refresh', async (c) => {
  const { refreshToken } = await c.req.json();
  if (!refreshToken) return c.json({ error: 'Refresh token required' }, 400);

  const payload = await verifyToken(refreshToken, c.env.JWT_REFRESH_SECRET);
  if (!payload || payload.type !== 'refresh') return c.json({ error: 'Invalid refresh token' }, 401);

  const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(payload.sub).first();
  if (!user || !user.is_active) return c.json({ error: 'User not found or disabled' }, 401);

  const newAccessToken = await signToken(
    { sub: user.id as string, email: user.email as string, role: user.role as string, type: 'access' },
    c.env.JWT_ACCESS_SECRET, c.env.JWT_ACCESS_EXPIRY
  );
  const newRefreshToken = await signToken(
    { sub: user.id as string, email: user.email as string, role: user.role as string, type: 'refresh' },
    c.env.JWT_REFRESH_SECRET, c.env.JWT_REFRESH_EXPIRY
  );

  return c.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
});

auth.get('/me', authenticate(), async (c) => {
  const auth = c.get('auth');
  const user = await c.env.DB.prepare('SELECT id, email, name, role, is_active, created_at FROM users WHERE id = ?').bind(auth.userId).first();
  if (!user) return c.json({ error: 'User not found' }, 404);
  return c.json(camelCaseKeys(user));
});

auth.post('/change-password', authenticate(), async (c) => {
  const auth = c.get('auth');
  const { currentPassword, newPassword } = await c.req.json();
  if (!currentPassword || !newPassword) return c.json({ error: 'Current and new password required' }, 400);
  if (newPassword.length < 8) return c.json({ error: 'Password must be at least 8 characters' }, 400);

  const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(auth.userId).first();
  if (!user) return c.json({ error: 'User not found' }, 404);

  const valid = await verifyPassword(currentPassword, user.password_hash as string);
  if (!valid) return c.json({ error: 'Current password is incorrect' }, 401);

  const newHash = await hashPassword(newPassword);
  await c.env.DB.prepare('UPDATE users SET password_hash = ?, updated_at = datetime("now") WHERE id = ?').bind(newHash, auth.userId).run();

  return c.json({ message: 'Password changed successfully' });
});

export default auth;
