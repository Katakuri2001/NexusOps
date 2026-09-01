import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { prisma } from '../config/database';
import { TechnicianService } from '../services/technician.service';

export function authorizeResource(resourceType: 'website' | 'customer' | 'technician') {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { role, userId } = req.user;

    if (role === 'OWNER') {
      next();
      return;
    }

    const resourceId = String(req.params.id);

    switch (resourceType) {
      case 'website': {
        if (role === 'CUSTOMER') {
          const customer = await prisma.customer.findUnique({ where: { userId } });
          if (!customer) {
            res.status(403).json({ error: 'Customer profile not found' });
            return;
          }

          const website = await prisma.website.findUnique({ where: { id: resourceId } });
          if (!website || website.customerId !== customer.id) {
            res.status(403).json({ error: 'Access denied to this website' });
            return;
          }
        }

        if (role === 'TECHNICIAN') {
          const technician = await prisma.technician.findUnique({ where: { userId } });
          if (!technician) {
            res.status(403).json({ error: 'Technician profile not found' });
            return;
          }

          const isAssigned = await TechnicianService.isAssignedToWebsite(technician.id, resourceId);
          if (!isAssigned) {
            res.status(403).json({ error: 'You are not assigned to this website' });
            return;
          }
        }

        break;
      }

      case 'customer': {
        if (role === 'CUSTOMER') {
          const customer = await prisma.customer.findUnique({ where: { userId } });
          if (!customer || customer.id !== resourceId) {
            res.status(403).json({ error: 'Access denied to this customer' });
            return;
          }
        }

        if (role === 'TECHNICIAN') {
          res.status(403).json({ error: 'Technicians cannot access customer data directly' });
          return;
        }

        break;
      }

      case 'technician': {
        if (role === 'TECHNICIAN') {
          const technician = await prisma.technician.findUnique({ where: { userId } });
          if (!technician || technician.id !== resourceId) {
            res.status(403).json({ error: 'Access denied to this technician' });
            return;
          }
        }

        if (role === 'CUSTOMER') {
          res.status(403).json({ error: 'Customers cannot access technician data' });
          return;
        }

        break;
      }
    }

    next();
  };
}

export function requirePermission(permission: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (req.user.role === 'OWNER') {
      next();
      return;
    }

    if (req.user.role === 'TECHNICIAN') {
      const technician = await prisma.technician.findUnique({ where: { userId: req.user.userId } });
      if (!technician) {
        res.status(403).json({ error: 'Technician profile not found' });
        return;
      }

      const websiteId = String(req.params.id || req.body.websiteId || req.query.websiteId);
      if (!websiteId) {
        res.status(400).json({ error: 'Website ID required' });
        return;
      }

      const hasPermission = await TechnicianService.hasPermission(technician.id, websiteId, permission);
      if (!hasPermission) {
        res.status(403).json({ error: `Missing permission: ${permission}` });
        return;
      }
    }

    next();
  };
}
