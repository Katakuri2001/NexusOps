import { prisma } from '../config/database';

export class NotificationService {
  static async create(data: {
    websiteId?: string;
    customerId: string;
    title: string;
    message: string;
    type?: string;
    priority?: string;
  }) {
    return prisma.notification.create({
      data: {
        websiteId: data.websiteId,
        customerId: data.customerId,
        title: data.title,
        message: data.message,
        type: data.type || 'INFORMATION',
        priority: data.priority || 'NORMAL',
      },
    });
  }

  static async getByCustomer(customerId: string, unreadOnly = false) {
    return prisma.notification.findMany({
      where: {
        customerId,
        ...(unreadOnly ? { isRead: false } : {}),
      },
      include: {
        website: { select: { id: true, name: true, domain: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  static async getUnreadCount(customerId: string) {
    return prisma.notification.count({
      where: { customerId, isRead: false },
    });
  }

  static async markAsRead(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  static async markAllAsRead(customerId: string) {
    return prisma.notification.updateMany({
      where: { customerId, isRead: false },
      data: { isRead: true },
    });
  }

  static async getUpcomingDueDates() {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const hostings = await prisma.hostingService.findMany({
      where: { dueDate: { lte: thirtyDaysFromNow } },
      include: { website: { include: { customer: { include: { user: { select: { name: true } } } } } } },
    });

    const databases = await prisma.databaseService.findMany({
      where: { dueDate: { lte: thirtyDaysFromNow } },
      include: { website: { include: { customer: { include: { user: { select: { name: true } } } } } } },
    });

    const servers = await prisma.serverService.findMany({
      where: { dueDate: { lte: thirtyDaysFromNow } },
      include: { website: { include: { customer: { include: { user: { select: { name: true } } } } } } },
    });

    return { hostings, databases, servers };
  }
}
