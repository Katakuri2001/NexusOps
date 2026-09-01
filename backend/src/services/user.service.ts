import { prisma } from '../config/database';
import { AuthService } from './auth.service';

export class UserService {
  static async createCustomer(data: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    company?: string;
    address?: string;
  }) {
    const user = await AuthService.register({
      email: data.email,
      password: data.password,
      name: data.name,
      role: 'CUSTOMER',
    });

    const customer = await prisma.customer.create({
      data: {
        userId: user.id,
        phone: data.phone,
        company: data.company,
        address: data.address,
      },
      include: { user: true },
    });

    return customer;
  }

  static async createTechnician(data: {
    email: string;
    password: string;
    name: string;
    specialization?: string;
  }) {
    const user = await AuthService.register({
      email: data.email,
      password: data.password,
      name: data.name,
      role: 'TECHNICIAN',
    });

    const technician = await prisma.technician.create({
      data: {
        userId: user.id,
        specialization: data.specialization,
      },
      include: { user: true },
    });

    return technician;
  }

  static async getAllCustomers() {
    return prisma.customer.findMany({
      include: {
        user: { select: { id: true, email: true, name: true, isActive: true, createdAt: true } },
        websites: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getAllTechnicians() {
    return prisma.technician.findMany({
      include: {
        user: { select: { id: true, email: true, name: true, isActive: true, createdAt: true } },
        assignments: {
          include: { website: { select: { id: true, name: true, domain: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getCustomerById(id: string) {
    return prisma.customer.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true, isActive: true, createdAt: true } },
        websites: true,
      },
    });
  }

  static async getTechnicianById(id: string) {
    return prisma.technician.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true, isActive: true, createdAt: true } },
        assignments: {
          include: { website: true },
        },
      },
    });
  }

  static async updateUser(userId: string, data: any) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });
  }

  static async updateCustomer(customerId: string, data: any) {
    return prisma.customer.update({
      where: { id: customerId },
      data,
      include: { user: true },
    });
  }

  static async toggleUserActive(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    return prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });
  }

  static async resetPassword(userId: string, newPassword: string) {
    const passwordHash = await AuthService.hashPassword(newPassword);
    return prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  static async getCustomerByUserId(userId: string) {
    return prisma.customer.findUnique({
      where: { userId },
    });
  }

  static async getTechnicianByUserId(userId: string) {
    return prisma.technician.findUnique({
      where: { userId },
    });
  }
}
