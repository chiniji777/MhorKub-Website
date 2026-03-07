"use client";

import { useState } from "react";
import { Send, Mail, MapPin, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  { q: "MhorKub เหมาะกับคลินิกแบบไหน?", a: "ทุกประเภท ตั้งแต่คลินิกเวชกรรมทั่วไป ผิวหนัง ทันตกรรม จนถึงโรงพยาบาลขนาดเล็ก" },
  { q: "ใช้งานได้กี่เครื่อง?", a: "ใช้งานได้ไม่จำกัดจำนวนเครื่องในวง LAN เดียวกัน ติดตั้งกี่เครื่องก็ได้ค่ะ" },
  { q: "ต้องมีอินเทอร์เน็ตไหม?", a: "ระบบพื้นฐานเป็น Offline-First ทำงานได้แม้ไม่มีเน็ต แต่ฟีเจอร์ AI ต้องใช้อินเทอร์เน็ตเพื่อ Login และเชื่อมต่อค่ะ" },
  { q: "มีค่าติดตั้งไหม?", a: "ไม่มีค่ะ ดาวน์โหลดและติดตั้งเองได้เลย ใช้เวลาไม่เกิน 5 นาที" },
  { q: "ข้อมูลคนไข้ปลอดภัยไหม?", a: "ปลอดภัยค่ะ ข้อมูลเก็บในเครื่องของคลินิกเท่านั้น ไม่ส่งขึ้นคลาวด์ เข้ารหัสทุกจุด" },
  { q: "ทดลองใช้ฟรีได้อย่างไร?", a: "สมัครสมาชิกแล้วดาวน์โหลดได้เลยค่ะ ทดลองฟรี 14 วันเต็ม ไม่ต้องใส่บัตรเครดิต" },
  { q: "ติดปัญหาติดต่อใครได้?", a: "ส่งข้อความผ่านหน้านี้ หรืออีเมล contact@mhorkub.com ตอบภายใน 24 ชั่วโมง" },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", clinic_name: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus("sent");
        setForm({ name: "", email: "", phone: "", clinic_name: "", message: "" });
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold text-foreground sm:text-5xl">ติดต่อเรา</h1>
          <p className="mt-4 text-lg text-muted">สนใจ MhorKub? ส่งข้อความถึงเราได้เลย ตอบภายใน 24 ชั่วโมง</p>
        </div>

        <div className="mt-16 grid gap-12 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-border/50 bg-white p-8">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">ชื่อ-สกุล *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="นพ. สมชาย..."
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">อีเมล *</label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="email@clinic.com"
                  />
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">เบอร์โทร</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="08x-xxx-xxxx"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">ชื่อคลินิก</label>
                  <input
                    value={form.clinic_name}
                    onChange={(e) => setForm({ ...form, clinic_name: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="คลินิก..."
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">ข้อความ *</label>
                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                  placeholder="สนใจแพ็กเกจ Clinic สำหรับ..."
                />
              </div>
              <button
                type="submit"
                disabled={status === "sending"}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark disabled:opacity-60 sm:w-auto"
              >
                <Send size={18} />
                {status === "sending" ? "กำลังส่ง..." : "ส่งข้อความ"}
              </button>
              {status === "sent" && <p className="text-sm text-success font-medium">ส่งเรียบร้อยค่ะ! เราจะติดต่อกลับภายใน 24 ชั่วโมง</p>}
              {status === "error" && <p className="text-sm text-danger font-medium">เกิดข้อผิดพลาด กรุณาลองอีกครั้ง</p>}
            </form>
          </div>

          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-2xl border border-border/50 bg-white p-6">
              <h3 className="font-semibold text-foreground">ช่องทางติดต่อ</h3>
              <ul className="mt-4 space-y-4">
                <li className="flex items-center gap-3 text-sm text-muted">
                  <Mail size={18} className="text-primary" /> contact@mhorkub.com
                </li>
<li className="flex items-center gap-3 text-sm text-muted">
                  <MapPin size={18} className="text-primary" /> กรุงเทพมหานคร
                </li>
              </ul>
            </div>
            {/* LINE Official — ยังไม่เปิดใช้
            <div className="rounded-2xl border border-border/50 bg-white p-6">
              <h3 className="font-semibold text-foreground">LINE Official</h3>
              <p className="mt-2 text-sm text-muted">แอดไลน์ @mhorkub เพื่อสอบถามหรือขอความช่วยเหลือ</p>
              <div className="mt-4 rounded-xl bg-primary/5 p-4 text-center">
                <p className="text-lg font-bold text-primary">@mhorkub</p>
              </div>
            </div>
            */}
          </div>
        </div>

        <section id="faq" className="mx-auto mt-20 max-w-3xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">คำถามที่พบบ่อย</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-border/50 bg-white">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-medium text-foreground"
                >
                  {faq.q}
                  <ChevronDown size={18} className={cn("shrink-0 text-muted transition-transform", openFaq === i && "rotate-180")} />
                </button>
                {openFaq === i && (
                  <div className="border-t border-border/50 px-6 py-4 text-sm leading-relaxed text-muted">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <div className="mx-auto mt-16 max-w-2xl rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 p-10 text-center">
          <h3 className="text-2xl font-bold text-foreground">พร้อมลองใช้ MhorKub แล้วหรือยัง?</h3>
          <p className="mt-3 text-muted">เริ่มต้นใช้งานง่ายๆ ไม่ต้องใส่บัตรเครดิต</p>
          <a
            href="/register"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-xl"
          >
            ทดลองฟรี 14 วัน
          </a>
        </div>
      </div>
    </div>
  );
}
