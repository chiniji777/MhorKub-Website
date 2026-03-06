import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { db } from "@/db";
import { aiUsageLogs, customers } from "@/db/schema";
import { desc, sql, eq } from "drizzle-orm";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [stats] = await db
      .select({
        totalRequests: sql<number>`count(*)`,
        totalCost: sql<number>`coalesce(sum(${aiUsageLogs.costSatang}), 0)`,
        totalCharged: sql<number>`coalesce(sum(${aiUsageLogs.chargedSatang}), 0)`,
        totalPromptTokens: sql<number>`coalesce(sum(${aiUsageLogs.promptTokens}), 0)`,
        totalCompletionTokens: sql<number>`coalesce(sum(${aiUsageLogs.completionTokens}), 0)`,
      })
      .from(aiUsageLogs);

    // Usage by model
    const byModel = await db
      .select({
        model: aiUsageLogs.model,
        count: sql<number>`count(*)`,
        totalCharged: sql<number>`sum(${aiUsageLogs.chargedSatang})`,
        totalCost: sql<number>`sum(${aiUsageLogs.costSatang})`,
      })
      .from(aiUsageLogs)
      .groupBy(aiUsageLogs.model)
      .orderBy(desc(sql`sum(${aiUsageLogs.chargedSatang})`));

    // Recent usage
    const recent = await db
      .select({
        id: aiUsageLogs.id,
        customerEmail: customers.email,
        model: aiUsageLogs.model,
        promptTokens: aiUsageLogs.promptTokens,
        completionTokens: aiUsageLogs.completionTokens,
        chargedSatang: aiUsageLogs.chargedSatang,
        createdAt: aiUsageLogs.createdAt,
      })
      .from(aiUsageLogs)
      .leftJoin(customers, eq(customers.id, aiUsageLogs.customerId))
      .orderBy(desc(aiUsageLogs.createdAt))
      .limit(50);

    return NextResponse.json({
      stats: {
        ...stats,
        profit: stats.totalCharged - stats.totalCost,
      },
      byModel,
      recent,
    });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
