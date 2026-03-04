"use client";

import { useEffect, useState } from "react";

interface AIData {
  stats: {
    totalRequests: number;
    totalCost: number;
    totalCharged: number;
    totalPromptTokens: number;
    totalCompletionTokens: number;
    profit: number;
  };
  byModel: Array<{ model: string; count: number; totalCharged: number; totalCost: number }>;
  recent: Array<{
    id: number;
    customerEmail: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    chargedSatang: number;
    createdAt: string;
  }>;
}

export default function AIUsagePage() {
  const [data, setData] = useState<AIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/ai-usage")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div className="py-8 text-center text-muted-foreground">Loading...</div>;
  if (!data) return <div className="py-8 text-center text-muted-foreground">Failed to load</div>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">AI Usage</h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Requests" value={String(data.stats.totalRequests)} />
        <StatCard label="Total Charged" value={`${(data.stats.totalCharged / 100).toLocaleString()} THB`} />
        <StatCard label="Total Cost" value={`${(data.stats.totalCost / 100).toLocaleString()} THB`} />
        <StatCard label="Profit" value={`${(data.stats.profit / 100).toLocaleString()} THB`} />
      </div>

      {data.byModel.length > 0 && (
        <>
          <h2 className="mb-4 text-lg font-semibold">Usage by Model</h2>
          <div className="mb-8 overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Model</th>
                  <th className="px-4 py-3 text-right font-medium">Requests</th>
                  <th className="px-4 py-3 text-right font-medium">Charged (THB)</th>
                  <th className="px-4 py-3 text-right font-medium">Cost (THB)</th>
                  <th className="px-4 py-3 text-right font-medium">Profit (THB)</th>
                </tr>
              </thead>
              <tbody>
                {data.byModel.map((m) => (
                  <tr key={m.model} className="border-t">
                    <td className="px-4 py-3 font-medium">{m.model}</td>
                    <td className="px-4 py-3 text-right">{m.count}</td>
                    <td className="px-4 py-3 text-right">{(m.totalCharged / 100).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">{(m.totalCost / 100).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-medium">{((m.totalCharged - m.totalCost) / 100).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h2 className="mb-4 text-lg font-semibold">Recent Usage</h2>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Customer</th>
              <th className="px-4 py-3 text-left font-medium">Model</th>
              <th className="px-4 py-3 text-right font-medium">Tokens</th>
              <th className="px-4 py-3 text-right font-medium">Charged</th>
              <th className="px-4 py-3 text-left font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {data.recent.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-3">{r.customerEmail}</td>
                <td className="px-4 py-3">{r.model}</td>
                <td className="px-4 py-3 text-right">{r.promptTokens + r.completionTokens}</td>
                <td className="px-4 py-3 text-right">{(r.chargedSatang / 100).toFixed(2)} THB</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(r.createdAt).toLocaleString("th-TH")}</td>
              </tr>
            ))}
            {data.recent.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No AI usage yet</td></tr>
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
