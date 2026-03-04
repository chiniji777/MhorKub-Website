import Link from "next/link";
import { ArrowRight, Download, Play } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--color-primary-light)_0%,_transparent_50%)] opacity-15" />
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Offline-First — ใช้งานได้แม้ไม่มีเน็ต
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            ระบบบริหาร
            <span className="text-primary">คลินิก</span>
            <br />
            อัจฉริยะ
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-muted sm:text-xl">
            จัดการคนไข้ คิว ใบสั่งยา สต็อก บิล ครบจบในที่เดียว
            <br className="hidden sm:block" />
            พร้อม AI ช่วยวินิจฉัยและบันทึกการตรวจอัตโนมัติ
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/contact"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/30 sm:w-auto"
            >
              <Download size={20} />
              ดาวน์โหลดฟรี
            </Link>
            <Link
              href="/features"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-8 py-3.5 text-base font-semibold text-foreground shadow-sm transition-all hover:border-primary/30 hover:bg-primary/5 sm:w-auto"
            >
              ดูฟีเจอร์ทั้งหมด
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-muted">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">500+</span> คลินิก
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">50,000+</span> คนไข้
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">4.9</span> ★ คะแนน
            </div>
          </div>
        </div>

        <div className="relative mx-auto mt-16 max-w-5xl">
          <div className="rounded-2xl border border-border/50 bg-white p-2 shadow-2xl shadow-primary/5">
            <div className="flex items-center gap-2 border-b border-border/50 px-4 py-2">
              <div className="h-3 w-3 rounded-full bg-danger/60" />
              <div className="h-3 w-3 rounded-full bg-warning/60" />
              <div className="h-3 w-3 rounded-full bg-success/60" />
              <span className="ml-2 text-xs text-muted">MhorKub — Dashboard</span>
            </div>
            <div className="aspect-video rounded-b-xl bg-gradient-to-br from-primary/5 via-background to-primary-light/10 flex items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <Play size={28} className="ml-1 text-primary" />
                </div>
                <p className="text-sm text-muted">ตัวอย่างการใช้งาน MhorKub</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
