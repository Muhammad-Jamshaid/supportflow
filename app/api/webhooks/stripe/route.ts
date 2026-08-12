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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Webhook signature error";
    console.error(`[Webhook] Signature verification failed:`, error);
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
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

        const currentPeriodEnd = (sub as Stripe.Subscription & { current_period_end?: number }).current_period_end
          ?? (sub.items?.data?.[0] as (Stripe.SubscriptionItem & { current_period_end?: number }))?.current_period_end;
        if (!currentPeriodEnd) {
          throw new Error(`Could not find current_period_end on subscription ${sub.id}`);
        }

        await prisma.company.update({
          where: { id: companyId },
          data: {
            stripeSubscriptionId: sub.id,
            stripeCustomerId: sub.customer as string,
            stripePriceId: stripePriceId,
            stripeCurrentPeriodEnd: new Date(currentPeriodEnd * 1000),
            plan: plan,
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

        const currentPeriodEnd = (subscription as Stripe.Subscription & { current_period_end?: number }).current_period_end
          ?? (subscription.items?.data?.[0] as (Stripe.SubscriptionItem & { current_period_end?: number }))?.current_period_end;
        if (!currentPeriodEnd) {
          throw new Error(`Could not find current_period_end on subscription ${stripeSubscriptionId}`);
        }

        await prisma.company.updateMany({
          where: { stripeSubscriptionId },
          data: {
            stripePriceId,
            stripeCurrentPeriodEnd: new Date(currentPeriodEnd * 1000),
            plan: plan,
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown webhook error";
    console.error("[Webhook] Processing error:", error);
    return new NextResponse(`Error processing webhook: ${message}`, { status: 500 });
  }
}
