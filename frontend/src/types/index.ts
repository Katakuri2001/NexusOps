export type Role = 'OWNER' | 'CUSTOMER' | 'TECHNICIAN';

export type WebsiteStatus =
  | 'OPERATIONAL'
  | 'MAINTENANCE'
  | 'ATTENTION_REQUIRED'
  | 'OFFLINE'
  | 'SUSPENDED'
  | 'DEVELOPMENT';

export type NotificationType = 'INFORMATION' | 'BILLING' | 'MAINTENANCE' | 'WARNING' | 'SYSTEM';
export type NotificationPriority = 'NORMAL' | 'IMPORTANT' | 'URGENT';
export type BillingType = 'ONE_TIME' | 'MONTHLY' | 'YEARLY' | 'CUSTOM';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface Customer {
  id: string;
  userId: string;
  phone?: string;
  company?: string;
  address?: string;
  user: User;
  websites: Website[];
  createdAt: string;
}

export interface Technician {
  id: string;
  userId: string;
  specialization?: string;
  user: User;
  assignments: TechnicianAssignment[];
  createdAt: string;
}

export interface Website {
  id: string;
  name: string;
  domain: string;
  description?: string;
  status: WebsiteStatus;
  websiteType?: string;
  launchDate?: string;
  customerId: string;
  customer?: Customer;
  plan?: Plan;
  hosting?: HostingService;
  database?: DatabaseService;
  server?: ServerService;
  charges?: AdditionalCharge[];
  maintenance?: MaintenanceRecord[];
  statusHistory?: StatusHistory[];
  notifications?: Notification[];
  technicianAssignments?: TechnicianAssignment[];
  timeline?: TimelineEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface Plan {
  id: string;
  websiteId: string;
  name: string;
  description?: string;
  price: number;
  billingCycle: string;
  features: string[];
  startDate: string;
  renewalDate?: string;
  isActive: boolean;
}

export interface HostingService {
  id: string;
  websiteId: string;
  provider: string;
  status: string;
  cost: number;
  billingCycle: string;
  startDate: string;
  dueDate: string;
  notes?: string;
}

export interface DatabaseService {
  id: string;
  websiteId: string;
  provider: string;
  status: string;
  monthlyCost: number;
  billingCycle: string;
  startDate: string;
  dueDate: string;
  notes?: string;
}

export interface ServerService {
  id: string;
  websiteId: string;
  provider: string;
  status: string;
  plan?: string;
  cost: number;
  billingCycle: string;
  startDate: string;
  dueDate: string;
  notes?: string;
}

export interface AdditionalCharge {
  id: string;
  websiteId: string;
  description: string;
  amount: number;
  date: string;
  billingType: BillingType;
  status: string;
  notes?: string;
}

export interface MaintenanceRecord {
  id: string;
  websiteId: string;
  title: string;
  description?: string;
  items: string[];
  status: string;
  notes?: string;
  isInternal: boolean;
  createdBy?: { name: string };
  createdAt: string;
}

export interface StatusHistory {
  id: string;
  websiteId: string;
  status: WebsiteStatus;
  reason?: string;
  description?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  websiteId?: string;
  customerId: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  isRead: boolean;
  website?: { id: string; name: string; domain: string };
  customer?: { user: { name: string } };
  createdAt: string;
}

export interface TechnicianAssignment {
  id: string;
  technicianId: string;
  websiteId: string;
  technician?: Technician;
  website?: Website;
}

export interface TimelineEvent {
  id: string;
  websiteId: string;
  title: string;
  description?: string;
  icon?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  metadata?: any;
  ipAddress?: string;
  user?: { name: string; email: string; role: string };
  createdAt: string;
}

export interface DashboardStats {
  totalWebsites: number;
  operationalWebsites: number;
  attentionWebsites: number;
  maintenanceWebsites: number;
  totalCustomers: number;
  activeCustomers: number;
  totalTechnicians: number;
  unreadNotifications: number;
  upcomingDueDates: number;
}

export interface FinancialSummary {
  recurring: {
    plan: number;
    hosting: number;
    database: number;
    server: number;
    otherRecurring: number;
  };
  oneTime: number;
  monthlyTotal: number;
  yearlyTotal: number;
}
