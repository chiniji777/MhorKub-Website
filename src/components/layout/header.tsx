"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-white/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="MhorKub" width={36} height={36} className="rounded-lg" />
          <span className="text-xl font-bold text-foreground">
            Mhor<span className="text-primary">Kub</span>
          </span>
        </Link>

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
        </nav>

        <button
          onClick={() => setOpen(!open)}
          className="rounded-lg p-2 text-muted transition-colors hover:bg-primary/5 md:hidden"
          aria-label="Toggle menu"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

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
        </nav>
      </div>
    </header>
  );
}
