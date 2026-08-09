import { stripe } from "./lib/stripe";
import { prisma } from "./lib/prisma";

async function simulateWebhook() {
  // Let's create a checkout session and then simulate the DB update part to see if it throws any Prisma errors
  const company = await prisma.company.findFirst({ where: { plan: 'FREE' } });
  if (!company) { console.log("No free company"); return; }
  
  console.log("Simulating for company:", company.id);
  
  const plan = "PRO";
  const stripeSubscriptionId = "sub_test_123";
  const stripeCustomerId = "cus_test_123";
  const stripePriceId = "price_test_123";
  const currentPeriodEnd = new Date();
  
  try {
    await prisma.company.update({
      where: { id: company.id },
      data: {
        stripeSubscriptionId,
        stripeCustomerId,
        stripePriceId,
        stripeCurrentPeriodEnd: currentPeriodEnd,
        plan: plan as any,
      },
    });
    console.log("DB update successful");
  } catch (err) {
    console.error("DB update error:", err);
  }
}

simulateWebhook().finally(() => prisma.$disconnect());
