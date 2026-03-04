import { Users, ClipboardList, Stethoscope, Pill, Receipt, Brain } from "lucide-react";
import { FEATURES } from "@/lib/constants";

const iconMap = {
  Users,
  ClipboardList,
  Stethoscope,
  Pill,
  Receipt,
  Brain,
} as const;

export function Features() {
  return (
    <section id="features" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            ทุกอย่างที่คลินิกต้องการ
          </h2>
          <p className="mt-4 text-lg text-muted">
            ครบทุกฟีเจอร์ ใช้งานง่าย ไม่ต้องเรียนรู้นาน
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = iconMap[feature.icon as keyof typeof iconMap];
            return (
              <div
                key={feature.title}
                className="group rounded-2xl border border-border/50 bg-background p-8 transition-all duration-300 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="mb-5 inline-flex rounded-xl bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <Icon size={24} />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
