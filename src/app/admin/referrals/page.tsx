"use client";

import { useEffect, useState } from "react";

interface ReferralData {
  stats: { totalTransactions: number; totalCashback: number; totalCashbackThb: number };
  transactions: Array<{
    id: number;
    referrerEmail: string;
    referrerName: string;
    orderId: number;
    amountThb: number;
    credited: boolean;
    createdAt: string;
  }>;
}

export default function ReferralsPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/referrals")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div className="py-8 text-center text-muted-foreground">Loading...</div>;
  if (!data) return <div className="py-8 text-center text-muted-foreground">Failed to load</div>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Referral Program</h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Total Transactions</div>
          <div className="mt-1 text-2xl font-bold">{data.stats.totalTransactions}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Total Cashback</div>
          <div className="mt-1 text-2xl font-bold">{data.stats.totalCashbackThb.toLocaleString()} THB</div>
        </div>
      </div>

      <h2 className="mb-4 text-lg font-semibold">Recent Transactions</h2>
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Referrer</th>
              <th className="px-4 py-3 text-left font-medium">Order ID</th>
              <th className="px-4 py-3 text-right font-medium">Cashback (THB)</th>
              <th className="px-4 py-3 text-center font-medium">Credited</th>
              <th className="px-4 py-3 text-left font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {data.transactions.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="px-4 py-3">
                  <div className="font-medium">{t.referrerName}</div>
                  <div className="text-xs text-muted-foreground">{t.referrerEmail}</div>
                </td>
                <td className="px-4 py-3">#{t.orderId}</td>
                <td className="px-4 py-3 text-right font-medium">{(t.amountThb / 100).toFixed(0)}</td>
                <td className="px-4 py-3 text-center">{t.credited ? "Yes" : "No"}</td>
                <td className="px-4 py-3 text-muted-foreground">{new Date(t.createdAt).toLocaleDateString("th-TH")}</td>
              </tr>
            ))}
            {data.transactions.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No referral transactions yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
