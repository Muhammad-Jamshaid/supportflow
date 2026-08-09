const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const t = await prisma.ticket.findFirst({ where: { NOT: { aiCategory: null } } });
  console.log(t.id);
}
run().catch(console.error).finally(() => { prisma.$disconnect(); });
