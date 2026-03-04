import Link from "next/link";
import { Check } from "lucide-react";
import { PRICING_TIERS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function Pricing() {
  return (
    <section id="pricing" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            ราคาที่เหมาะกับทุกคลินิก
          </h2>
          <p className="mt-4 text-lg text-muted">
            เริ่มต้นทดลองฟรี ไม่ต้องใส่บัตรเครดิต
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {PRICING_TIERS.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                "relative rounded-2xl border p-8 transition-all",
                tier.highlighted
                  ? "border-primary bg-white shadow-xl shadow-primary/10 scale-105"
                  : "border-border/50 bg-white hover:border-primary/20 hover:shadow-lg"
              )}
            >
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-white">
                  แนะนำ
                </div>
              )}

              <h3 className="text-lg font-semibold text-foreground">{tier.name}</h3>
              <p className="text-sm text-muted">{tier.nameEn}</p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">{tier.price}</span>
                {tier.period && <span className="text-sm text-muted">/{tier.period}</span>}
              </div>

              <ul className="mt-8 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-muted">
                    <Check size={18} className="mt-0.5 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href="/contact"
                className={cn(
                  "mt-8 block rounded-xl px-6 py-3 text-center text-sm font-semibold transition-all",
                  tier.highlighted
                    ? "bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary-dark"
                    : "border border-border bg-background text-foreground hover:border-primary/30 hover:bg-primary/5"
                )}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
