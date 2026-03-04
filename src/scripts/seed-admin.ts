import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import bcrypt from "bcryptjs";
import * as schema from "../db/schema";

async function seedAdmin() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }

  const sql = neon(databaseUrl);
  const db = drizzle(sql, { schema });

  const email = process.argv[2] || "admin@mhorkub.com";
  const password = process.argv[3] || "admin123456";
  const name = process.argv[4] || "Admin";

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const [user] = await db
      .insert(schema.adminUsers)
      .values({ email, passwordHash, name })
      .onConflictDoNothing()
      .returning();

    if (user) {
      console.log(`Admin created: ${user.email} (id: ${user.id})`);
    } else {
      console.log(`Admin with email ${email} already exists.`);
    }
  } catch (error) {
    console.error("Failed to seed admin:", error);
    process.exit(1);
  }
}

seedAdmin();
