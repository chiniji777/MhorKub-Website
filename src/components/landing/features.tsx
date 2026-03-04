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
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            ฟีเจอร์ครบครัน
          </div>
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            ทุกอย่างที่คลินิกต้องการ
          </h2>
          <p className="mt-4 text-lg text-muted">
            ครบทุกฟีเจอร์ ใช้งานง่าย ไม่ต้องเรียนรู้นาน
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, index) => {
            const Icon = iconMap[feature.icon as keyof typeof iconMap];
            return (
              <div
                key={feature.title}
                className="group overflow-hidden rounded-2xl border border-border/50 bg-white transition-all duration-300 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
              >
                {/* Feature image */}
                <div className="aspect-[3/2] overflow-hidden bg-gradient-to-br from-primary/5 to-accent/5">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                <div className="p-6">
                  <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-2.5 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <Icon size={22} />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
