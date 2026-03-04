"use client";

import { useEffect, useState } from "react";

interface RevenueData {
  totalRevenue: number;
  totalRevenueThb: number;
  totalCustomers: number;
  totalPaidOrders: number;
  aiRevenue: { totalCharged: number; totalCost: number; profit: number };
  revenueByDay: Array<{ date: string; total: number; count: number }>;
}

export default function RevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/revenue")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div className="py-8 text-center text-muted-foreground">Loading...</div>;
  if (!data) return <div className="py-8 text-center text-muted-foreground">Failed to load</div>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Revenue Dashboard</h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Revenue" value={`${data.totalRevenueThb.toLocaleString()} THB`} />
        <StatCard label="Total Customers" value={String(data.totalCustomers)} />
        <StatCard label="Paid Orders" value={String(data.totalPaidOrders)} />
        <StatCard label="AI Profit" value={`${(data.aiRevenue.profit / 100).toLocaleString()} THB`} />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="AI Charged" value={`${(data.aiRevenue.totalCharged / 100).toLocaleString()} THB`} />
        <StatCard label="AI Cost" value={`${(data.aiRevenue.totalCost / 100).toLocaleString()} THB`} />
        <StatCard label="AI Margin" value={data.aiRevenue.totalCharged > 0 ? `${((data.aiRevenue.profit / data.aiRevenue.totalCharged) * 100).toFixed(0)}%` : "0%"} />
      </div>

      <h2 className="mb-4 text-lg font-semibold">Revenue by Day</h2>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-right font-medium">Revenue (THB)</th>
              <th className="px-4 py-3 text-right font-medium">Orders</th>
            </tr>
          </thead>
          <tbody>
            {data.revenueByDay.map((day) => (
              <tr key={day.date} className="border-t">
                <td className="px-4 py-3">{day.date}</td>
                <td className="px-4 py-3 text-right font-medium">{(day.total / 100).toLocaleString()}</td>
                <td className="px-4 py-3 text-right">{day.count}</td>
              </tr>
            ))}
            {data.revenueByDay.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">No revenue data yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
