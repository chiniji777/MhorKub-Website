import Link from "next/link";
import Image from "next/image";

const footerLinks = {
  product: [
    { label: "ฟีเจอร์", href: "/features" },
    { label: "ราคา", href: "/pricing" },
    { label: "ดาวน์โหลด", href: "/contact" },
  ],
  company: [
    { label: "เกี่ยวกับเรา", href: "/about" },
    { label: "บทความ", href: "/blog" },
    { label: "ติดต่อ", href: "/contact" },
  ],
  support: [
    { label: "คู่มือการใช้งาน", href: "#" },
    { label: "FAQ", href: "/contact#faq" },
    { label: "LINE @mhorkub", href: "#" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="MhorKub" width={32} height={32} className="rounded-lg" />
              <span className="text-lg font-bold text-foreground">
                Mhor<span className="text-primary">Kub</span>
              </span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              ระบบบริหารคลินิกอัจฉริยะ
              <br />
              ใช้งานง่าย ครบจบในที่เดียว
            </p>
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
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-sm text-muted">
          &copy; {new Date().getFullYear()} MhorKub. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
