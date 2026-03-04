"use client";

import { useEffect, useState } from "react";
import { Eye, Users, TrendingUp, Globe } from "lucide-react";

interface AnalyticsData {
  totalViews: number;
  totalLeads: number;
  topPages: { path: string; count: number }[];
  viewsByDay: { date: string; count: number }[];
  recentViews: { id: number; path: string; referrer: string | null; userAgent: string | null; createdAt: string }[];
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      const res = await fetch("/api/admin/analytics");
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="py-20 text-center text-muted">กำลังโหลด...</div>;
  }

  if (!data) {
    return <div className="py-20 text-center text-muted">ไม่สามารถโหลดข้อมูลได้</div>;
  }

  const conversionRate = data.totalViews > 0
    ? ((data.totalLeads / data.totalViews) * 100).toFixed(1)
    : "0";

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
      <p className="mt-1 text-sm text-muted">สถิติการเข้าชมเว็บไซต์</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <Eye size={20} />
            </div>
            <div>
              <p className="text-sm text-muted">Page Views</p>
              <p className="text-2xl font-bold text-foreground">{Number(data.totalViews).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Users size={20} />
            </div>
            <div>
              <p className="text-sm text-muted">Leads</p>
              <p className="text-2xl font-bold text-foreground">{Number(data.totalLeads).toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <TrendingUp size={20} />
            </div>
            <div>
              <p className="text-sm text-muted">Conversion Rate</p>
              <p className="text-2xl font-bold text-foreground">{conversionRate}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Top Pages */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="flex items-center gap-2 font-semibold text-foreground">
            <Globe size={18} /> หน้าที่มีคนเข้าชมมากที่สุด
          </h2>
          <div className="mt-4 space-y-2">
            {data.topPages.length === 0 ? (
              <p className="text-sm text-muted">ยังไม่มีข้อมูล</p>
            ) : (
              data.topPages.map((page, i) => {
                const maxCount = data.topPages[0]?.count || 1;
                const pct = (Number(page.count) / Number(maxCount)) * 100;
                return (
                  <div key={i} className="relative">
                    <div
                      className="absolute inset-y-0 left-0 rounded bg-primary/5"
                      style={{ width: `${pct}%` }}
                    />
                    <div className="relative flex items-center justify-between px-3 py-2 text-sm">
                      <span className="font-mono text-foreground">{page.path}</span>
                      <span className="font-semibold text-primary">{Number(page.count).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Views by Day */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="flex items-center gap-2 font-semibold text-foreground">
            <Eye size={18} /> Views รายวัน (30 วันล่าสุด)
          </h2>
          <div className="mt-4 space-y-1.5">
            {data.viewsByDay.length === 0 ? (
              <p className="text-sm text-muted">ยังไม่มีข้อมูล</p>
            ) : (
              data.viewsByDay.slice(0, 14).map((day, i) => {
                const maxCount = Math.max(...data.viewsByDay.map((d) => Number(d.count)));
                const pct = maxCount > 0 ? (Number(day.count) / maxCount) * 100 : 0;
                return (
                  <div key={i} className="flex items-center gap-3 text-sm">
                    <span className="w-24 shrink-0 text-xs text-muted">{day.date}</span>
                    <div className="flex-1">
                      <div className="h-5 rounded bg-primary/10">
                        <div
                          className="h-5 rounded bg-primary/40"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <span className="w-10 text-right text-xs font-semibold text-foreground">{day.count}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
