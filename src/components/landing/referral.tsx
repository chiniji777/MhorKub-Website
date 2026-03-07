import { Gift, Users, Coins } from "lucide-react";
import Link from "next/link";

const benefits = [
  {
    icon: Gift,
    title: "แนะนำเพื่อน ได้เงินคืน",
    desc: "ทั้งคุณและเพื่อนได้รับเงินคืน 10% จากการซื้อแพ็กเกจ",
  },
  {
    icon: Coins,
    title: "ใช้เป็นเครดิต AI",
    desc: "นำเงินที่ได้ไปใช้เป็นเครดิต AI ได้เลย ไม่ต้องเติมเพิ่ม",
  },
  {
    icon: Users,
    title: "ไม่จำกัดจำนวนคน",
    desc: "แนะนำได้ไม่จำกัด ยิ่งแนะนำมาก ยิ่งได้เครดิตมาก",
  },
];

export function Referral() {
  return (
    <section className="bg-gradient-to-b from-primary/5 to-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
            <Gift size={16} />
            โปรแกรมแนะนำเพื่อน
          </span>
          <h2 className="mt-6 text-3xl font-bold text-foreground sm:text-4xl">
            แนะนำเพื่อน <span className="text-primary">ได้เงินคืนทั้งคู่</span>
          </h2>
          <p className="mt-4 text-lg text-muted">
            แชร์รหัสแนะนำของคุณให้เพื่อน รับเงินคืน 10% ทั้งคนแนะนำและคนถูกแนะนำ
          </p>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-3">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="rounded-2xl border border-border/50 bg-white p-8 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <b.icon size={28} className="text-primary" />
              </div>
              <h3 className="mt-5 text-lg font-bold text-foreground">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{b.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:bg-primary-dark hover:shadow-xl"
          >
            ดูรายละเอียดโปรแกรมแนะนำเพื่อน
          </Link>
        </div>
      </div>
    </section>
  );
}
