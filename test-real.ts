import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  console.log("=== 1. Warming up Next.js route ===");
  await fetch("http://localhost:3000/api/test-submit", { method: "POST" });
  console.log("Warmup complete.\n");

  console.log("=== 2. Testing non-blocking submission response time ===");
  
  const start = Date.now();
  const res = await fetch("http://localhost:3000/api/test-submit", { method: "POST" });
  const end = Date.now();
  
  if (!res.ok) {
    console.error("Failed to submit:", await res.text());
    process.exit(1);
  }
  
  const data = await res.json();
  const httpTimeMs = end - start;
  
  console.log(`HTTP Request completely finished in: ${httpTimeMs}ms`);
  console.log(`Action internally measured time: ${data.timeMs}ms`);
  console.log(`Ticket ID returned: ${data.result.ticketId}`);
  
  console.log("\n=== 2. Waiting for AI to populate in the background ===");
  console.log("Waiting 5 seconds to let Groq finish...");
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const ticket = await prisma.ticket.findUnique({
    where: { id: data.result.ticketId }
  });
  
  console.log("\n=== 3. Final Ticket DB Record ===");
  console.log({
    id: ticket?.id,
    subject: ticket?.subject,
    priority: ticket?.priority,
    aiSummary: ticket?.aiSummary,
    aiCategory: ticket?.aiCategory,
    aiSuggestedReply: ticket?.aiSuggestedReply
  });
}

run().catch(console.error).finally(() => prisma.$disconnect());
