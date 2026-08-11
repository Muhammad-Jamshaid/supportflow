import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-07-29.dahlia", // Matching the typing
});

async function main() {
  const subs = await stripe.subscriptions.list({ limit: 1 });
  if (subs.data.length > 0) {
    const sub = subs.data[0];
    console.log("Item Keys:", Object.keys(sub.items.data[0]));
    console.log("Item current_period_end:", (sub.items.data[0] as any).current_period_end);
  } else {
    console.log("No subscriptions found in test mode to inspect.");
  }
}
main();
