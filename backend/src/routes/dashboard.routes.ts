import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { ActivityService } from '../services/activity.service';

const router = Router();

router.use(authenticate);
router.use(authorize('OWNER'));

router.get('/', async (req: Request, res: Response) => {
  try {
    const stats = await ActivityService.getDashboardStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
