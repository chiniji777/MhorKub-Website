import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { customers, licenses } from "@/db/schema";
import { desc, ilike, sql, eq, and, gte } from "drizzle-orm";

async function isAuthed() {
  const session = await auth();
  return !!session?.user;
}

export async function GET(req: NextRequest) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const search = req.nextUrl.searchParams.get("search") || "";
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  try {
    const whereClause = search
      ? ilike(customers.email, `%${search}%`)
      : undefined;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(whereClause);

    const data = await db
      .select()
      .from(customers)
      .where(whereClause)
      .orderBy(desc(customers.createdAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      customers: data,
      total: countResult.count,
      page,
      totalPages: Math.ceil(countResult.count / limit),
    });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
