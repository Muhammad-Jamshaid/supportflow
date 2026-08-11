import { PrismaClient } from "@prisma/client";
import Stripe from "stripe";
import { loadEnvConfig } from "@next/env";
import * as path from "path";

// Load environment variables from .env file
loadEnvConfig(process.cwd());

const prisma = new PrismaClient();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-07-29.dahlia", // Matches installed Stripe SDK version
});

async function main() {
  console.log("Starting full database reset...");

  // 1. Cancel active test subscriptions in Stripe
  console.log("Checking for active Stripe subscriptions to cancel...");
  const companiesWithSubscriptions = await prisma.company.findMany({
    where: {
      stripeSubscriptionId: { not: null },
    },
  });

  console.log(`Found ${companiesWithSubscriptions.length} subscriptions to cancel in Stripe.`);
  for (const company of companiesWithSubscriptions) {
    if (company.stripeSubscriptionId) {
      try {
        console.log(`Canceling subscription ${company.stripeSubscriptionId} for company ${company.name}...`);
        await stripe.subscriptions.cancel(company.stripeSubscriptionId);
        console.log(`Successfully canceled ${company.stripeSubscriptionId}`);
      } catch (error: any) {
        console.error(`Failed to cancel subscription ${company.stripeSubscriptionId}:`, error.message);
      }
    }
  }

  // 2. Clear all database tables
  console.log("Clearing database tables...");
  
  // Deleting in this order avoids foreign key constraint errors.
  // Note: Company cascade deletes its relations, but we clear them explicitly for safety.
  await prisma.notification.deleteMany();
  console.log("- Cleared notifications");
  
  await prisma.activityLog.deleteMany();
  console.log("- Cleared activity_logs");
  
  await prisma.attachment.deleteMany();
  console.log("- Cleared attachments");
  
  await prisma.reply.deleteMany();
  console.log("- Cleared replies");
  
  await prisma.ticket.deleteMany();
  console.log("- Cleared tickets");
  
  await prisma.inviteToken.deleteMany();
  console.log("- Cleared invite_tokens");
  
  await prisma.user.deleteMany();
  console.log("- Cleared users");
  
  await prisma.company.deleteMany();
  console.log("- Cleared companies");

  console.log("Database reset complete.");
}

main()
  .catch((e) => {
    console.error("Error during reset:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
