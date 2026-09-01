import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { UserService } from '../services/user.service';
import { ActivityService } from '../services/activity.service';
import { validateBody, createCustomerSchema } from '../middleware/validate';

const router = Router();

router.use(authenticate);
router.use(authorize('OWNER'));

router.get('/', async (req: Request, res: Response) => {
  try {
    const customers = await UserService.getAllCustomers();
    res.json(customers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const customer = await UserService.getCustomerById(req.params.id as string);
    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }
    res.json(customer);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', validateBody(createCustomerSchema), async (req: any, res: Response) => {
  try {
    const customer = await UserService.createCustomer(req.body);

    await ActivityService.log({
      userId: req.user!.userId,
      action: 'CREATE',
      entity: 'Customer',
      entityId: customer.id,
      metadata: { name: req.body.name, email: req.body.email },
    });

    res.status(201).json(customer);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/:id', async (req: any, res: Response) => {
  try {
    const { id } = req.params;
    const { email, name, phone, company, address } = req.body;

    const customer = await UserService.getCustomerById(id);
    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    if (email || name) {
      await UserService.updateUser(customer.userId, { email, name });
    }

    const updated = await UserService.updateCustomer(id, { phone, company, address });

    await ActivityService.log({
      userId: req.user!.userId,
      action: 'UPDATE',
      entity: 'Customer',
      entityId: id,
    });

    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/:id/toggle-active', async (req: any, res: Response) => {
  try {
    const customer = await UserService.getCustomerById(req.params.id as string);
    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    const updated = await UserService.toggleUserActive(customer.userId);

    await ActivityService.log({
      userId: req.user!.userId,
      action: updated.isActive ? 'ACTIVATE' : 'DEACTIVATE',
      entity: 'Customer',
      entityId: req.params.id as string,
    });

    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:id/reset-password', async (req: any, res: Response) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters' });
      return;
    }

    const customer = await UserService.getCustomerById(req.params.id as string);
    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    await UserService.resetPassword(customer.userId, password);

    await ActivityService.log({
      userId: req.user!.userId,
      action: 'RESET_PASSWORD',
      entity: 'Customer',
      entityId: req.params.id as string,
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
