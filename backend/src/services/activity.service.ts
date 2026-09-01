import { prisma } from '../config/database';

export class ActivityService {
  static async log(data: {
    userId?: string;
    action: string;
    entity: string;
    entityId?: string;
    metadata?: any;
    ipAddress?: string;
  }) {
    return prisma.activityLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
        ipAddress: data.ipAddress,
      },
    });
  }

  static async getRecent(limit = 50) {
    const logs = await prisma.activityLog.findMany({
      include: { user: { select: { name: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return logs.map(l => ({
      ...l,
      metadata: l.metadata ? JSON.parse(l.metadata) : null,
    }));
  }

  static async getByEntity(entity: string, entityId: string) {
    const logs = await prisma.activityLog.findMany({
      where: { entity, entityId },
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return logs.map(l => ({
      ...l,
      metadata: l.metadata ? JSON.parse(l.metadata) : null,
    }));
  }

  static async getDashboardStats() {
    const thirtyDays = new Date();
    thirtyDays.setDate(thirtyDays.getDate() + 30);

    const [
      totalWebsites,
      operationalWebsites,
      attentionWebsites,
      maintenanceWebsites,
      totalCustomers,
      totalTechnicians,
      unreadNotifications,
      hostingsDue,
      databasesDue,
      serversDue,
    ] = await Promise.all([
      prisma.website.count(),
      prisma.website.count({ where: { status: 'OPERATIONAL' } }),
      prisma.website.count({ where: { status: 'ATTENTION_REQUIRED' } }),
      prisma.website.count({ where: { status: 'MAINTENANCE' } }),
      prisma.customer.count(),
      prisma.technician.count(),
      prisma.notification.count({ where: { isRead: false } }),
      prisma.hostingService.count({ where: { dueDate: { lte: thirtyDays } } }),
      prisma.databaseService.count({ where: { dueDate: { lte: thirtyDays } } }),
      prisma.serverService.count({ where: { dueDate: { lte: thirtyDays } } }),
    ]);

    const users = await prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      include: { customer: true },
    });
    const activeCustomers = users.filter(u => u.isActive && u.customer).length;

    return {
      totalWebsites,
      operationalWebsites,
      attentionWebsites,
      maintenanceWebsites,
      totalCustomers,
      activeCustomers,
      totalTechnicians,
      unreadNotifications,
      upcomingDueDates: hostingsDue + databasesDue + serversDue,
    };
  }
}
