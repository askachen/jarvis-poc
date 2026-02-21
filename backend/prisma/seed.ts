import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const adminPassword = await bcrypt.hash('admin1234', 10);
  const userPassword = await bcrypt.hash('user1234', 10);

  await prisma.user.upsert({
    where: { email: 'admin@jarvis.local' },
    update: {},
    create: {
      email: 'admin@jarvis.local',
      passwordHash: adminPassword,
      role: 'admin',
    },
  });

  await prisma.user.upsert({
    where: { email: 'user@jarvis.local' },
    update: {},
    create: {
      email: 'user@jarvis.local',
      passwordHash: userPassword,
      role: 'user',
    },
  });

  console.log('Seed complete. Accounts created:');
  console.log('  admin@jarvis.local / admin1234');
  console.log('  user@jarvis.local / user1234');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
