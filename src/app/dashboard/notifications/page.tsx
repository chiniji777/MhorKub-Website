"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Users,
  Wallet,
  CheckCircle,
  AlertTriangle,
  Loader2,
  CheckCheck,
} from "lucide-react";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  function authHeaders() {
    return { Authorization: `Bearer ${localStorage.getItem("accessToken")}` };
  }

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }

    fetch("/api/v1/notifications", { headers: authHeaders() })
      .then((r) => r.json())
      .then((data) => setNotifications(data.notifications || []))
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function markAllRead() {
    setMarkingAll(true);
    try {
      await fetch("/api/v1/notifications/read", {
        method: "PUT",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } finally {
      setMarkingAll(false);
    }
  }

  async function markOneRead(id: number) {
    await fetch("/api/v1/notifications/read", {
      method: "PUT",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  function notifIcon(type: string) {
    switch (type) {
      case "referral_signup":
        return <Users size={18} className="text-blue-500" />;
      case "referral_purchase":
        return <Wallet size={18} className="text-green-500" />;
      case "withdrawal_approved":
        return <CheckCircle size={18} className="text-green-500" />;
      case "withdrawal_rejected":
        return <AlertTriangle size={18} className="text-red-500" />;
      default:
        return <Bell size={18} className="text-muted" />;
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
    if (days < 30) return `${days} วันที่แล้ว`;
    return new Date(dateStr).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "2-digit",
    });
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">แจ้งเตือน</h1>
          <p className="text-sm text-muted">
            {unreadCount > 0
              ? `มี ${unreadCount} รายการที่ยังไม่ได้อ่าน`
              : "อ่านทั้งหมดแล้ว"}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={markingAll}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted hover:bg-background transition-colors disabled:opacity-50"
          >
            {markingAll ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <CheckCheck size={14} />
            )}
            อ่านทั้งหมด
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-border/50 bg-white shadow-sm">
        {notifications.length === 0 ? (
          <div className="py-12 text-center">
            <Bell className="mx-auto mb-3 h-12 w-12 text-muted/30" />
            <p className="text-sm text-muted">ยังไม่มีแจ้งเตือน</p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.read && markOneRead(n.id)}
                className={`flex items-start gap-3 px-5 py-4 transition-colors ${
                  n.read
                    ? "bg-white"
                    : "bg-blue-50/40 cursor-pointer hover:bg-blue-50/70"
                }`}
              >
                <div className="mt-0.5 shrink-0">{notifIcon(n.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm ${
                        n.read
                          ? "text-foreground"
                          : "font-semibold text-foreground"
                      }`}
                    >
                      {n.title}
                    </p>
                    {!n.read && (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted">{n.message}</p>
                  <p className="mt-1 text-[11px] text-muted/70">
                    {timeAgo(n.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
