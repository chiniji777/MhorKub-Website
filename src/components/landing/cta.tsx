import Link from "next/link";
import { Download, MessageCircle } from "lucide-react";

export function CTA() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-dark px-8 py-16 text-center sm:px-16 sm:py-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,_rgba(255,255,255,0.1)_0%,_transparent_50%)]" />
          <div className="relative">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              พร้อมเปลี่ยนคลินิกของคุณ?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
              เริ่มทดลองใช้ฟรี 14 วัน ไม่ต้องใส่บัตรเครดิต
              <br />
              ติดตั้งง่าย ใช้งานได้ทันที
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/contact"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-base font-semibold text-primary shadow-lg transition-all hover:bg-white/90 sm:w-auto"
              >
                <Download size={20} />
                ดาวน์โหลดฟรี
              </Link>
              <Link
                href="/contact"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/30 px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-white/10 sm:w-auto"
              >
                <MessageCircle size={20} />
                พูดคุยกับเรา
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
