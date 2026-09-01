export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthRequest extends Express.Request {
  user?: JwtPayload;
  params: any;
  body: any;
  query: any;
}

export interface TechnicianWebsiteAccess {
  websiteId: string;
  permissions: string[];
}
