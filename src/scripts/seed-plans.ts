import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../db/schema";

async function seedPlans() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema });

  const seedData = [
    { name: "Trial", durationDays: 14, priceThb: 0 },
    { name: "Monthly", durationDays: 30, priceThb: 120000 },
    { name: "90 Days", durationDays: 90, priceThb: 330000 },
    { name: "180 Days", durationDays: 180, priceThb: 600000 },
    { name: "Yearly", durationDays: 365, priceThb: 1000000 },
  ];

  for (const plan of seedData) {
    const [result] = await db
      .insert(schema.plans)
      .values(plan)
      .onConflictDoNothing()
      .returning();

    if (result) {
      console.log(`Plan created: ${result.name} (${result.durationDays}d, ${result.priceThb / 100} THB)`);
    } else {
      console.log(`Plan "${plan.name}" already exists.`);
    }
  }
}

seedPlans();
