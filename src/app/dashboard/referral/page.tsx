"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Gift,
  Copy,
  Check,
  Users,
  Loader2,
} from "lucide-react";

interface ReferralStats {
  referralCode: string;
  creditBalance: number;
  creditBalanceThb: number;
  totalReferrals: number;
  totalEarnings: number;
  totalEarningsThb: number;
}

interface ReferredOrder {
  planName: string;
  amountThb: number;
  cashback: number;
  paidAt: string | null;
}

interface ReferredCustomer {
  name: string;
  email: string;
  createdAt: string;
  orders: ReferredOrder[];
}

export default function ReferralPage() {
  const router = useRouter();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [customers, setCustomers] = useState<ReferredCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  function authHeaders() {
    return { Authorization: `Bearer ${localStorage.getItem("accessToken")}` };
  }

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }

    Promise.all([
      fetch("/api/v1/referral", { headers: authHeaders() }).then((r) => r.json()),
      fetch("/api/v1/referral/customers", { headers: authHeaders() }).then((r) => r.json()),
    ])
      .then(([statsData, customersData]) => {
        setStats(statsData);
        setCustomers(customersData.customers || []);
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function copyReferral() {
    if (!stats) return;
    navigator.clipboard.writeText(stats.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">รหัสแนะนำ</h1>
        <p className="text-sm text-muted">แนะนำเพื่อนมาซื้อ → เพื่อนได้ลด 10% · คุณได้เงินคืน 10%</p>
      </div>

      {/* Referral Code */}
      <div className="rounded-2xl border border-border/50 bg-white p-6 shadow-sm mb-4">
        <div className="mb-4 flex items-center gap-2">
          <Gift className="h-5 w-5 text-orange-500" />
          <h2 className="font-semibold text-foreground">รหัสของคุณ</h2>
        </div>

        <div className="mb-6 flex items-center gap-2">
          <code className="rounded-lg bg-primary/5 px-4 py-2.5 text-lg font-bold tracking-wider text-primary">
            {stats.referralCode}
          </code>
          <button
            onClick={copyReferral}
            className="flex items-center gap-1 rounded-lg border border-border px-3 py-2.5 text-sm text-muted hover:bg-background transition-colors"
          >
            {copied ? (
              <>
                <Check size={14} className="text-green-500" />
                คัดลอกแล้ว
              </>
            ) : (
              <>
                <Copy size={14} />
                คัดลอก
              </>
            )}
          </button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-blue-50 p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {stats.totalReferrals}
            </p>
            <p className="mt-1 text-xs text-blue-600/70">คนที่แนะนำ</p>
          </div>
          <div className="rounded-xl bg-green-50 p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {stats.totalEarningsThb.toLocaleString("th-TH")}
            </p>
            <p className="mt-1 text-xs text-green-600/70">รายได้รวม (฿)</p>
          </div>
          <div className="rounded-xl bg-orange-50 p-4 text-center">
            <p className="text-2xl font-bold text-orange-600">
              {stats.creditBalanceThb.toLocaleString("th-TH")}
            </p>
            <p className="mt-1 text-xs text-orange-600/70">ยอดคงเหลือ (฿)</p>
          </div>
        </div>
      </div>

      {/* Referred Customers */}
      <div className="rounded-2xl border border-border/50 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-purple-500" />
          <h2 className="font-semibold text-foreground">คนที่ใช้รหัสแนะนำ</h2>
        </div>

        {customers.length === 0 ? (
          <div className="py-8 text-center">
            <Users className="mx-auto mb-3 h-12 w-12 text-muted/30" />
            <p className="text-sm text-muted">ยังไม่มีคนใช้รหัสแนะนำของคุณ</p>
            <p className="mt-1 text-xs text-muted/70">
              แชร์รหัส{" "}
              <span className="font-semibold text-primary">
                {stats.referralCode}
              </span>{" "}
              ให้เพื่อนเลย!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {customers.map((c, i) => (
              <div key={i} className="rounded-xl border border-border/30 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted">{c.email}</p>
                  </div>
                  <p className="text-xs text-muted">
                    สมัคร{" "}
                    {new Date(c.createdAt).toLocaleDateString("th-TH", {
                      day: "numeric",
                      month: "short",
                      year: "2-digit",
                    })}
                  </p>
                </div>

                {c.orders.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {c.orders.map((o, j) => (
                      <div
                        key={j}
                        className="flex items-center justify-between rounded-lg bg-green-50/50 px-3 py-2 text-xs"
                      >
                        <span className="text-foreground">{o.planName}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-muted">
                            {(o.amountThb / 100).toLocaleString()} ฿
                          </span>
                          <span className="font-medium text-green-600">
                            +{(o.cashback / 100).toLocaleString()} ฿
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
