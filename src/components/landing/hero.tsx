import Link from "next/link";
import { ArrowRight, Download, Brain, Shield, Wifi, WifiOff, Stethoscope, HeartPulse, Activity } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-primary/[0.03] to-white">
      {/* Background blurs */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-20 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute right-1/4 bottom-20 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
      </div>

      {/* Floating medical icons */}
      <div className="absolute inset-0 -z-5 overflow-hidden pointer-events-none">
        <div className="absolute left-[10%] top-[15%] animate-float opacity-[0.08]">
          <HeartPulse size={40} className="text-primary" />
        </div>
        <div className="absolute right-[12%] top-[20%] animate-float-delay opacity-[0.08]">
          <Brain size={36} className="text-accent" />
        </div>
        <div className="absolute left-[8%] bottom-[30%] animate-float-slow opacity-[0.08]">
          <Stethoscope size={32} className="text-primary" />
        </div>
        <div className="absolute right-[15%] bottom-[25%] animate-float opacity-[0.06]">
          <Activity size={34} className="text-accent" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="animate-slide-up mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <div className="flex items-center gap-1.5">
              <WifiOff size={14} />
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              <Wifi size={14} />
            </div>
            Offline-First — ใช้งานได้แม้ไม่มีเน็ต
          </div>

          {/* Heading */}
          <h1 className="animate-slide-up-delay text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            ระบบบริหาร
            <span className="relative inline-block">
              <span className="text-primary">คลินิก</span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                <path d="M2 8C40 2 80 2 100 6C120 10 160 10 198 4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-primary/30" />
              </svg>
            </span>
            <br />
            <span className="bg-gradient-to-r from-primary via-primary-dark to-accent bg-clip-text text-transparent animate-gradient">
              อัจฉริยะ
            </span>
          </h1>

          {/* Subtitle */}
          <p className="animate-slide-up-delay-2 mt-6 text-lg leading-relaxed text-muted sm:text-xl">
            จัดการคนไข้ คิว ใบสั่งยา สต็อก บิล ครบจบในที่เดียว
            <br className="hidden sm:block" />
            พร้อม <span className="font-semibold text-primary">AI ช่วยวินิจฉัย</span>และบันทึกการตรวจอัตโนมัติ
          </p>

          {/* CTA Buttons */}
          <div className="animate-fade-in mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/download"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 sm:w-auto"
            >
              <Download size={20} />
              ดาวน์โหลดฟรี
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/features"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-white px-8 py-3.5 text-base font-semibold text-foreground shadow-sm transition-all hover:border-primary/30 hover:bg-primary/5 hover:-translate-y-0.5 sm:w-auto"
            >
              ดูฟีเจอร์ทั้งหมด
              <ArrowRight size={18} />
            </Link>
          </div>

          {/* Stats */}
          <div className="animate-fade-in mt-12 flex items-center justify-center gap-8 text-sm text-muted">
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

        {/* App Screenshot Mockup */}
        <div className="relative mx-auto mt-16 max-w-5xl animate-scale-in">
          <div className="animate-pulse-glow rounded-2xl border border-border/50 bg-white p-2 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-border/50 px-4 py-2">
              <div className="h-3 w-3 rounded-full bg-danger/60" />
              <div className="h-3 w-3 rounded-full bg-warning/60" />
              <div className="h-3 w-3 rounded-full bg-success/60" />
              <span className="ml-2 text-xs text-muted">MhorKub — Dashboard</span>
            </div>
            <div className="aspect-video overflow-hidden rounded-b-xl bg-gradient-to-br from-primary/5 via-white to-accent/5">
              <img
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&h=675&fit=crop"
                alt="MhorKub Dashboard - ระบบบริหารคลินิก"
                className="h-full w-full object-cover opacity-90"
              />
            </div>
          </div>

          {/* Floating feature cards */}
          <div className="absolute -left-4 top-1/3 hidden animate-float rounded-xl border border-border/50 bg-white/90 p-3 shadow-lg backdrop-blur-sm lg:block">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-accent/10 p-1.5">
                <Shield size={16} className="text-accent" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">ข้อมูลปลอดภัย</p>
                <p className="text-[10px] text-muted">เก็บในเครื่อง 100%</p>
              </div>
            </div>
          </div>

          <div className="absolute -right-4 top-1/2 hidden animate-float-delay rounded-xl border border-border/50 bg-white/90 p-3 shadow-lg backdrop-blur-sm lg:block">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-1.5">
                <Brain size={16} className="text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">AI ช่วยวินิจฉัย</p>
                <p className="text-[10px] text-muted">SOAP Notes อัตโนมัติ</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
