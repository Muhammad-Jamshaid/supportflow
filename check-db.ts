import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const c = await prisma.company.findMany({ select: { id: true, plan: true, stripeSubscriptionId: true, stripePriceId: true } });
  console.log(c);
}
main().finally(() => prisma.$disconnect());
