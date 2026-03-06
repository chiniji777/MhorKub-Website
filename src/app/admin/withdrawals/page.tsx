"use client";

import { useEffect, useState } from "react";

interface Withdrawal {
  id: number;
  customerEmail: string;
  customerName: string;
  amountThb: number;
  bankAccount: string;
  bankName: string;
  status: string;
  processedAt: string | null;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-800",
  completed: "bg-green-100 text-green-800",
};

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    setLoading(true);
    const res = await fetch("/api/admin/withdrawals");
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json();
    setWithdrawals(data);
    setLoading(false);
  }

  async function updateStatus(id: number, status: string) {
    const res = await fetch("/api/admin/withdrawals", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Action failed");
    }
    fetchData();
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Withdrawal Requests</h1>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Customer</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
              <th className="px-4 py-3 text-left font-medium">Bank</th>
              <th className="px-4 py-3 text-center font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : withdrawals.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No withdrawal requests</td></tr>
            ) : (
              withdrawals.map((w) => (
                <tr key={w.id} className="border-t">
                  <td className="px-4 py-3">
                    <div className="font-medium">{w.customerName}</div>
                    <div className="text-xs text-muted-foreground">{w.customerEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{(w.amountThb / 100).toFixed(0)} THB</td>
                  <td className="px-4 py-3">
                    <div>{w.bankName}</div>
                    <div className="font-mono text-xs">{w.bankAccount}</div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[w.status] || ""}`}>
                      {w.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(w.createdAt).toLocaleDateString("th-TH")}</td>
                  <td className="px-4 py-3 text-center">
                    {w.status === "pending" && (
                      <div className="flex justify-center gap-1">
                        <button onClick={() => updateStatus(w.id, "approved")} className="rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700">Approve</button>
                        <button onClick={() => updateStatus(w.id, "rejected")} className="rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700">Reject</button>
                      </div>
                    )}
                    {w.status === "approved" && (
                      <button onClick={() => updateStatus(w.id, "completed")} className="rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700">Mark Done</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
