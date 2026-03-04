import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

function createDb() {
  if (!databaseUrl) {
    // Return a proxy that throws helpful errors at runtime (not build time)
    return new Proxy({} as ReturnType<typeof drizzle>, {
      get() {
        throw new Error("DATABASE_URL is not set. Please configure it in your environment variables.");
      },
    });
  }
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

export const db = createDb();
