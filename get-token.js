const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const t = await prisma.ticket.findUnique({ where: { id: 'cmsajpxmc000c12emsy13ujgt' } });
  console.log(t.trackingToken);
}
run().catch(console.error).finally(() => prisma.$disconnect());
