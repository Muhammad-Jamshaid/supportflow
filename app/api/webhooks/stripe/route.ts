/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import { Plan } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!.trim()
    );
  } catch (error: any) {
    console.error(`[Webhook] Signature verification failed:`, error.message);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  console.log(`[Webhook] Processing event: ${event.type}`);

  const session = event.data.object as Stripe.Checkout.Session;
  const subscription = event.data.object as Stripe.Subscription;

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const companyId = session.metadata?.companyId;
        if (!companyId) {
          console.error("[Webhook] No companyId in metadata for session", session.id);
          break;
        }

        const stripeSubscriptionId = session.subscription as string;
        if (!stripeSubscriptionId) {
          console.error("[Webhook] No subscription ID found on session", session.id);
          break;
        }

        const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
        const stripePriceId = sub.items.data[0].price.id;
        
        let plan: Plan = "FREE";
        if (stripePriceId === process.env.STRIPE_PRO_PRICE_ID?.trim()) plan = "PRO";
        else if (stripePriceId === process.env.STRIPE_TEAM_PRICE_ID?.trim()) plan = "TEAM";
        else {
          console.warn(`[Webhook] Unrecognized price ID: ${stripePriceId}`);
        }

        console.log(`[Webhook] Updating company ${companyId} to plan ${plan}`);

        await prisma.company.update({
          where: { id: companyId },
          data: {
            stripeSubscriptionId: sub.id,
            stripeCustomerId: sub.customer as string,
            stripePriceId: stripePriceId,
            stripeCurrentPeriodEnd: new Date((sub as any).current_period_end * 1000),
            plan: plan as any,
          },
        });
        
        revalidatePath("/settings");
        revalidatePath("/settings/billing");
        break;
      }
      case "customer.subscription.updated": {
        const stripeSubscriptionId = subscription.id;
        const stripePriceId = subscription.items.data[0].price.id;

        let plan: Plan = "FREE";
        if (stripePriceId === process.env.STRIPE_PRO_PRICE_ID?.trim()) plan = "PRO";
        else if (stripePriceId === process.env.STRIPE_TEAM_PRICE_ID?.trim()) plan = "TEAM";

        console.log(`[Webhook] Subscription updated ${stripeSubscriptionId} to plan ${plan}`);

        await prisma.company.updateMany({
          where: { stripeSubscriptionId },
          data: {
            stripePriceId,
            stripeCurrentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
            plan: plan as any,
          },
        });
        
        revalidatePath("/settings");
        revalidatePath("/settings/billing");
        break;
      }
      case "customer.subscription.deleted": {
        const stripeSubscriptionId = subscription.id;
        
        console.log(`[Webhook] Subscription deleted ${stripeSubscriptionId}`);

        await prisma.company.updateMany({
          where: { stripeSubscriptionId },
          data: {
            plan: "FREE",
            stripeSubscriptionId: null,
            stripePriceId: null,
            stripeCurrentPeriodEnd: null,
          },
        });
        
        revalidatePath("/settings");
        revalidatePath("/settings/billing");
        break;
      }
    }

    return new NextResponse("Webhook processed", { status: 200 });
  } catch (error: any) {
    console.error("[Webhook] Processing error:", error);
    return new NextResponse(`Error processing webhook: ${error.message}`, { status: 500 });
  }
}
