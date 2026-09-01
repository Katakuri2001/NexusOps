import { prisma } from '../config/database';

export class MaintenanceService {
  static async create(data: {
    websiteId: string;
    title: string;
    description?: string;
    items: string[];
    status?: string;
    notes?: string;
    isInternal?: boolean;
    createdById?: string;
  }) {
    const record = await prisma.maintenanceRecord.create({
      data: {
        websiteId: data.websiteId,
        title: data.title,
        description: data.description,
        items: JSON.stringify(data.items),
        status: data.status || 'completed',
        notes: data.notes,
        isInternal: data.isInternal || false,
        createdById: data.createdById,
      },
      include: { createdBy: { select: { name: true } } },
    });

    await prisma.websiteTimeline.create({
      data: {
        websiteId: data.websiteId,
        title: `Maintenance: ${data.title}`,
        description: data.description,
        icon: 'maintenance',
      },
    });

    return {
      ...record,
      items: JSON.parse(record.items || '[]'),
    };
  }

  static async getByWebsite(websiteId: string, includeInternal = false) {
    const records = await prisma.maintenanceRecord.findMany({
      where: {
        websiteId,
        ...(includeInternal ? {} : { isInternal: false }),
      },
      include: { createdBy: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return records.map(r => ({
      ...r,
      items: JSON.parse(r.items || '[]'),
    }));
  }

  static async getById(id: string) {
    const record = await prisma.maintenanceRecord.findUnique({
      where: { id },
      include: { createdBy: { select: { name: true } } },
    });

    if (!record) return null;
    return {
      ...record,
      items: JSON.parse(record.items || '[]'),
    };
  }

  static async update(id: string, data: Record<string, any>) {
    if (data.items && Array.isArray(data.items)) {
      data.items = JSON.stringify(data.items);
    }
    const record = await prisma.maintenanceRecord.update({
      where: { id },
      data,
      include: { createdBy: { select: { name: true } } },
    });
    return {
      ...record,
      items: JSON.parse(record.items || '[]'),
    };
  }
}
