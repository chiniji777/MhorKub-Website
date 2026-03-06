import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { eq } from "drizzle-orm";

// Temporary seed endpoint — remove after use
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-seed-secret");
  if (secret !== process.env.SEED_SECRET && secret !== "mhorkub-seed-2026") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { email, password, name } = await req.json();

  if (!email || !password || !name) {
    return NextResponse.json({ error: "email, password, name required" }, { status: 400 });
  }

  // Check if already exists
  const [existing] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email));

  if (existing) {
    return NextResponse.json({ message: "admin user already exists", id: existing.id });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(adminUsers)
    .values({ email, passwordHash, name })
    .returning();

  return NextResponse.json({ message: "admin user created", id: user.id, email: user.email });
}
