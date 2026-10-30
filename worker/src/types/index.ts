export interface Env {
  NEXUS_OPS: D1Database;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRY: string;
  JWT_REFRESH_EXPIRY: string;
  FRONTEND_URL: string;
  RESEND_API_KEY?: string;
  RESEND_FROM?: string;
  APP_URL?: string;
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

export interface Monitor {
  id: string;
  websiteId: string;
  name: string;
  url: string;
  environment: string;
  enabled: boolean;
  intervalSeconds: number;
  timeoutMs: number;
  expectedStatusCodes: string;
  expectedContent?: string | null;
  latencyWarningMs?: number | null;
  latencyCriticalMs?: number | null;
  failureThreshold: number;
  recoveryThreshold: number;
  sslEnabled: boolean;
  sslExpiryThresholdDays: number;
  createdAt: string;
  updatedAt: string;
}

export interface MonitorCheck {
  id: string;
  monitorId: string;
  websiteId: string;
  checkedAt: string;
  success: boolean;
  statusCode?: number | null;
  latencyMs?: number | null;
  errorCategory?: string | null;
  errorMessage?: string | null;
  sslExpirationDate?: string | null;
  sslValid: boolean;
  createdAt: string;
}

export interface Incident {
  id: string;
  monitorId: string;
  websiteId: string;
  title: string;
  severity: string;
  status: string;
  startedAt: string;
  lastFailureAt?: string | null;
  resolvedAt?: string | null;
  resolvedBy?: string | null;
  resolutionNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentEvent {
  id: string;
  incidentId: string;
  eventType: string;
  actor?: string | null;
  notes?: string | null;
  createdAt: string;
}
