import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const c = await prisma.company.findMany({ where: { plan: 'TEAM' } });
  console.log('TEAM companies:', c);
}
main().finally(() => prisma.$disconnect());
