const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminPw = await bcrypt.hash('admin123', 10);
  const memberPw = await bcrypt.hash('member123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@teamflow.dev' },
    update: {},
    create: { name: 'Admin User', email: 'admin@teamflow.dev', password: adminPw, role: 'ADMIN' },
  });

  const alice = await prisma.user.upsert({
    where: { email: 'alice@teamflow.dev' },
    update: {},
    create: { name: 'Alice Chen', email: 'alice@teamflow.dev', password: memberPw, role: 'MEMBER' },
  });

  const bob = await prisma.user.upsert({
    where: { email: 'bob@teamflow.dev' },
    update: {},
    create: { name: 'Bob Kumar', email: 'bob@teamflow.dev', password: memberPw, role: 'MEMBER' },
  });

  const project = await prisma.project.upsert({
    where: { id: 'seed-project-1' },
    update: {},
    create: {
      id: 'seed-project-1',
      name: 'TeamFlow Launch',
      description: 'Official product launch project',
      ownerId: admin.id,
      members: {
        createMany: {
          data: [
            { userId: admin.id, role: 'ADMIN' },
            { userId: alice.id, role: 'ADMIN' },
            { userId: bob.id, role: 'MEMBER' },
          ],
          skipDuplicates: true,
        },
      },
    },
  });

  const tasks = [
    { title: 'Design system setup', status: 'DONE', priority: 'HIGH', assigneeId: alice.id },
    { title: 'Auth API implementation', status: 'DONE', priority: 'URGENT', assigneeId: admin.id },
    { title: 'Dashboard UI', status: 'IN_PROGRESS', priority: 'HIGH', assigneeId: alice.id },
    { title: 'Task management CRUD', status: 'IN_PROGRESS', priority: 'HIGH', assigneeId: bob.id },
    { title: 'Write API documentation', status: 'TODO', priority: 'MEDIUM', assigneeId: bob.id },
    { title: 'Deploy to Railway', status: 'TODO', priority: 'URGENT', assigneeId: admin.id,
      dueDate: new Date(Date.now() - 86400000) }, // Yesterday - overdue!
  ];

  for (const t of tasks) {
    await prisma.task.create({
      data: { ...t, projectId: project.id, creatorId: admin.id },
    });
  }

  console.log('Seed complete!');
  console.log('Admin: admin@teamflow.dev / admin123');
  console.log('Member: alice@teamflow.dev / member123');
  console.log('Member: bob@teamflow.dev / member123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
