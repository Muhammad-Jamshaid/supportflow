import { triageTicket } from "./lib/ai";
import { prisma } from "./lib/prisma";

async function runTest() {
  console.log("=== Testing AI Triage with Real Key ===");
  
  const company = await prisma.company.findFirst();
  if (!company) {
    console.error("No company found to create a ticket.");
    return;
  }
  
  // Find or create a user to associate with the test ticket
  let customer = await prisma.user.findFirst({ where: { role: "CUSTOMER" } });
  if (!customer) {
      console.error("No customer found");
      return;
  }

  // Create a real ticket to test the update
  const ticket = await prisma.ticket.create({
    data: {
      subject: "My billing is completely wrong for this month",
      description: "I was charged $500 instead of $50. I demand a refund immediately and this needs to be escalated. My account should be on the Free tier.",
      status: "OPEN",
      priority: "NORMAL",
      companyId: company.id,
      customerId: customer.id,
    }
  });

  console.log(`Created test ticket: ${ticket.id}`);
  console.log("Starting triage... waiting for response");
  
  const startTime = Date.now();
  await triageTicket(ticket.id, ticket.subject, ticket.description);
  const endTime = Date.now();
  
  console.log(`\nTriage completed in ${endTime - startTime}ms.`);
  
  // Verify in DB
  const updatedTicket = await prisma.ticket.findUnique({ where: { id: ticket.id }});
  
  console.log("=== Final DB Record ===");
  console.log(JSON.stringify({
    id: updatedTicket?.id,
    subject: updatedTicket?.subject,
    priority: updatedTicket?.priority,
    aiSummary: updatedTicket?.aiSummary,
    aiCategory: updatedTicket?.aiCategory,
    aiSuggestedReply: updatedTicket?.aiSuggestedReply
  }, null, 2));
}

runTest().catch(console.error).finally(() => prisma.$disconnect());
