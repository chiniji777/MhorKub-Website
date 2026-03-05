"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  User,
  Gift,
  Cpu,
  Wallet,
  Bell,
  ShoppingCart,
  CreditCard,
  LogOut,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────

interface MeBasic {
  name: string;
  email: string;
}

// ─── Sidebar Items ───────────────────────────────────────────────

const SIDEBAR_ITEMS = [
  { href: "/dashboard", label: "ภาพรวม", icon: LayoutDashboard },
  { href: "/dashboard/profile", label: "ข้อมูลส่วนตัว", icon: User },
  { href: "/dashboard/referral", label: "รหัสแนะนำ", icon: Gift },
  { href: "/dashboard/ai-credit", label: "เครดิต AI", icon: Cpu },
  { href: "/dashboard/withdraw", label: "ถอนเงิน", icon: Wallet },
  { href: "/dashboard/notifications", label: "แจ้งเตือน", icon: Bell },
];

const ACTION_ITEMS = [
  { href: "/dashboard/purchase", label: "ซื้อ/ต่ออายุ", icon: ShoppingCart },
  { href: "/dashboard/topup", label: "เติมเครดิต AI", icon: CreditCard },
];

// Full-screen routes — hide sidebar, show back arrow
const FULLSCREEN_ROUTES = ["/dashboard/purchase", "/dashboard/topup"];

// ─── Component ───────────────────────────────────────────────────

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [me, setMe] = useState<MeBasic | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const isFullscreen = FULLSCREEN_ROUTES.some((r) => pathname.startsWith(r));

  // ─── Auth check + load data ──────────────────────────────────

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }

    // Fetch user info + notifications in parallel
    Promise.all([
      fetch("/api/v1/me", {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => {
        if (!r.ok) throw new Error("Unauthorized");
        return r.json();
      }),
      fetch("/api/v1/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .catch(() => ({ unreadCount: 0 })),
    ])
      .then(([meData, notifData]) => {
        setMe({ name: meData.name, email: meData.email });
        setUnreadCount(notifData.unreadCount || 0);
      })
      .catch(() => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("customer");
        router.push("/login");
      })
      .finally(() => setLoading(false));
  }, [router]);

  // Re-fetch notification count when path changes (e.g. after marking as read)
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    fetch("/api/v1/notifications", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setUnreadCount(data.unreadCount || 0))
      .catch(() => {});
  }, [pathname]);

  function handleLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("customer");
    router.push("/login");
  }

  // ─── Loading ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-blue-50/30 to-white">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!me) return null;

  // ─── Full-screen mode (purchase/topup) ───────────────────────

  if (isFullscreen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-white">
        <header className="border-b border-border/50 bg-white/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
            >
              <ArrowLeft size={16} />
              กลับ Dashboard
            </Link>
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="MhorKub"
                width={28}
                height={28}
                className="rounded-md"
              />
              <span className="text-lg font-bold text-foreground">
                Mhor<span className="text-primary">Kub</span>
              </span>
            </Link>
            <div className="w-28" />
          </div>
        </header>
        {children}
      </div>
    );
  }

  // ─── Normal dashboard layout ─────────────────────────────────

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-white">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border/50 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3 md:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="MhorKub"
              width={28}
              height={28}
              className="rounded-md"
            />
            <span className="text-lg font-bold text-foreground">
              Mhor<span className="text-primary">Kub</span>
            </span>
          </Link>

          {/* Right side: notification bell + user */}
          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <Link
              href="/dashboard/notifications"
              className="relative rounded-lg p-2 text-muted hover:bg-background hover:text-foreground transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>

            {/* User info */}
            <div className="hidden items-center gap-2 sm:flex">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                {me.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-foreground leading-tight">
                  {me.name}
                </p>
                <p className="text-[11px] text-muted leading-tight">
                  {me.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile: horizontal scroll tabs */}
      <div className="sticky top-[57px] z-20 border-b border-border/50 bg-white/90 backdrop-blur-sm md:hidden">
        <div className="flex gap-0.5 overflow-x-auto px-3 py-2 scrollbar-none">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted hover:bg-background hover:text-foreground"
                )}
              >
                <Icon size={14} />
                {item.label}
                {item.href === "/dashboard/notifications" && unreadCount > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Desktop layout: sidebar + content */}
      <div className="flex">
        {/* Sidebar — desktop only */}
        <aside className="sticky top-[57px] hidden h-[calc(100vh-57px)] w-60 shrink-0 flex-col border-r border-border/50 bg-white/60 md:flex">
          <nav className="flex flex-1 flex-col gap-1 p-3">
            {/* Main items */}
            {SIDEBAR_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted hover:bg-background hover:text-foreground"
                  )}
                >
                  <Icon size={18} />
                  {item.label}
                  {item.href === "/dashboard/notifications" &&
                    unreadCount > 0 && (
                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                </Link>
              );
            })}

            {/* Divider */}
            <div className="my-2 border-t border-border/50" />

            {/* Action items */}
            {ACTION_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted hover:bg-background hover:text-foreground"
                  )}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Bottom: logout */}
          <div className="border-t border-border/50 p-3">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut size={18} />
              ออกจากระบบ
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-h-[calc(100vh-57px)] flex-1 p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-3xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
