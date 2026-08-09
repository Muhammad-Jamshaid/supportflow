const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const ticket = await prisma.ticket.findFirst({ select: { trackingToken: true } });
  console.log('Token:', ticket.trackingToken);
}
run().catch(console.error).finally(() => prisma.$disconnect());
