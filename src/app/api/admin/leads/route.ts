import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

async function isAuthed() {
  const session = await auth();
  return !!session?.user;
}

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const allLeads = await db
      .select()
      .from(leads)
      .orderBy(desc(leads.createdAt));

    return NextResponse.json(allLeads);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, status } = await req.json();
    const [updated] = await db
      .update(leads)
      .set({ status })
      .where(eq(leads.id, id))
      .returning();

    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
