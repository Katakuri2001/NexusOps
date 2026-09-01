import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { authorizeResource, requirePermission } from '../middleware/authorization';
import { WebsiteService } from '../services/website.service';
import { ActivityService } from '../services/activity.service';
import { NotificationService } from '../services/notification.service';
import { MaintenanceService } from '../services/maintenance.service';
import { ChargeService } from '../services/charge.service';
import { validateBody, createWebsiteSchema, updateWebsiteSchema, createChargeSchema, createMaintenanceSchema, createTimelineSchema, updateHostingSchema, updateDatabaseSchema, updateServerSchema } from '../middleware/validate';

const router = Router();

router.use(authenticate);

router.get('/', async (req: any, res: Response) => {
  try {
    const { role, userId } = req.user!;

    if (role === 'OWNER') {
      const websites = await WebsiteService.getAll();
      res.json(websites);
    } else if (role === 'CUSTOMER') {
      const { prisma } = require('../config/database');
      const customer = await prisma.customer.findUnique({ where: { userId } });
      if (!customer) {
        res.status(404).json({ error: 'Customer profile not found' });
        return;
      }
      const websites = await WebsiteService.getByCustomer(customer.id);
      res.json(websites);
    } else if (role === 'TECHNICIAN') {
      const { prisma } = require('../config/database');
      const technician = await prisma.technician.findUnique({ where: { userId } });
      if (!technician) {
        res.status(404).json({ error: 'Technician profile not found' });
        return;
      }
      const websites = await WebsiteService.getByTechnician(technician.id);
      res.json(websites);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authorizeResource('website'), async (req: any, res: Response) => {
  try {
    const website = await WebsiteService.getById(req.params.id as string);
    if (!website) {
      res.status(404).json({ error: 'Website not found' });
      return;
    }

    if (req.user!.role === 'CUSTOMER') {
      const { notes, ...safeWebsite } = website as any;
      const safeMaintenance = (website as any).maintenance?.filter((m: any) => !m.isInternal);
      const safeData = { ...safeWebsite, maintenance: safeMaintenance };
      res.json(safeData);
    } else {
      res.json(website);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authorize('OWNER'), validateBody(createWebsiteSchema), async (req: any, res: Response) => {
  try {
    const website = await WebsiteService.create(req.body);

    await ActivityService.log({
      userId: req.user!.userId,
      action: 'CREATE',
      entity: 'Website',
      entityId: website.id,
      metadata: { name: req.body.name, domain: req.body.domain },
    });

    res.status(201).json(website);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', authorize('OWNER'), validateBody(updateWebsiteSchema), async (req: any, res: Response) => {
  try {
    const website = await WebsiteService.update(req.params.id as string, req.body);

    await ActivityService.log({
      userId: req.user!.userId,
      action: 'UPDATE',
      entity: 'Website',
      entityId: req.params.id as string,
    });

    res.json(website);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/:id/status', authorizeResource('website'), async (req: any, res: Response) => {
  try {
    const { status, reason, description } = req.body;
    const website = await WebsiteService.updateStatus(
      req.params.id as string,
      status,
      reason,
      description,
      req.user!.userId
    );

    await ActivityService.log({
      userId: req.user!.userId,
      action: 'STATUS_CHANGE',
      entity: 'Website',
      entityId: req.params.id as string,
      metadata: { status, reason },
    });

    res.json(website);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id/hosting', authorize('OWNER'), validateBody(updateHostingSchema), async (req: any, res: Response) => {
  try {
    const hosting = await WebsiteService.updateHosting(req.params.id as string, req.body);

    await ActivityService.log({
      userId: req.user!.userId,
      action: 'UPDATE',
      entity: 'HostingService',
      entityId: req.params.id as string,
    });

    res.json(hosting);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id/database', authorize('OWNER'), validateBody(updateDatabaseSchema), async (req: any, res: Response) => {
  try {
    const database = await WebsiteService.updateDatabase(req.params.id as string, req.body);

    await ActivityService.log({
      userId: req.user!.userId,
      action: 'UPDATE',
      entity: 'DatabaseService',
      entityId: req.params.id as string,
    });

    res.json(database);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id/server', authorize('OWNER'), validateBody(updateServerSchema), async (req: any, res: Response) => {
  try {
    const server = await WebsiteService.updateServer(req.params.id as string, req.body);

    await ActivityService.log({
      userId: req.user!.userId,
      action: 'UPDATE',
      entity: 'ServerService',
      entityId: req.params.id as string,
    });

    res.json(server);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id/plan', authorize('OWNER'), async (req: any, res: Response) => {
  try {
    const plan = await WebsiteService.updatePlan(req.params.id as string, req.body);
    res.json(plan);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id/financial', authorizeResource('website'), async (req: any, res: Response) => {
  try {
    const summary = await WebsiteService.getFinancialSummary(req.params.id as string);
    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/maintenance', authorizeResource('website'), async (req: any, res: Response) => {
  try {
    const includeInternal = req.user!.role !== 'CUSTOMER';
    const records = await MaintenanceService.getByWebsite(req.params.id as string, includeInternal);
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/maintenance', authorizeResource('website'), requirePermission('CREATE_MAINTENANCE'), validateBody(createMaintenanceSchema), async (req: any, res: Response) => {
  try {
    const { prisma } = require('../config/database');
    const technician = req.user!.role === 'TECHNICIAN'
      ? await prisma.technician.findUnique({ where: { userId: req.user!.userId } })
      : null;

    const record = await MaintenanceService.create({
      ...req.body,
      websiteId: req.params.id as string,
      createdById: req.user!.userId,
    });

    await ActivityService.log({
      userId: req.user!.userId,
      action: 'CREATE',
      entity: 'MaintenanceRecord',
      entityId: record.id,
      metadata: { websiteId: req.params.id as string, title: req.body.title },
    });

    res.status(201).json(record);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/charges', authorize('OWNER'), validateBody(createChargeSchema), async (req: any, res: Response) => {
  try {
    const charge = await ChargeService.addCharge(req.params.id as string, req.body);

    await ActivityService.log({
      userId: req.user!.userId,
      action: 'ADD_CHARGE',
      entity: 'AdditionalCharge',
      entityId: charge.id,
      metadata: { websiteId: req.params.id as string, description: req.body.description, amount: req.body.amount },
    });

    res.status(201).json(charge);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id/charges', authorizeResource('website'), async (req: any, res: Response) => {
  try {
    const charges = await ChargeService.getByWebsite(req.params.id as string);
    res.json(charges);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/timeline', authorizeResource('website'), async (req: any, res: Response) => {
  try {
    const { prisma } = require('../config/database');
    const timeline = await prisma.websiteTimeline.findMany({
      where: { websiteId: req.params.id as string },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    res.json(timeline);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/timeline', authorize('OWNER'), validateBody(createTimelineSchema), async (req: any, res: Response) => {
  try {
    const { prisma } = require('../config/database');
    const event = await prisma.websiteTimeline.create({
      data: {
        websiteId: req.params.id as string,
        title: req.body.title,
        description: req.body.description,
        icon: req.body.icon || 'manual',
      },
    });

    await ActivityService.log({
      userId: req.user!.userId,
      action: 'CREATE',
      entity: 'TimelineEvent',
      entityId: event.id,
      metadata: { websiteId: req.params.id as string, title: req.body.title },
    });

    res.status(201).json(event);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/notifications', authorize('OWNER'), async (req: any, res: Response) => {
  try {
    const { prisma } = require('../config/database');
    const website = await prisma.website.findUnique({ where: { id: req.params.id as string } });
    if (!website) {
      res.status(404).json({ error: 'Website not found' });
      return;
    }

    const notification = await NotificationService.create({
      ...req.body,
      websiteId: req.params.id as string,
      customerId: website.customerId,
    });

    await ActivityService.log({
      userId: req.user!.userId,
      action: 'CREATE',
      entity: 'Notification',
      entityId: notification.id,
      metadata: { websiteId: req.params.id as string, title: req.body.title },
    });

    res.status(201).json(notification);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id/notifications', authorizeResource('website'), async (req: any, res: Response) => {
  try {
    const { prisma } = require('../config/database');
    const notifications = await prisma.notification.findMany({
      where: { websiteId: req.params.id as string },
      orderBy: { createdAt: 'desc' },
    });
    res.json(notifications);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authorize('OWNER'), async (req: any, res: Response) => {
  try {
    await WebsiteService.delete(req.params.id as string);

    await ActivityService.log({
      userId: req.user!.userId,
      action: 'DELETE',
      entity: 'Website',
      entityId: req.params.id as string,
    });

    res.json({ message: 'Website deleted' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
