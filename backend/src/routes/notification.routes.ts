import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { NotificationService } from '../services/notification.service';
import { ActivityService } from '../services/activity.service';
import { prisma } from '../config/database';

const router = Router();

router.use(authenticate);

router.get('/', async (req: any, res: Response) => {
  try {
    const { role, userId } = req.user!;

    if (role === 'OWNER') {
      const notifications = await prisma.notification.findMany({
        include: {
          website: { select: { id: true, name: true, domain: true } },
          customer: { include: { user: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      res.json(notifications);
    } else if (role === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({ where: { userId } });
      if (!customer) {
        res.status(404).json({ error: 'Customer profile not found' });
        return;
      }
      const notifications = await NotificationService.getByCustomer(customer.id);
      res.json(notifications);
    } else {
      res.json([]);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/unread-count', async (req: any, res: Response) => {
  try {
    const { role, userId } = req.user!;

    if (role === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({ where: { userId } });
      if (!customer) {
        res.json({ count: 0 });
        return;
      }
      const count = await NotificationService.getUnreadCount(customer.id);
      res.json({ count });
    } else {
      const count = await prisma.notification.count({ where: { isRead: false } });
      res.json({ count });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req: any, res: Response) => {
  try {
    if (req.user!.role !== 'OWNER') {
      res.status(403).json({ error: 'Only owners can create notifications' });
      return;
    }

    const notification = await NotificationService.create(req.body);

    await ActivityService.log({
      userId: req.user!.userId,
      action: 'CREATE',
      entity: 'Notification',
      entityId: notification.id,
      metadata: { title: req.body.title },
    });

    res.status(201).json(notification);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/:id/read', async (req: any, res: Response) => {
  try {
    const notification = await NotificationService.markAsRead(req.params.id as string);
    res.json(notification);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/read-all', async (req: any, res: Response) => {
  try {
    const { role, userId } = req.user!;

    if (role === 'CUSTOMER') {
      const customer = await prisma.customer.findUnique({ where: { userId } });
      if (!customer) {
        res.status(404).json({ error: 'Customer not found' });
        return;
      }
      await NotificationService.markAllAsRead(customer.id);
    }

    res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
