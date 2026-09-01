import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { ChargeService } from '../services/charge.service';

const router = Router();

router.use(authenticate);
router.use(authorize('OWNER'));

router.get('/upcoming', async (req: Request, res: Response) => {
  try {
    const charges = await ChargeService.getUpcomingCharges();
    res.json(charges);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/website/:websiteId', async (req: Request, res: Response) => {
  try {
    const charges = await ChargeService.getByWebsite(req.params.websiteId as string);
    res.json(charges);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/website/:websiteId', async (req: any, res: Response) => {
  try {
    const charge = await ChargeService.addCharge(req.params.websiteId as string, req.body);
    res.status(201).json(charge);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const charge = await ChargeService.update(req.params.id as string, req.body);
    res.json(charge);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await ChargeService.delete(req.params.id as string);
    res.json({ message: 'Charge deleted' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
