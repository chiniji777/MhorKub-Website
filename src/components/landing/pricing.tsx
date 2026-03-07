import Link from "next/link";
import { Check, Star } from "lucide-react";
import { PRICING_TIERS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Pricing() {
  return (
    <section id="pricing" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            <Star size={12} />
            ราคาสุดคุ้ม
          </div>
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            ราคาที่เหมาะกับทุกคลินิก
          </h2>
          <p className="mt-4 text-lg text-muted">
            เริ่มต้นทดลองฟรี 14 วัน ไม่ต้องใส่บัตรเครดิต
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                "relative flex flex-col rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1",
                tier.highlighted
                  ? "border-primary bg-white shadow-xl shadow-primary/10 ring-1 ring-primary/20 lg:scale-105"
                  : "border-border/50 bg-white hover:border-primary/20 hover:shadow-lg"
              )}
            >
              {tier.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-primary to-primary-dark px-4 py-1 text-xs font-semibold text-white shadow-md">
                  แนะนำ
                </div>
              )}

              <h3 className="text-base font-semibold text-foreground">{tier.name}</h3>
              <p className="text-xs text-muted">{tier.nameEn}</p>

              <div className="mt-4 flex items-baseline gap-1">
                <span className={cn(
                  "text-3xl font-bold",
                  tier.highlighted ? "text-primary" : "text-foreground"
                )}>
                  {tier.price}
                </span>
              </div>
              {tier.period && (
                <p className="mt-1 text-xs text-muted">{tier.period}</p>
              )}
              {tier.periodDays === 180 && (
                <p className="mt-1 text-xs text-muted">เฉลี่ย 1,000 บาท/เดือน</p>
              )}
              {tier.periodDays === 365 && (
                <p className="mt-1 text-xs text-muted">เฉลี่ย 833 บาท/เดือน</p>
              )}

              <ul className="mt-6 flex-1 space-y-2.5">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-muted">
                    <Check size={16} className="mt-0.5 shrink-0 text-accent" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href="/register"
                className={cn(
                  "mt-6 block rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition-all",
                  tier.highlighted
                    ? "bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary-dark hover:-translate-y-0.5"
                    : "border border-border bg-background text-foreground hover:border-primary/30 hover:bg-primary/5"
                )}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-muted mt-8">
          ยกเลิกได้ทุกเมื่อ ไม่มีค่าปรับ &bull; ไม่พอใจ คืนเงินภายใน 30 วัน
        </p>
      </div>
    </section>
  );
}
