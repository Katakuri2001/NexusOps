import { prisma } from '../config/database';

export class WebsiteService {
  static async create(data: {
    name: string;
    domain: string;
    description?: string;
    developerName?: string;
    status?: string;
    websiteType?: string;
    launchDate?: Date;
    customerId: string;
  }) {
    const website = await prisma.website.create({
      data: {
        name: data.name,
        domain: data.domain,
        description: data.description,
        developerName: data.developerName,
        status: data.status || 'DEVELOPMENT',
        websiteType: data.websiteType,
        launchDate: data.launchDate,
        customerId: data.customerId,
      },
      include: {
        customer: { include: { user: { select: { name: true, email: true } } } },
      },
    });

    await prisma.websiteTimeline.create({
      data: {
        websiteId: website.id,
        title: 'Website created',
        description: `Website ${website.name} has been created`,
        icon: 'plus',
      },
    });

    return website;
  }

  static async getAll() {
    return prisma.website.findMany({
      include: {
        customer: { include: { user: { select: { name: true, email: true } } } },
        plan: true,
        hosting: true,
        database: true,
        server: true,
        notifications: { where: { isRead: false }, select: { id: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  static async getById(id: string) {
    return prisma.website.findUnique({
      where: { id },
      include: {
        customer: { include: { user: { select: { name: true, email: true } } } },
        plan: true,
        hosting: true,
        database: true,
        server: true,
        charges: { orderBy: { date: 'desc' } },
        maintenance: { orderBy: { createdAt: 'desc' }, include: { createdBy: { select: { name: true } } } },
        statusHistory: { orderBy: { createdAt: 'desc' }, take: 10 },
        notifications: { orderBy: { createdAt: 'desc' }, take: 20 },
        technicianAssignments: {
          include: {
            technician: {
              include: { user: { select: { name: true, email: true } } },
            },
          },
        },
        timeline: { orderBy: { createdAt: 'desc' }, take: 30 },
      },
    });
  }

  static async getByCustomer(customerId: string) {
    return prisma.website.findMany({
      where: { customerId },
      include: {
        plan: true,
        hosting: true,
        database: true,
        server: true,
        notifications: { where: { isRead: false }, select: { id: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  static async getByTechnician(technicianId: string) {
    const assignments = await prisma.technicianWebsiteAssignment.findMany({
      where: { technicianId },
      include: {
        website: {
          include: {
            customer: true,
            hosting: true,
            database: true,
            server: true,
          },
        },
      },
    });

    return assignments.map(a => a.website);
  }

  static async updateStatus(id: string, status: string, reason?: string, description?: string, updatedBy?: string) {
    await prisma.website.update({
      where: { id },
      data: { status },
    });

    await prisma.websiteStatusHistory.create({
      data: {
        websiteId: id,
        status,
        reason,
        description,
        updatedBy,
      },
    });

    await prisma.websiteTimeline.create({
      data: {
        websiteId: id,
        title: `Status changed to ${status.replace(/_/g, ' ').toLowerCase()}`,
        description: reason || description,
        icon: 'status',
      },
    });

    return prisma.website.findUnique({ where: { id } });
  }

  static async update(id: string, data: any) {
    return prisma.website.update({
      where: { id },
      data,
      include: {
        customer: { include: { user: { select: { name: true, email: true } } } },
      },
    });
  }

  static async delete(id: string) {
    return prisma.website.delete({ where: { id } });
  }

  static async updateHosting(websiteId: string, data: any) {
    return prisma.hostingService.upsert({
      where: { websiteId },
      create: { websiteId, ...data },
      update: data,
    });
  }

  static async updateDatabase(websiteId: string, data: any) {
    return prisma.databaseService.upsert({
      where: { websiteId },
      create: { websiteId, ...data },
      update: data,
    });
  }

  static async updateServer(websiteId: string, data: any) {
    return prisma.serverService.upsert({
      where: { websiteId },
      create: { websiteId, ...data },
      update: data,
    });
  }

  static async updatePlan(websiteId: string, data: any) {
    if (data.features && Array.isArray(data.features)) {
      data.features = JSON.stringify(data.features);
    }
    return prisma.plan.upsert({
      where: { websiteId },
      create: { websiteId, ...data },
      update: data,
    });
  }

  static async addTimelineEvent(websiteId: string, title: string, description?: string, icon?: string) {
    return prisma.websiteTimeline.create({
      data: { websiteId, title, description, icon },
    });
  }

  static async getFinancialSummary(websiteId: string) {
    const website = await prisma.website.findUnique({
      where: { id: websiteId },
      include: { plan: true, hosting: true, database: true, server: true, charges: true },
    });

    if (!website) throw new Error('Website not found');

    const recurring = {
      plan: website.plan?.price || 0,
      hosting: website.hosting?.cost || 0,
      database: website.database?.monthlyCost || 0,
      server: website.server?.cost || 0,
      otherRecurring: website.charges
        .filter(c => c.billingType === 'MONTHLY' && c.status !== 'cancelled')
        .reduce((sum, c) => sum + c.amount, 0),
    };

    const oneTime = website.charges
      .filter(c => c.billingType === 'ONE_TIME' && c.status !== 'cancelled')
      .reduce((sum, c) => sum + c.amount, 0);

    const monthlyTotal = recurring.plan + recurring.hosting + recurring.database + recurring.server + recurring.otherRecurring;

    return {
      recurring,
      oneTime,
      monthlyTotal,
      yearlyTotal: monthlyTotal * 12,
    };
  }
}
