import { prisma } from '../config/database';

export class ChargeService {
  static async addCharge(websiteId: string, data: {
    description: string;
    amount: number;
    date: Date;
    billingType?: string;
    status?: string;
    notes?: string;
  }) {
    const charge = await prisma.additionalCharge.create({
      data: {
        websiteId,
        description: data.description,
        amount: data.amount,
        date: data.date,
        billingType: data.billingType || 'ONE_TIME',
        status: data.status || 'pending',
        notes: data.notes,
      },
    });

    await prisma.websiteTimeline.create({
      data: {
        websiteId,
        title: `Charge added: ${data.description}`,
        description: `$${data.amount} - ${data.billingType || 'One-time'}`,
        icon: 'charge',
      },
    });

    return charge;
  }

  static async getByWebsite(websiteId: string) {
    return prisma.additionalCharge.findMany({
      where: { websiteId },
      orderBy: { date: 'desc' },
    });
  }

  static async update(id: string, data: Record<string, any>) {
    return prisma.additionalCharge.update({
      where: { id },
      data,
    });
  }

  static async delete(id: string) {
    return prisma.additionalCharge.delete({ where: { id } });
  }

  static async getUpcomingCharges() {
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    return prisma.additionalCharge.findMany({
      where: {
        status: 'pending',
        date: { lte: thirtyDaysFromNow },
      },
      include: {
        website: {
          include: { customer: { include: { user: { select: { name: true } } } } },
        },
      },
      orderBy: { date: 'asc' },
    });
  }
}
