"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, User, LayoutDashboard } from "lucide-react";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface StoredCustomer {
  name: string;
  email: string;
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [customer, setCustomer] = useState<StoredCustomer | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const stored = localStorage.getItem("customer");
    if (token && stored) {
      try {
        setCustomer(JSON.parse(stored));
      } catch {
        /* ignore */
      }
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
        }
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

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
            /* Logged-in state */
            <Link
              href="/dashboard"
              className="ml-3 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow-md"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                {customer.name.charAt(0).toUpperCase()}
              </div>
              {customer.name.split(" ")[0]}
            </Link>
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
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark"
            >
              <LayoutDashboard size={16} />
              {customer.name.split(" ")[0]} — Dashboard
            </Link>
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
