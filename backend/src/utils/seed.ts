import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const ownerPassword = await bcrypt.hash('admin123', 12);
  const customerPassword = await bcrypt.hash('customer123', 12);
  const techPassword = await bcrypt.hash('tech123', 12);

  const owner = await prisma.user.upsert({
    where: { email: 'admin@nexusops.com' },
    update: {},
    create: {
      email: 'admin@nexusops.com',
      passwordHash: ownerPassword,
      name: 'System Owner',
      role: 'OWNER',
    },
  });

  const customerUser = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      passwordHash: customerPassword,
      name: 'John Smith',
      role: 'CUSTOMER',
    },
  });

  const customer = await prisma.customer.upsert({
    where: { userId: customerUser.id },
    update: {},
    create: {
      userId: customerUser.id,
      phone: '+1 555-0123',
      company: 'Smith Enterprises',
      address: '123 Main St, New York, NY',
    },
  });

  const techUser = await prisma.user.upsert({
    where: { email: 'mike@nexusops.com' },
    update: {},
    create: {
      email: 'mike@nexusops.com',
      passwordHash: techPassword,
      name: 'Mike Johnson',
      role: 'TECHNICIAN',
    },
  });

  const technician = await prisma.technician.upsert({
    where: { userId: techUser.id },
    update: {},
    create: {
      userId: techUser.id,
      specialization: 'Full Stack Development',
    },
  });

  const website1 = await prisma.website.upsert({
    where: { domain: 'smith-enterprises.com' },
    update: {},
    create: {
      name: 'Smith Enterprises',
      domain: 'smith-enterprises.com',
      description: 'Corporate website for Smith Enterprises',
      status: 'OPERATIONAL',
      websiteType: 'Business',
      developerName: 'Jane Smith',
      launchDate: new Date('2025-01-15'),
      customerId: customer.id,
    },
  });

  const website2 = await prisma.website.upsert({
    where: { domain: 'smith-shop.com' },
    update: {},
    create: {
      name: 'E-Commerce Store',
      domain: 'smith-shop.com',
      description: 'Online store for Smith Enterprises',
      status: 'MAINTENANCE',
      websiteType: 'E-Commerce',
      developerName: 'Dev Team',
      launchDate: new Date('2025-06-01'),
      customerId: customer.id,
    },
  });

  const website3 = await prisma.website.upsert({
    where: { domain: 'smith-blog.com' },
    update: {},
    create: {
      name: 'Blog Platform',
      domain: 'smith-blog.com',
      description: 'Company blog and news platform',
      status: 'ATTENTION_REQUIRED',
      websiteType: 'Blog',
      launchDate: new Date('2025-03-20'),
      customerId: customer.id,
    },
  });

  // Plans
  await prisma.plan.upsert({
    where: { websiteId: website1.id },
    update: {},
    create: {
      websiteId: website1.id,
      name: 'Professional',
      description: 'Full service website management',
      price: 99.0,
      billingCycle: 'monthly',
      features: JSON.stringify(['Website hosting', 'Database', 'SSL', 'Maintenance', 'Technical support']),
      startDate: new Date('2025-01-15'),
      renewalDate: new Date('2026-01-15'),
    },
  });

  await prisma.plan.upsert({
    where: { websiteId: website2.id },
    update: {},
    create: {
      websiteId: website2.id,
      name: 'Business',
      description: 'E-commerce ready hosting',
      price: 199.0,
      billingCycle: 'monthly',
      features: JSON.stringify(['Website hosting', 'Database', 'SSL', 'CDN', 'Priority support']),
      startDate: new Date('2025-06-01'),
      renewalDate: new Date('2026-06-01'),
    },
  });

  // Hosting
  await prisma.hostingService.upsert({
    where: { websiteId: website1.id },
    update: {},
    create: {
      websiteId: website1.id,
      provider: 'Cloud Hosting',
      status: 'active',
      cost: 25.0,
      billingCycle: 'monthly',
      startDate: new Date('2025-01-15'),
      dueDate: new Date('2026-10-01'),
    },
  });

  await prisma.hostingService.upsert({
    where: { websiteId: website2.id },
    update: {},
    create: {
      websiteId: website2.id,
      provider: 'AWS',
      status: 'active',
      cost: 45.0,
      billingCycle: 'monthly',
      startDate: new Date('2025-06-01'),
      dueDate: new Date('2026-09-15'),
    },
  });

  // Database
  await prisma.databaseService.upsert({
    where: { websiteId: website1.id },
    update: {},
    create: {
      websiteId: website1.id,
      provider: 'PostgreSQL',
      status: 'active',
      monthlyCost: 15.0,
      billingCycle: 'monthly',
      startDate: new Date('2025-01-15'),
      dueDate: new Date('2026-10-01'),
    },
  });

  // Server
  await prisma.serverService.upsert({
    where: { websiteId: website1.id },
    update: {},
    create: {
      websiteId: website1.id,
      provider: 'DigitalOcean',
      status: 'operational',
      plan: '2 vCPU / 4 GB RAM',
      cost: 25.0,
      billingCycle: 'monthly',
      startDate: new Date('2025-01-15'),
      dueDate: new Date('2026-10-01'),
    },
  });

  // Maintenance
  const existingMaintenance = await prisma.maintenanceRecord.findFirst({ where: { websiteId: website1.id, title: 'Monthly security update' } });
  if (!existingMaintenance) {
    await prisma.maintenanceRecord.create({
      data: {
        websiteId: website1.id,
        title: 'Monthly security update',
        description: 'Applied all security patches and updated dependencies',
        items: JSON.stringify(['Security updates', 'Dependency updates', 'Performance check', 'Backup verification']),
        status: 'completed',
        createdById: owner.id,
      },
    });
  }

  // Notifications
  const existingNotif = await prisma.notification.findFirst({ where: { websiteId: website2.id, title: 'Maintenance in progress' } });
  if (!existingNotif) {
    await prisma.notification.create({
      data: {
        websiteId: website2.id,
        customerId: customer.id,
        title: 'Maintenance in progress',
        message: 'E-commerce store is currently under maintenance. Expected completion by 5:00 PM.',
        type: 'MAINTENANCE',
        priority: 'IMPORTANT',
      },
    });

    await prisma.notification.create({
      data: {
        websiteId: website3.id,
        customerId: customer.id,
        title: 'Attention needed',
        message: 'Blog platform has detected unusual traffic patterns. Please review.',
        type: 'WARNING',
        priority: 'URGENT',
      },
    });

    await prisma.notification.create({
      data: {
        websiteId: website1.id,
        customerId: customer.id,
        title: 'Hosting renewal reminder',
        message: 'Your hosting service will be due for renewal in 30 days.',
        type: 'BILLING',
        priority: 'NORMAL',
      },
    });
  }

  // Technician assignments
  const existingAssignment = await prisma.technicianWebsiteAssignment.findFirst({ where: { technicianId: technician.id, websiteId: website1.id } });
  if (!existingAssignment) {
    await prisma.technicianWebsiteAssignment.create({ data: { technicianId: technician.id, websiteId: website1.id } });
    await prisma.technicianWebsiteAssignment.create({ data: { technicianId: technician.id, websiteId: website2.id } });

    await prisma.technicianPermissionRecord.create({ data: { technicianId: technician.id, websiteId: website1.id, permission: 'VIEW_WEBSITE' } });
    await prisma.technicianPermissionRecord.create({ data: { technicianId: technician.id, websiteId: website1.id, permission: 'VIEW_STATUS' } });
    await prisma.technicianPermissionRecord.create({ data: { technicianId: technician.id, websiteId: website1.id, permission: 'VIEW_TECHNICAL_INFO' } });
    await prisma.technicianPermissionRecord.create({ data: { technicianId: technician.id, websiteId: website1.id, permission: 'CREATE_MAINTENANCE' } });
    await prisma.technicianPermissionRecord.create({ data: { technicianId: technician.id, websiteId: website2.id, permission: 'VIEW_WEBSITE' } });
    await prisma.technicianPermissionRecord.create({ data: { technicianId: technician.id, websiteId: website2.id, permission: 'VIEW_STATUS' } });
  }

  // Charges
  const existingCharge = await prisma.additionalCharge.findFirst({ where: { websiteId: website1.id, description: 'SSL Certificate Renewal' } });
  if (!existingCharge) {
    await prisma.additionalCharge.create({
      data: { websiteId: website1.id, description: 'SSL Certificate Renewal', amount: 50.0, date: new Date('2026-03-15'), billingType: 'ONE_TIME', status: 'paid' },
    });
  }

  // Timeline
  const existingTimeline = await prisma.websiteTimeline.findFirst({ where: { websiteId: website1.id, title: 'Website launched' } });
  if (!existingTimeline) {
    await prisma.websiteTimeline.create({ data: { websiteId: website1.id, title: 'Website launched', description: 'Initial website deployment completed', icon: 'rocket' } });
    await prisma.websiteTimeline.create({ data: { websiteId: website1.id, title: 'Hosting renewed', description: 'Hosting service renewed for another year', icon: 'server' } });
    await prisma.websiteTimeline.create({ data: { websiteId: website1.id, title: 'Maintenance completed', description: 'Monthly security update applied', icon: 'check' } });
  }

  console.log('Database seeded successfully!');
  console.log('');
  console.log('Login credentials:');
  console.log('  Owner:      admin@nexusops.com / admin123');
  console.log('  Customer:   john@example.com / customer123');
  console.log('  Technician: mike@nexusops.com / tech123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
