import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

import authRoutes from './routes/auth.routes';
import customerRoutes from './routes/customer.routes';
import technicianRoutes from './routes/technician.routes';
import websiteRoutes from './routes/website.routes';
import notificationRoutes from './routes/notification.routes';
import activityRoutes from './routes/activity.routes';
import dashboardRoutes from './routes/dashboard.routes';
import chargeRoutes from './routes/charge.routes';
import billingRoutes from './routes/billing.routes';

const app = express();

app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_URL.split(',').map((url: string) => url.trim()),
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests, please try again later.',
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many authentication attempts, please try again later.',
});
app.use('/api/auth/login', authLimiter);

app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/technicians', technicianRoutes);
app.use('/api/websites', websiteRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin/activity', activityRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/billing', chargeRoutes);
app.use('/api/billing', billingRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(`NexusOps API running on port ${PORT}`);
  console.log(`Environment: ${env.NODE_ENV}`);
});

export default app;
