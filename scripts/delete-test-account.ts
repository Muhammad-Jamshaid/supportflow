import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = "jamshaidmiraj786@gmail.com";
  console.log(`Looking for user ${email}...`);

  const user = await prisma.user.findUnique({
    where: { email },
    include: { company: true }
  });

  if (!user) {
    console.log(`User ${email} not found.`);
    return;
  }

  const companyId = user.companyId;

  // Check if they are the only user in the company
  const usersInCompany = await prisma.user.count({
    where: { companyId }
  });

  const shouldDeleteCompany = usersInCompany === 1;

  if (shouldDeleteCompany) {
    console.log(`Deleting company ${user.company.name} and all associated data...`);
    
    // Delete in order to avoid foreign key constraints
    await prisma.notification.deleteMany({ where: { userId: user.id } });
    await prisma.activityLog.deleteMany({ where: { companyId } });
    await prisma.attachment.deleteMany({ where: { companyId } });
    await prisma.reply.deleteMany({ where: { companyId } });
    await prisma.ticket.deleteMany({ where: { companyId } });
    await prisma.inviteToken.deleteMany({ where: { companyId } });
    
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.company.delete({ where: { id: companyId } });
    
    console.log(`Successfully deleted user and company.`);
  } else {
    console.log(`User belongs to a company with other users. Just deleting the user...`);
    await prisma.notification.deleteMany({ where: { userId: user.id } });
    await prisma.activityLog.deleteMany({ where: { userId: user.id } });
    await prisma.reply.deleteMany({ where: { userId: user.id } });
    
    // Unassign tickets
    await prisma.ticket.updateMany({
      where: { assignedAgentId: user.id },
      data: { assignedAgentId: null }
    });
    
    await prisma.user.delete({ where: { id: user.id } });
    console.log(`Successfully deleted user only.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
