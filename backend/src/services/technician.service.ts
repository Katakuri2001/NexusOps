import { prisma } from '../config/database';

export class TechnicianService {
  static async assignWebsite(technicianId: string, websiteId: string) {
    const existing = await prisma.technicianWebsiteAssignment.findUnique({
      where: { technicianId_websiteId: { technicianId, websiteId } },
    });

    if (existing) {
      throw new Error('Technician is already assigned to this website');
    }

    return prisma.technicianWebsiteAssignment.create({
      data: { technicianId, websiteId },
      include: {
        technician: { include: { user: { select: { name: true } } } },
        website: { select: { name: true, domain: true } },
      },
    });
  }

  static async removeAssignment(technicianId: string, websiteId: string) {
    await prisma.technicianPermissionRecord.deleteMany({
      where: { technicianId, websiteId },
    });

    return prisma.technicianWebsiteAssignment.delete({
      where: { technicianId_websiteId: { technicianId, websiteId } },
    });
  }

  static async setPermission(technicianId: string, websiteId: string, permission: string) {
    return prisma.technicianPermissionRecord.upsert({
      where: {
        technicianId_websiteId_permission: { technicianId, websiteId, permission },
      },
      create: { technicianId, websiteId, permission },
      update: {},
    });
  }

  static async removePermission(technicianId: string, websiteId: string, permission: string) {
    return prisma.technicianPermissionRecord.delete({
      where: {
        technicianId_websiteId_permission: { technicianId, websiteId, permission },
      },
    });
  }

  static async getTechnicianPermissions(technicianId: string, websiteId: string) {
    const permissions = await prisma.technicianPermissionRecord.findMany({
      where: { technicianId, websiteId },
    });
    return permissions.map(p => p.permission);
  }

  static async hasPermission(technicianId: string, websiteId: string, permission: string): Promise<boolean> {
    const count = await prisma.technicianPermissionRecord.count({
      where: { technicianId, websiteId, permission },
    });
    return count > 0;
  }

  static async isAssignedToWebsite(technicianId: string, websiteId: string): Promise<boolean> {
    const count = await prisma.technicianWebsiteAssignment.count({
      where: { technicianId, websiteId },
    });
    return count > 0;
  }

  static async getAssignedWebsiteIds(technicianId: string): Promise<string[]> {
    const assignments = await prisma.technicianWebsiteAssignment.findMany({
      where: { technicianId },
      select: { websiteId: true },
    });
    return assignments.map(a => a.websiteId);
  }
}
