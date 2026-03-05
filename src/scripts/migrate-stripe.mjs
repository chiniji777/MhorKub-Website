import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log("Running Stripe schema migration...");

  // 1. Add stripe_customer_id to customers
  await sql`ALTER TABLE customers ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE`;
  console.log("✓ customers.stripe_customer_id added");

  // 2. Add stripe_price_id to plans
  await sql`ALTER TABLE plans ADD COLUMN IF NOT EXISTS stripe_price_id text`;
  console.log("✓ plans.stripe_price_id added");

  // 3. Add columns to licenses
  await sql`ALTER TABLE licenses ADD COLUMN IF NOT EXISTS stripe_subscription_id text`;
  await sql`ALTER TABLE licenses ADD COLUMN IF NOT EXISTS auto_renew boolean DEFAULT false NOT NULL`;
  console.log("✓ licenses.stripe_subscription_id + auto_renew added");

  // 4. Make orders.promptpay_ref nullable
  await sql`ALTER TABLE orders ALTER COLUMN promptpay_ref DROP NOT NULL`;
  console.log("✓ orders.promptpay_ref now nullable");

  // 5. Add Stripe columns to orders
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'promptpay' NOT NULL`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_subscription_id text`;
  await sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_invoice_id text`;
  console.log("✓ orders Stripe columns added");

  console.log("\n✅ Migration complete!");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
