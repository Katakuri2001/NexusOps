import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env } from './types';

import authRoutes from './routes/auth.routes';
import customerRoutes from './routes/customer.routes';
import technicianRoutes from './routes/technician.routes';
import websiteRoutes from './routes/website.routes';
import notificationRoutes from './routes/notification.routes';
import activityRoutes from './routes/activity.routes';
import dashboardRoutes from './routes/dashboard.routes';
import chargeRoutes from './routes/charge.routes';
import billingRoutes from './routes/billing.routes';

const app = new Hono<{ Bindings: Env }>();

// CORS
app.use('*', cors({
  origin: '*',
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Routes
app.route('/api/auth', authRoutes);
app.route('/api/customers', customerRoutes);
app.route('/api/technicians', technicianRoutes);
app.route('/api/websites', websiteRoutes);
app.route('/api/notifications', notificationRoutes);
app.route('/api/admin/activity', activityRoutes);
app.route('/api/dashboard', dashboardRoutes);
app.route('/api/billing', chargeRoutes);
app.route('/api/billing', billingRoutes);

// 404
app.notFound((c) => c.json({ error: 'Not found' }, 404));

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

export default app;
