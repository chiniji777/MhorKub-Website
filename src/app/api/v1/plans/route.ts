import { NextResponse } from "next/server";
import { db } from "@/db";
import { plans } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const activePlans = await db
    .select()
    .from(plans)
    .where(eq(plans.active, true));

  return NextResponse.json(activePlans);
}
