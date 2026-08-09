const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('testpass123', 10);
  await prisma.user.update({
    where: { email: 'devsinc@gmail.com' },
    data: { passwordHash: hashedPassword }
  });
  
  const ticket = await prisma.ticket.findFirst();
  console.log('RESET_SUCCESS');
  if (ticket) console.log('TICKET_ID=' + ticket.id);
}

main().catch(console.error).finally(() => prisma.$disconnect());
