import { Context, Next } from 'hono';
import * as jose from 'jose';
import { Env, JwtPayload, AuthContext } from '../types';

const encoder = new TextEncoder();

function getSecret(key: string) {
  return encoder.encode(key);
}

export async function signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>, secret: string, expiresIn: string): Promise<string> {
  return new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getSecret(secret));
}

export async function verifyToken(token: string, secret: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, getSecret(secret));
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

function parseExpiry(str: string): number {
  const match = str.match(/^(\d+)([smhd])$/);
  if (!match) return 3600;
  const val = parseInt(match[1]);
  switch (match[2]) {
    case 's': return val;
    case 'm': return val * 60;
    case 'h': return val * 3600;
    case 'd': return val * 86400;
    default: return 3600;
  }
}

type Variables = {
  auth: AuthContext;
};

export function authenticate() {
  return async (c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) => {
    const authHeader = c.req.header('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({ error: 'No token provided' }, 401);
    }

    const token = authHeader.slice(7);
    const payload = await verifyToken(token, c.env.JWT_ACCESS_SECRET);
    if (!payload || payload.type !== 'access') {
      return c.json({ error: 'Invalid token' }, 401);
    }

    c.set('auth', {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    });

    await next();
  };
}

export function authorize(...roles: string[]) {
  return async (c: Context<{ Bindings: Env; Variables: Variables }>, next: Next) => {
    const auth = c.get('auth');
    if (!auth || !roles.includes(auth.role)) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }
    await next();
  };
}
