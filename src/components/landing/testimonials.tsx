const testimonials = [
  {
    name: "นพ. สมชาย วิไลศักดิ์",
    role: "เจ้าของคลินิกทั่วไป",
    content: "ใช้มา 6 เดือน จัดการคนไข้ได้เร็วขึ้นมาก ระบบคิวช่วยลดการรอคอย คนไข้ชอบมาก",
    avatar: "สช",
  },
  {
    name: "พญ. อรทัย มั่นใจดี",
    role: "คลินิกผิวหนัง",
    content: "AI ช่วยเขียน SOAP Notes ได้ดีมาก ประหยัดเวลาบันทึกไปเยอะ แนะนำเลยค่ะ",
    avatar: "อท",
  },
  {
    name: "ภก. ธนพล เจริญสุข",
    role: "เภสัชกร",
    content: "ระบบเช็คแพ้ยาอัตโนมัติเป็นฟีเจอร์ที่ดีมาก ช่วยป้องกันความผิดพลาดได้จริง",
    avatar: "ธพ",
  },
];

export function Testimonials() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            เสียงจากผู้ใช้จริง
          </h2>
          <p className="mt-4 text-lg text-muted">
            คลินิกทั่วประเทศไว้วางใจ MhorKub
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl border border-border/50 bg-background p-8"
            >
              <p className="text-sm leading-relaxed text-muted">
                &ldquo;{t.content}&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
