import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { UserService } from '../services/user.service';
import { TechnicianService } from '../services/technician.service';
import { ActivityService } from '../services/activity.service';

const router = Router();

router.use(authenticate);
router.use(authorize('OWNER'));

router.get('/', async (req: Request, res: Response) => {
  try {
    const technicians = await UserService.getAllTechnicians();
    res.json(technicians);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const technician = await UserService.getTechnicianById(req.params.id as string);
    if (!technician) {
      res.status(404).json({ error: 'Technician not found' });
      return;
    }
    res.json(technician);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req: any, res: Response) => {
  try {
    const technician = await UserService.createTechnician(req.body);

    await ActivityService.log({
      userId: req.user!.userId,
      action: 'CREATE',
      entity: 'Technician',
      entityId: technician.id,
      metadata: { name: req.body.name, email: req.body.email },
    });

    res.status(201).json(technician);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/:id/toggle-active', async (req: any, res: Response) => {
  try {
    const technician = await UserService.getTechnicianById(req.params.id as string);
    if (!technician) {
      res.status(404).json({ error: 'Technician not found' });
      return;
    }

    const updated = await UserService.toggleUserActive(technician.userId);

    await ActivityService.log({
      userId: req.user!.userId,
      action: updated.isActive ? 'ACTIVATE' : 'DEACTIVATE',
      entity: 'Technician',
      entityId: req.params.id as string,
    });

    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/assign-website', async (req: any, res: Response) => {
  try {
    const { websiteId } = req.body;
    if (!websiteId) {
      res.status(400).json({ error: 'Website ID required' });
      return;
    }

    const assignment = await TechnicianService.assignWebsite(req.params.id as string, websiteId);

    await ActivityService.log({
      userId: req.user!.userId,
      action: 'ASSIGN_WEBSITE',
      entity: 'Technician',
      entityId: req.params.id as string,
      metadata: { websiteId },
    });

    res.status(201).json(assignment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id/assign-website/:websiteId', async (req: any, res: Response) => {
  try {
    await TechnicianService.removeAssignment(req.params.id as string, req.params.websiteId as string);

    await ActivityService.log({
      userId: req.user!.userId,
      action: 'REMOVE_WEBSITE_ASSIGNMENT',
      entity: 'Technician',
      entityId: req.params.id as string,
      metadata: { websiteId: req.params.websiteId as string },
    });

    res.json({ message: 'Assignment removed' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/permissions', async (req: any, res: Response) => {
  try {
    const { websiteId, permission } = req.body;
    if (!websiteId || !permission) {
      res.status(400).json({ error: 'Website ID and permission required' });
      return;
    }

    const record = await TechnicianService.setPermission(req.params.id as string, websiteId, permission);
    res.status(201).json(record);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id/permissions/:websiteId/:permission', async (req: any, res: Response) => {
  try {
    await TechnicianService.removePermission(req.params.id as string, req.params.websiteId as string, req.params.permission as any);
    res.json({ message: 'Permission removed' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id/permissions/:websiteId', async (req: any, res: Response) => {
  try {
    const permissions = await TechnicianService.getTechnicianPermissions(req.params.id as string, req.params.websiteId as string);
    res.json(permissions);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
