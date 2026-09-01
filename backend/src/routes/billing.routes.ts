import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { NotificationService } from '../services/notification.service';

const router = Router();

router.use(authenticate);
router.use(authorize('OWNER'));

router.get('/due-dates', async (req: Request, res: Response) => {
  try {
    const dates = await NotificationService.getUpcomingDueDates();
    res.json(dates);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
