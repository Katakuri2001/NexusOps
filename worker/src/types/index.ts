export interface Env {
  DB: D1Database;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRY: string;
  JWT_REFRESH_EXPIRY: string;
  FRONTEND_URL: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

export interface AuthContext {
  userId: string;
  email: string;
  role: string;
}

export interface TechnicianWebsiteAccess {
  technicianId: string;
  websiteId: string;
  permissions: string[];
}
