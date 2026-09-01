import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { ActivityService } from '../services/activity.service';

const router = Router();

router.use(authenticate);
router.use(authorize('OWNER'));

router.get('/', async (req: Request, res: Response) => {
  try {
    const logs = await ActivityService.getRecent(100);
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:entity/:entityId', async (req: Request, res: Response) => {
  try {
    const logs = await ActivityService.getByEntity(req.params.entity as string, req.params.entityId as string);
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
