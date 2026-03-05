import Stripe from "stripe";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq } from "drizzle-orm";

// Lazy-initialize to avoid build-time error when env is missing
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-02-25.clover",
    });
  }
  return _stripe;
}

/**
 * Get or create a Stripe Customer for a local customer.
 * Saves stripeCustomerId back to the DB.
 */
export async function getOrCreateStripeCustomer(
  customerId: number,
  email: string,
  name: string
): Promise<string> {
  // Check if already has stripeCustomerId
  const [customer] = await db
    .select({ stripeCustomerId: customers.stripeCustomerId })
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);

  if (customer?.stripeCustomerId) {
    return customer.stripeCustomerId;
  }

  // Create Stripe Customer
  const stripeCustomer = await getStripe().customers.create({
    email,
    name,
    metadata: { mhorkubCustomerId: String(customerId) },
  });

  // Save to DB
  await db
    .update(customers)
    .set({ stripeCustomerId: stripeCustomer.id })
    .where(eq(customers.id, customerId));

  return stripeCustomer.id;
}
