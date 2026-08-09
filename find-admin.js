const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const u = await prisma.user.findFirst({ where: { role: 'ADMIN' }, include: { company: true }});
  console.log("Admin Email:", u?.email, "Plan:", u?.company?.plan);
}
main().finally(() => prisma.$disconnect());
