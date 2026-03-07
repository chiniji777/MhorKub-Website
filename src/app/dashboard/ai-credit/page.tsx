"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Cpu,
  ShoppingCart,
  Loader2,
} from "lucide-react";

interface Profile {
  creditBalance: number;
}

interface EarningRecord {
  id: number;
  amountThb: number;
  createdAt: string;
}

export default function AiCreditPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [earnings, setEarnings] = useState<EarningRecord[]>([]);
  const [loading, setLoading] = useState(true);

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
      fetch("/api/v1/me", { headers: authHeaders() }).then((r) => r.json()),
      fetch("/api/v1/referral/earnings", { headers: authHeaders() })
        .then((r) => r.json())
        .catch(() => []),
    ])
      .then(([me, earningsData]) => {
        setProfile(me);
        setEarnings(earningsData || []);
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">เครดิต AI</h1>
        <p className="text-sm text-muted">ยอดเครดิตรวม (เงินคืน Referral + เติมเครดิต) สำหรับใช้ AI ในโปรแกรม</p>
      </div>

      {/* Balance Card */}
      <div className="rounded-2xl border border-border/50 bg-white p-6 shadow-sm mb-4">
        <div className="mb-4 flex items-center gap-2">
          <Cpu className="h-5 w-5 text-accent" />
          <h2 className="font-semibold text-foreground">ยอดเครดิตคงเหลือ</h2>
        </div>

        <div className="mb-4 rounded-xl bg-gradient-to-r from-accent/10 to-primary/10 p-5">
          <p className="text-xs text-muted">ยอดเครดิตคงเหลือ</p>
          <p className="mt-1 text-3xl font-bold text-accent">
            {(profile.creditBalance / 100).toLocaleString("th-TH", {
              minimumFractionDigits: 2,
            })}{" "}
            <span className="text-base font-normal text-muted">บาท</span>
          </p>
          <p className="mt-2 text-xs text-muted">
            เครดิตรวม (เงินคืน Referral + เติมเงิน) ใช้ AI ในโปรแกรม MhorKub
          </p>
        </div>

        <Link
          href="/dashboard/topup"
          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
        >
          <ShoppingCart size={14} />
          เติมเครดิต AI
        </Link>
      </div>

      {/* Earnings History */}
      {earnings.length > 0 && (
        <div className="rounded-2xl border border-border/50 bg-white p-6 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            ประวัติรายการล่าสุด
          </h3>
          <div className="space-y-2">
            {earnings.slice(0, 20).map((t, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-lg bg-background px-3 py-2.5 text-xs"
              >
                <span className="text-muted">
                  {new Date(t.createdAt).toLocaleDateString("th-TH", {
                    day: "numeric",
                    month: "short",
                    year: "2-digit",
                  })}
                </span>
                <span className="font-medium text-green-600">
                  +{((t.amountThb || 0) / 100).toLocaleString()} ฿
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
