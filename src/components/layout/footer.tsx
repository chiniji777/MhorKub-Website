import Link from "next/link";
import Image from "next/image";
import { Facebook } from "lucide-react";

const footerLinks = {
  product: [
    { label: "ฟีเจอร์", href: "/features" },
    { label: "ราคา", href: "/pricing" },
    { label: "ดาวน์โหลด", href: "/download" },
  ],
  company: [
    { label: "เกี่ยวกับเรา", href: "/about" },
    { label: "บทความ", href: "/blog" },
    { label: "ติดต่อ", href: "/contact" },
  ],
  account: [
    { label: "เข้าสู่ระบบ", href: "/login" },
    { label: "สมัครสมาชิก", href: "/register" },
  ],
  // support: ยังไม่เปิดใช้ — เปิดกลับมาทีหลัง
  // support: [
  //   { label: "คู่มือการใช้งาน", href: "#" },
  //   { label: "FAQ", href: "/contact#faq" },
  //   { label: "LINE @mhorkub", href: "https://line.me/R/ti/p/@mhorkub" },
  // ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex flex-col items-start gap-1">
              <Image src="/logo.png" alt="MhorKub" width={36} height={36} className="rounded-lg" />
              <span className="text-lg font-bold text-foreground">
                Mhor<span className="text-primary">Kub</span>
              </span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              ระบบบริหารคลินิกอัจฉริยะ
              <br />
              ใช้งานง่าย ครบจบในที่เดียว
            </p>
            <div className="mt-4 flex items-center gap-3">
              <a
                href="https://facebook.com/mhorkub"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/10 text-muted transition-colors hover:bg-primary/10 hover:text-primary"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">ผลิตภัณฑ์</h3>
            <ul className="mt-3 space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">บริษัท</h3>
            <ul className="mt-3 space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-foreground">บัญชี</h3>
            <ul className="mt-3 space-y-2">
              {footerLinks.account.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ช่วยเหลือ — ยังไม่เปิดใช้
          <div>
            <h3 className="text-sm font-semibold text-foreground">ช่วยเหลือ</h3>
            <ul className="mt-3 space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          */}
        </div>

        <div className="mt-10 border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted">
          <span>&copy; {new Date().getFullYear()} MhorKub. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="transition-colors hover:text-primary">
              นโยบายความเป็นส่วนตัว
            </Link>
            <Link href="/terms" className="transition-colors hover:text-primary">
              เงื่อนไขการใช้งาน
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
