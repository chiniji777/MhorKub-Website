import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { pageViews, leads } from "@/db/schema";
import { sql, desc } from "drizzle-orm";

async function isAuthed() {
  const session = await auth();
  return !!session?.user;
}

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [viewCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(pageViews);

    const [leadCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(leads);

    const topPages = await db
      .select({
        path: pageViews.path,
        count: sql<number>`count(*)`,
      })
      .from(pageViews)
      .groupBy(pageViews.path)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    const recentViews = await db
      .select()
      .from(pageViews)
      .orderBy(desc(pageViews.createdAt))
      .limit(20);

    const viewsByDay = await db
      .select({
        date: sql<string>`to_char(created_at, 'YYYY-MM-DD')`,
        count: sql<number>`count(*)`,
      })
      .from(pageViews)
      .groupBy(sql`to_char(created_at, 'YYYY-MM-DD')`)
      .orderBy(desc(sql`to_char(created_at, 'YYYY-MM-DD')`))
      .limit(30);

    return NextResponse.json({
      totalViews: viewCount.count,
      totalLeads: leadCount.count,
      topPages,
      recentViews,
      viewsByDay,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
