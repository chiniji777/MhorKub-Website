"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LogOut,
  Crown,
  Gift,
  Copy,
  Check,
  ShoppingCart,
  Cpu,
  ArrowLeft,
  Loader2,
  RefreshCw,
  CreditCard,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";

interface License {
  id: number;
  planName: string;
  planId: number;
  startsAt: string;
  expiresAt: string;
  status: string;
  autoRenew: boolean;
  stripeSubscriptionId: string | null;
}

interface MeResponse {
  id: number;
  email: string;
  name: string;
  phone?: string;
  referralCode: string;
  creditBalance: number;
  license: License | null;
}

export default function CustomerDashboard() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Handle payment callback from URL params
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    if (payment === "success") {
      setSuccessMsg("ชำระเงินสำเร็จ! ระบบกำลังเปิดใช้งานให้คุณค่ะ");
      window.history.replaceState({}, "", "/dashboard");
      setTimeout(() => setSuccessMsg(null), 6000);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }

    fetch("/api/v1/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Unauthorized");
        return r.json();
      })
      .then((data) => setMe(data))
      .catch(() => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("customer");
        router.push("/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  function handleLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("customer");
    router.push("/login");
  }

  function copyReferral() {
    if (!me) return;
    navigator.clipboard.writeText(me.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function openStripePortal() {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      /* ignore */
    } finally {
      setPortalLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!me) return null;

  const daysLeft = me.license
    ? Math.max(
        0,
        Math.ceil(
          (new Date(me.license.expiresAt).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-white">
      {/* Header */}
      <header className="border-b border-border/50 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <ArrowLeft size={16} className="text-muted" />
            <span className="text-lg font-bold text-primary">MhorKub</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={16} />
            ออกจากระบบ
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Success Message */}
        {successMsg && (
          <div className="mb-6 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            <CheckCircle size={18} />
            {successMsg}
          </div>
        )}

        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            สวัสดี, {me.name}
          </h1>
          <p className="text-sm text-muted">{me.email}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* License Card */}
          <div className="rounded-2xl border border-border/50 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground">สถานะสิทธิ์</h2>
            </div>
            {me.license && me.license.status === "active" ? (
              <>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-primary">
                    {me.license.planName}
                  </p>
                  {me.license.autoRenew && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      <RefreshCw size={10} />
                      ต่ออายุอัตโนมัติ
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">
                  เหลืออีก{" "}
                  <span className="font-semibold text-foreground">
                    {daysLeft} วัน
                  </span>
                </p>
                <p className="text-xs text-muted">
                  หมดอายุ{" "}
                  {new Date(me.license.expiresAt).toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>

                {/* Cancellation warning */}
                {me.license.stripeSubscriptionId && !me.license.autoRenew && (
                  <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                    <span>กำลังยกเลิก — จะไม่ต่ออายุอัตโนมัติเมื่อหมดรอบ</span>
                  </div>
                )}

                {/* Manage subscription button */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {me.license.stripeSubscriptionId && (
                    <button
                      onClick={openStripePortal}
                      disabled={portalLoading}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted hover:bg-background transition-colors disabled:opacity-50"
                    >
                      {portalLoading ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <CreditCard size={14} />
                      )}
                      จัดการ Subscription
                    </button>
                  )}
                  <Link
                    href="/dashboard/purchase"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
                  >
                    <ShoppingCart size={14} />
                    อัพเกรด / ต่ออายุ
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="text-lg font-semibold text-muted">
                  ยังไม่มีสิทธิ์ใช้งาน
                </p>
                <div className="mt-3 flex gap-2">
                  <Link
                    href="/dashboard/purchase"
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark transition-colors"
                  >
                    <ShoppingCart size={14} className="mr-1 inline" />
                    ซื้อแพ็กเกจ
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* AI Credit Card */}
          <div className="rounded-2xl border border-border/50 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Cpu className="h-5 w-5 text-accent" />
              <h2 className="font-semibold text-foreground">เครดิต AI</h2>
            </div>
            <p className="text-2xl font-bold text-accent">
              {(me.creditBalance / 100).toLocaleString("th-TH", {
                minimumFractionDigits: 2,
              })}{" "}
              <span className="text-base font-normal text-muted">บาท</span>
            </p>
            <p className="mt-1 text-xs text-muted">
              สำหรับใช้ AI ช่วยวินิจฉัยในโปรแกรม
            </p>
            <Link
              href="/dashboard/topup"
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
            >
              <ShoppingCart size={14} />
              เติมเครดิต
            </Link>
          </div>

          {/* Referral Card */}
          <div className="rounded-2xl border border-border/50 bg-white p-6 shadow-sm sm:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <Gift className="h-5 w-5 text-orange-500" />
              <h2 className="font-semibold text-foreground">รหัสแนะนำ</h2>
            </div>
            <p className="text-sm text-muted mb-3">
              แนะนำเพื่อนมาซื้อ → เพื่อนได้ลด 10% ·
              คุณได้รับเงินคืน 10% ของยอดหลังลด
            </p>
            <div className="flex items-center gap-2">
              <code className="rounded-lg bg-primary/5 px-4 py-2.5 text-lg font-bold tracking-wider text-primary">
                {me.referralCode}
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
          </div>
        </div>
      </main>
    </div>
  );
}
