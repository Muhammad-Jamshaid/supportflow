const { PrismaClient } = require('@prisma/client');
const { ticketWhere } = require('./lib/ticket-rbac.ts'); // Wait, require won't work on TS directly without ts-node or similar.

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { id: true, name: true, role: true, companyId: true } });
  console.log("Users:", users.map(u => `${u.name} (${u.role}) ID: ${u.id}`));

  const admin = users.find(u => u.role === "ADMIN" && u.name === "Jamshaid");
  const customer1 = users.find(u => u.role === "CUSTOMER");
  const customer2 = users.filter(u => u.role === "CUSTOMER")[1] || customer1; // If there's another customer

  console.log("Using Admin:", admin.name);
  console.log("Using Customer1:", customer1.name);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const tickets = await prisma.ticket.findMany({ select: { id: true, subject: true, customerId: true, archived: true, status: true, companyId: true } });
  console.log("All tickets:", tickets);

  // Stats for Admin
  const openCount = await prisma.ticket.count({
    where: { status: "OPEN", companyId: admin.companyId, archived: false },
  });
  const resolvedCount = await prisma.ticket.count({
    where: { status: "RESOLVED", updatedAt: { gte: todayStart }, companyId: admin.companyId, archived: false },
  });
  console.log(`Admin (${admin.companyId}) Stats -> Open: ${openCount}, Resolved Today: ${resolvedCount}`);


  if (tickets.length > 0) {
    // Archive the first ticket owned by customer1
    let targetTicket = tickets.find(t => t.customerId === customer1.id);
    if (!targetTicket) targetTicket = tickets[0];

    console.log(`Archiving ticket: ${targetTicket.subject}`);
    await prisma.ticket.update({
      where: { id: targetTicket.id },
      data: { archived: true }
    });

    // Verify 404 for customer2 (or customer1 if no other customer, wait, we need a DIFFERENT customer)
    if (customer2 && customer2.id !== targetTicket.customerId) {
      console.log(`Testing access for Customer2 (${customer2.name}) to Archived ticket (${targetTicket.subject})`);
      const fetchAttempt = await prisma.ticket.findFirst({
        where: {
          id: targetTicket.id,
          companyId: customer2.companyId,
          customerId: customer2.id,
          // includeArchived is passed in page.tsx as { archived: false } removed, so no archived filter here!
        }
      });
      console.log("Result for different customer (should be null):", fetchAttempt);
    } else {
       console.log("Could not find a different customer to test with.");
    }
  }
}

main().finally(() => prisma.$disconnect());
