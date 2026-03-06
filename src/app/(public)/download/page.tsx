"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Download,
  Monitor,
  Shield,
  Wifi,
  WifiOff,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Brain,
  Clock,
  FileText,
} from "lucide-react";

interface ReleaseInfo {
  version: string;
  publishedAt: string;
  downloadUrl: string;
  fileName: string;
  fileSize: number;
  downloadCount: number;
  releaseUrl: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const SYSTEM_REQUIREMENTS = [
  { icon: Monitor, label: "Windows 10 / 11 (64-bit)" },
  { icon: HardDrive, label: "พื้นที่ว่าง 200 MB ขึ้นไป" },
  { icon: RefreshCw, label: "อัพเดทอัตโนมัติ" },
];

const HIGHLIGHTS = [
  {
    icon: WifiOff,
    title: "ใช้งานได้แม้ไม่มีเน็ต",
    description: "ข้อมูลเก็บในเครื่อง ปลอดภัย 100%",
  },
  {
    icon: Brain,
    title: "AI ช่วยวินิจฉัย",
    description: "SOAP Notes อัตโนมัติ แนะนำการรักษา",
  },
  {
    icon: Wifi,
    title: "LAN หลายเครื่อง",
    description: "เชื่อมต่อหลายจุดในคลินิกเดียวกัน",
  },
  {
    icon: Shield,
    title: "ข้อมูลปลอดภัย",
    description: "เข้ารหัส ไม่ส่งข้อมูลออกนอกเครื่อง",
  },
];

const INSTALL_STEPS = [
  { step: 1, title: "ดาวน์โหลด", description: "คลิกปุ่มดาวน์โหลดด้านบน" },
  {
    step: 2,
    title: "เปิดไฟล์ติดตั้ง",
    description: "เปิดไฟล์ MhorKub-Setup ที่ดาวน์โหลดมา",
  },
  {
    step: 3,
    title: "ติดตั้ง",
    description: "ทำตามขั้นตอน ใช้เวลาไม่ถึง 1 นาที",
  },
  {
    step: 4,
    title: "เริ่มใช้งาน!",
    description: "เปิดโปรแกรมจาก Desktop แล้วใช้ได้เลย",
  },
];

export default function DownloadPage() {
  const [release, setRelease] = useState<ReleaseInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch("/api/download/latest")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setRelease(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleDownload() {
    if (!release) return;
    setDownloading(true);
    window.open(release.downloadUrl, "_blank");
    setTimeout(() => setDownloading(false), 3000);
  }

  return (
    <div>
      {/* Hero Download Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-primary/[0.03] to-white py-16 sm:py-24">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/4 top-20 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute right-1/4 bottom-20 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
        </div>

        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <Monitor size={14} />
            สำหรับ Windows 10 / 11
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            ดาวน์โหลด{" "}
            <span className="text-primary">MhorKub</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
            ระบบบริหารคลินิกอัจฉริยะ ติดตั้งง่าย ใช้งานได้ทันที
            <br />
            ทดลองใช้ฟรี 14 วัน ไม่ต้องใส่บัตรเครดิต
          </p>

          {/* Download Button */}
          <div className="mt-10">
            {loading ? (
              <div className="flex items-center justify-center gap-2 text-muted">
                <Loader2 size={20} className="animate-spin" />
                กำลังโหลดข้อมูล...
              </div>
            ) : release ? (
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="group inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-primary to-primary-dark px-10 py-5 text-lg font-bold text-white shadow-xl shadow-primary/25 transition-all hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-1 disabled:opacity-70"
                >
                  {downloading ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <Download size={24} />
                  )}
                  {downloading ? "กำลังดาวน์โหลด..." : "ดาวน์โหลดฟรี"}
                  {!downloading && (
                    <ArrowRight
                      size={20}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  )}
                </button>

                <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted">
                  <span className="flex items-center gap-1.5">
                    <FileText size={14} />
                    {release.fileName}
                  </span>
                  <span className="h-4 w-px bg-border" />
                  <span>
                    {formatBytes(release.fileSize)}
                  </span>
                  <span className="h-4 w-px bg-border" />
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} />
                    v{release.version}
                  </span>
                  <span className="h-4 w-px bg-border" />
                  <span>{formatDate(release.publishedAt)}</span>
                </div>

                {release.downloadCount > 0 && (
                  <p className="text-xs text-muted/60">
                    ดาวน์โหลดแล้ว {release.downloadCount.toLocaleString()} ครั้ง
                  </p>
                )}
              </div>
            ) : (
              <Link
                href="https://github.com/chiniji777/MhorKub-Product/releases/latest"
                target="_blank"
                className="group inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-primary to-primary-dark px-10 py-5 text-lg font-bold text-white shadow-xl shadow-primary/25 transition-all hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-1"
              >
                <Download size={24} />
                ดาวน์โหลดจาก GitHub
                <ArrowRight
                  size={20}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>
            )}
          </div>

          {/* System Requirements */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
            {SYSTEM_REQUIREMENTS.map((req) => (
              <div
                key={req.label}
                className="flex items-center gap-2 text-sm text-muted"
              >
                <req.icon size={16} className="text-primary/60" />
                {req.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-10 text-center text-2xl font-bold text-foreground">
            ทำไมต้อง MhorKub?
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HIGHLIGHTS.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-border/50 bg-white p-6 text-center transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <item.icon size={24} className="text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-xs text-muted">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Installation Steps */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-10 text-center text-2xl font-bold text-foreground">
            ติดตั้งง่ายใน 4 ขั้นตอน
          </h2>
          <div className="space-y-4">
            {INSTALL_STEPS.map((s) => (
              <div
                key={s.step}
                className="flex items-start gap-4 rounded-xl border border-border/50 bg-white p-5 transition-all hover:border-primary/20 hover:shadow-md"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-dark text-sm font-bold text-white shadow-md">
                  {s.step}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{s.title}</h3>
                  <p className="mt-0.5 text-sm text-muted">{s.description}</p>
                </div>
                <CheckCircle2
                  size={20}
                  className="ml-auto mt-1 shrink-0 text-accent/40"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA after install steps */}
      <section className="pb-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 p-8 sm:p-12">
            <h2 className="text-xl font-bold text-foreground sm:text-2xl">
              มีคำถาม?
            </h2>
            <p className="mt-2 text-muted">
              ทีมงานพร้อมช่วยเหลือทุกขั้นตอน
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:-translate-y-0.5"
              >
                ติดต่อเรา
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground transition-all hover:border-primary/30 hover:bg-primary/5"
              >
                ดูแพ็กเกจทั้งหมด
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
