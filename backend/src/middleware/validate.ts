import { z } from 'zod';

export const createWebsiteSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  domain: z.string().min(1, 'Domain is required').max(255),
  description: z.string().max(500).optional(),
  developerName: z.string().max(100).optional(),
  status: z.enum(['OPERATIONAL', 'MAINTENANCE', 'ATTENTION_REQUIRED', 'OFFLINE', 'DEVELOPMENT', 'SUSPENDED']).optional(),
  websiteType: z.string().max(50).optional(),
  launchDate: z.string().optional(),
  customerId: z.string().min(1, 'Customer is required'),
});

export const updateWebsiteSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  domain: z.string().min(1).max(255).optional(),
  description: z.string().max(500).optional(),
  developerName: z.string().max(100).optional(),
  status: z.enum(['OPERATIONAL', 'MAINTENANCE', 'ATTENTION_REQUIRED', 'OFFLINE', 'DEVELOPMENT', 'SUSPENDED']).optional(),
  websiteType: z.string().max(50).optional(),
  launchDate: z.string().optional(),
});

export const createCustomerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(100),
  phone: z.string().max(20).optional(),
  company: z.string().max(100).optional(),
  address: z.string().max(200).optional(),
});

export const createChargeSchema = z.object({
  description: z.string().min(1, 'Description is required').max(200),
  amount: z.number().positive('Amount must be positive'),
  date: z.string().min(1, 'Date is required'),
  billingType: z.enum(['ONE_TIME', 'MONTHLY', 'YEARLY']).optional(),
  status: z.enum(['pending', 'paid', 'cancelled', 'overdue']).optional(),
  notes: z.string().max(500).optional(),
});

export const createMaintenanceSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(500).optional(),
  items: z.array(z.string()).optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  notes: z.string().max(500).optional(),
  isInternal: z.boolean().optional(),
});

export const createTimelineSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(500).optional(),
  icon: z.string().max(50).optional(),
});

export const updateHostingSchema = z.object({
  provider: z.string().max(100).optional(),
  cost: z.number().min(0).optional(),
  billingCycle: z.string().max(20).optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'expired', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXPIRED']).optional(),
  notes: z.string().max(500).optional(),
});

export const updateDatabaseSchema = z.object({
  provider: z.string().max(100).optional(),
  monthlyCost: z.number().min(0).optional(),
  billingCycle: z.string().max(20).optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'expired', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXPIRED']).optional(),
  notes: z.string().max(500).optional(),
});

export const updateServerSchema = z.object({
  provider: z.string().max(100).optional(),
  plan: z.string().max(100).optional(),
  cost: z.number().min(0).optional(),
  billingCycle: z.string().max(20).optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'expired', 'ACTIVE', 'INACTIVE', 'SUSPENDED', 'EXPIRED']).optional(),
  notes: z.string().max(500).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export function validateBody(schema: z.ZodSchema) {
  return (req: any, res: any, next: any) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      res.status(400).json({ error: errors.join(', ') });
      return;
    }
    req.body = result.data;
    next();
  };
}
