import { requireAdmin } from "@/lib/auth";
import { db } from "@/db";
import { leads, posts, pageViews } from "@/db/schema";
import { sql, eq } from "drizzle-orm";
import { Users, FileText, Eye, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  await requireAdmin();

  let stats = { totalLeads: 0, newLeads: 0, totalPosts: 0, totalViews: 0 };

  try {
    const [leadCount] = await db.select({ count: sql<number>`count(*)` }).from(leads);
    const [newLeadCount] = await db.select({ count: sql<number>`count(*)` }).from(leads).where(eq(leads.status, "new"));
    const [postCount] = await db.select({ count: sql<number>`count(*)` }).from(posts);
    const [viewCount] = await db.select({ count: sql<number>`count(*)` }).from(pageViews);

    stats = {
      totalLeads: Number(leadCount.count),
      newLeads: Number(newLeadCount.count),
      totalPosts: Number(postCount.count),
      totalViews: Number(viewCount.count),
    };
  } catch {
    // DB not connected yet — show zeros
  }

  const cards = [
    { label: "Leads ทั้งหมด", value: stats.totalLeads, sub: `${stats.newLeads} ใหม่`, icon: Users, color: "text-cyan-600 bg-cyan-50" },
    { label: "บทความ", value: stats.totalPosts, sub: "posts", icon: FileText, color: "text-green-600 bg-green-50" },
    { label: "Page Views", value: stats.totalViews, sub: "total", icon: Eye, color: "text-purple-600 bg-purple-50" },
    { label: "Conversion", value: stats.totalViews > 0 ? `${((stats.totalLeads / stats.totalViews) * 100).toFixed(1)}%` : "0%", sub: "leads/views", icon: TrendingUp, color: "text-orange-600 bg-orange-50" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
      <p className="mt-1 text-sm text-muted">ภาพรวมของ MhorKub Website</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted">{card.label}</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{card.value}</p>
                <p className="mt-0.5 text-xs text-muted">{card.sub}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.color}`}>
                <card.icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-foreground">เริ่มต้นใช้งาน</h2>
        <div className="mt-4 space-y-3 text-sm text-muted">
          <p>1. ตั้งค่า <code className="rounded bg-background px-1.5 py-0.5 text-xs font-mono">DATABASE_URL</code> ใน Vercel Environment Variables</p>
          <p>2. ตั้งค่า <code className="rounded bg-background px-1.5 py-0.5 text-xs font-mono">ADMIN_SECRET</code> สำหรับ login</p>
          <p>3. Run <code className="rounded bg-background px-1.5 py-0.5 text-xs font-mono">npx drizzle-kit push</code> เพื่อสร้าง tables</p>
          <p>4. เริ่มสร้าง blog posts และดู leads จาก contact form</p>
        </div>
      </div>
    </div>
  );
}
