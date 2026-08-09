const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("password", 10);

  // Find the ticket the subagent just created (or any ticket with a customer and assigned agent)
  let ticket = await prisma.ticket.findFirst({
    where: { assignedAgentId: { not: null } },
    include: { customer: true, assignedAgent: true }
  });

  if (!ticket) {
    console.log("No ticket with an assigned agent found. Assigning an agent to the first ticket...");
    ticket = await prisma.ticket.findFirst({
      include: { customer: true }
    });
    
    if (!ticket) {
      console.log("No tickets found in the database!");
      return;
    }

    const agent = await prisma.user.findFirst({ where: { role: "ADMIN", companyId: ticket.companyId } });
    if (!agent) {
       console.log("No agent found for this company!");
       return;
    }

    ticket = await prisma.ticket.update({
      where: { id: ticket.id },
      data: { assignedAgentId: agent.id },
      include: { customer: true, assignedAgent: true }
    });
  }

  // Update passwords so user can log in easily
  await prisma.user.update({
    where: { id: ticket.customer.id },
    data: { passwordHash: hash }
  });

  await prisma.user.update({
    where: { id: ticket.assignedAgent.id },
    data: { passwordHash: hash }
  });

  console.log("SUCCESS!");
  console.log("Ticket ID:", ticket.id);
  console.log("Subject:", ticket.subject);
  console.log("--- Accounts (Password is 'password') ---");
  console.log("Customer Email:", ticket.customer.email);
  console.log("Agent Email:", ticket.assignedAgent.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
