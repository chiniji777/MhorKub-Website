"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Menu,
  X,
  User,
  LayoutDashboard,
  LogOut,
  Crown,
  Cpu,
  ShoppingCart,
  ChevronDown,
  Bell,
} from "lucide-react";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface StoredCustomer {
  name: string;
  email: string;
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [customer, setCustomer] = useState<StoredCustomer | null>(null);
  const [license, setLicense] = useState<{
    planName: string;
    daysLeft: number;
    active: boolean;
  } | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const stored = localStorage.getItem("customer");
    if (token && stored) {
      try {
        setCustomer(JSON.parse(stored));
      } catch {
        /* ignore */
      }

      // Fetch license status
      fetch("/api/v1/license", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.active && data.license) {
            const days = Math.max(
              0,
              Math.ceil(
                (new Date(data.license.expiresAt).getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24)
              )
            );
            setLicense({
              planName: data.license.planName,
              daysLeft: days,
              active: true,
            });
          } else {
            setLicense({ planName: "ไม่มีแพ็กเกจ", daysLeft: 0, active: false });
          }
        })
        .catch(() => {
          /* ignore */
        });

      // Fetch notification unread count
      fetch("/api/v1/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((data) => {
          setUnreadCount(data.unreadCount || 0);
        })
        .catch(() => {
          /* ignore */
        });
    }

    // Listen for storage changes (login/logout in other tabs)
    function onStorage(e: StorageEvent) {
      if (e.key === "accessToken" || e.key === "customer") {
        const t = localStorage.getItem("accessToken");
        const c = localStorage.getItem("customer");
        if (t && c) {
          try {
            setCustomer(JSON.parse(c));
          } catch {
            setCustomer(null);
          }
        } else {
          setCustomer(null);
          setLicense(null);
          setUnreadCount(0);
        }
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("customer");
    setCustomer(null);
    setLicense(null);
    setUnreadCount(0);
    setDropdownOpen(false);
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="MhorKub" width={36} height={36} className="rounded-lg" />
          <span className="text-xl font-bold text-foreground">
            Mhor<span className="text-primary">Kub</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-muted transition-colors hover:bg-primary/5 hover:text-primary"
            >
              {link.label}
            </Link>
          ))}

          {customer ? (
            /* Logged-in state — bell + dropdown */
            <>
              <Link
                href="/dashboard/notifications"
                className="relative ml-3 rounded-lg p-2 text-muted transition-colors hover:bg-primary/5 hover:text-primary"
                aria-label="แจ้งเตือน"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            <div className="relative ml-1" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow-md"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                {customer.name.split(" ")[0]}
                <ChevronDown
                  size={14}
                  className={cn(
                    "transition-transform",
                    dropdownOpen && "rotate-180"
                  )}
                />
              </button>

              {/* Dropdown menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-border/50 bg-white py-2 shadow-lg">
                  {/* Subscription status */}
                  <div className="border-b border-border/50 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Crown size={14} className="text-primary" />
                      <span className="text-sm font-semibold text-foreground">
                        {license?.active
                          ? license.planName
                          : "ไม่มีแพ็กเกจ"}
                      </span>
                    </div>
                    {license?.active && (
                      <p className="mt-0.5 text-xs text-muted">
                        เหลืออีก {license.daysLeft} วัน
                      </p>
                    )}
                  </div>

                  {/* Menu items */}
                  <Link
                    href="/dashboard"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-primary/5"
                  >
                    <LayoutDashboard size={16} className="text-muted" />
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/notifications"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center justify-between px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-primary/5"
                  >
                    <span className="flex items-center gap-2.5">
                      <Bell size={16} className="text-muted" />
                      แจ้งเตือน
                    </span>
                    {unreadCount > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/dashboard/topup"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-primary/5"
                  >
                    <Cpu size={16} className="text-muted" />
                    เติมเครดิต AI
                  </Link>
                  <Link
                    href="/dashboard/purchase"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-primary/5"
                  >
                    <ShoppingCart size={16} className="text-muted" />
                    {license?.active ? "อัพเกรด / ต่ออายุ" : "ซื้อแพ็กเกจ"}
                  </Link>

                  {/* Logout */}
                  <div className="border-t border-border/50 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                    >
                      <LogOut size={16} />
                      ออกจากระบบ
                    </button>
                  </div>
                </div>
              )}
            </div>
            </>
          ) : (
            /* Guest state */
            <>
              <Link
                href="/login"
                className="ml-3 rounded-lg border border-primary/30 px-4 py-2 text-sm font-medium text-primary transition-all hover:bg-primary/5"
              >
                เข้าสู่ระบบ
              </Link>
              <Link
                href="/register"
                className="ml-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow-md"
              >
                สมัครสมาชิก
              </Link>
            </>
          )}
        </nav>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="rounded-lg p-2 text-muted transition-colors hover:bg-primary/5 md:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav */}
      <div
        className={cn(
          "overflow-hidden border-t border-border/50 bg-white transition-all duration-300 md:hidden",
          open ? "max-h-96" : "max-h-0 border-t-0"
        )}
      >
        <nav className="flex flex-col gap-1 px-4 py-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-primary/5 hover:text-primary"
            >
              {link.label}
            </Link>
          ))}

          {customer ? (
            /* Mobile logged-in state */
            <>
              {/* Subscription status */}
              {license && (
                <div className="mt-2 flex items-center gap-2 rounded-lg bg-primary/5 px-4 py-2.5">
                  <Crown size={14} className="text-primary" />
                  <span className="text-sm font-semibold text-foreground">
                    {license.active ? license.planName : "ไม่มีแพ็กเกจ"}
                  </span>
                  {license.active && (
                    <span className="text-xs text-muted">
                      ({license.daysLeft} วัน)
                    </span>
                  )}
                </div>
              )}

              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-primary/5"
              >
                <LayoutDashboard size={16} className="text-muted" />
                Dashboard
              </Link>
              <Link
                href="/dashboard/notifications"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-lg px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-primary/5"
              >
                <span className="flex items-center gap-2.5">
                  <Bell size={16} className="text-muted" />
                  แจ้งเตือน
                </span>
                {unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
              <Link
                href="/dashboard/topup"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-primary/5"
              >
                <Cpu size={16} className="text-muted" />
                เติมเครดิต AI
              </Link>
              <Link
                href="/dashboard/purchase"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-primary/5"
              >
                <ShoppingCart size={16} className="text-muted" />
                {license?.active ? "อัพเกรด / ต่ออายุ" : "ซื้อแพ็กเกจ"}
              </Link>
              <button
                onClick={() => {
                  setOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              >
                <LogOut size={16} />
                ออกจากระบบ
              </button>
            </>
          ) : (
            /* Mobile guest state */
            <>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="mt-2 rounded-lg border border-primary/30 px-5 py-2.5 text-center text-sm font-medium text-primary transition-all hover:bg-primary/5"
              >
                เข้าสู่ระบบ
              </Link>
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="mt-1 rounded-lg bg-primary px-5 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark"
              >
                สมัครสมาชิก
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
