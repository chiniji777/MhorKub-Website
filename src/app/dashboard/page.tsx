"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Crown,
  Cpu,
  Gift,
  Copy,
  Check,
  ShoppingCart,
  RefreshCw,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Bell,
  Users,
  Wallet,
  ArrowRight,
  LogOut,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────

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

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

// ─── Component ───────────────────────────────────────────────────

export default function DashboardOverview() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
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

    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch("/api/v1/me", { headers }).then((r) => {
        if (!r.ok) throw new Error("Unauthorized");
        return r.json();
      }),
      fetch("/api/v1/notifications", { headers })
        .then((r) => r.json())
        .catch(() => ({ notifications: [] })),
    ])
      .then(([meData, notifData]) => {
        setMe(meData);
        setNotifications(notifData.notifications?.slice(0, 3) || []);
      })
      .catch(() => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("customer");
        router.push("/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

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
      if (data.url) window.location.href = data.url;
    } catch {
      /* ignore */
    } finally {
      setPortalLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
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

  // Notification type icon
  function notifIcon(type: string) {
    switch (type) {
      case "referral_signup":
        return <Users size={16} className="text-blue-500" />;
      case "referral_purchase":
        return <Wallet size={16} className="text-green-500" />;
      case "withdrawal_approved":
        return <CheckCircle size={16} className="text-green-500" />;
      case "withdrawal_rejected":
        return <AlertTriangle size={16} className="text-red-500" />;
      default:
        return <Bell size={16} className="text-muted" />;
    }
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "เมื่อสักครู่";
    if (mins < 60) return `${mins} นาทีที่แล้ว`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;
    const days = Math.floor(hours / 24);
    return `${days} วันที่แล้ว`;
  }

  return (
    <>
      {/* Success Message */}
      {successMsg && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <CheckCircle size={18} />
          {successMsg}
        </div>
      )}

      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          สวัสดี, {me.name}
        </h1>
        <p className="text-sm text-muted">ภาพรวมบัญชีของคุณ</p>
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

              {me.license.stripeSubscriptionId && !me.license.autoRenew && (
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>
                    กำลังยกเลิก — จะไม่ต่ออายุอัตโนมัติเมื่อหมดรอบ
                  </span>
                </div>
              )}

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
              <div className="mt-3">
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
          <div className="mt-3 flex flex-col gap-2">
            <Link
              href="/dashboard/topup"
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors w-fit"
            >
              <ShoppingCart size={14} />
              เติมเครดิต
            </Link>
            <button
              onClick={() => {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("customer");
                router.push("/login");
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors w-fit"
            >
              <LogOut size={14} />
              ออกจากระบบ
            </button>
          </div>
        </div>

        {/* Referral Card */}
        <div className="rounded-2xl border border-border/50 bg-white p-6 shadow-sm sm:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-orange-500" />
              <h2 className="font-semibold text-foreground">รหัสแนะนำ</h2>
            </div>
            <Link
              href="/dashboard/referral"
              className="text-xs text-primary hover:underline"
            >
              ดูรายละเอียด →
            </Link>
          </div>
          <p className="text-sm text-muted mb-3">
            แนะนำเพื่อนมาซื้อ → เพื่อนได้ลด 10% · คุณได้รับเงินคืน 10%
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

        {/* Recent Notifications */}
        {notifications.length > 0 && (
          <div className="rounded-2xl border border-border/50 bg-white p-6 shadow-sm sm:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-500" />
                <h2 className="font-semibold text-foreground">
                  แจ้งเตือนล่าสุด
                </h2>
              </div>
              <Link
                href="/dashboard/notifications"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                ดูทั้งหมด
                <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 rounded-xl px-4 py-3 ${
                    n.read ? "bg-background" : "bg-blue-50/50 border border-blue-100"
                  }`}
                >
                  <div className="mt-0.5">{notifIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${n.read ? "text-foreground" : "font-medium text-foreground"}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-muted mt-0.5 truncate">
                      {n.message}
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] text-muted">
                    {timeAgo(n.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
