import Image from "next/image";
import { Heart, Shield, Zap } from "lucide-react";

const values = [
  {
    icon: Heart,
    title: "ใส่ใจผู้ใช้",
    desc: "เราเข้าใจว่าบุคลากรทางการแพทย์มีเวลาจำกัด MhorKub ออกแบบให้ใช้งานง่ายที่สุด ลดขั้นตอนที่ไม่จำเป็น",
  },
  {
    icon: Shield,
    title: "ปลอดภัยมาตรฐาน",
    desc: "ข้อมูลคนไข้เก็บในเครื่องของคลินิก ไม่ส่งขึ้นคลาวด์ ปลอดภัยตามมาตรฐานทางการแพทย์",
  },
  {
    icon: Zap,
    title: "นวัตกรรม AI",
    desc: "ผสาน AI เข้ากับงานคลินิก ช่วยบันทึกการตรวจ แนะนำการวินิจฉัย ประหยัดเวลาจริง",
  },
];

export default function AboutPage() {
  return (
    <div className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold text-foreground sm:text-5xl">
            เกี่ยวกับ MhorKub
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted">
            MhorKub พัฒนาโดยทีมที่เข้าใจปัญหาของคลินิกไทย
            เราต้องการสร้างระบบที่ใช้งานง่าย ราคาเข้าถึงได้
            และมีเทคโนโลยี AI ช่วยลดภาระงานให้บุคลากรทางการแพทย์
          </p>
        </div>

        <div className="mx-auto mt-20 max-w-4xl">
          <div className="rounded-3xl border border-border/50 bg-white p-8 sm:p-12">
            <h2 className="text-2xl font-bold text-foreground">วิสัยทัศน์</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted">
              เราเชื่อว่าทุกคลินิกในประเทศไทย ไม่ว่าเล็กหรือใหญ่
              ควรเข้าถึงระบบบริหารจัดการที่ทันสมัยและมีประสิทธิภาพได้
              MhorKub สร้างมาเพื่อเป็นคำตอบนั้น
            </p>
          </div>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {values.map((v) => (
            <div key={v.title} className="rounded-2xl border border-border/50 bg-white p-8 text-center">
              <div className="mx-auto mb-5 inline-flex rounded-xl bg-primary/10 p-3 text-primary">
                <v.icon size={28} />
              </div>
              <h3 className="text-lg font-semibold text-foreground">{v.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{v.desc}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-20 max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-foreground">ตัวเลขที่พูดแทน</h2>
          <div className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-4">
            {[
              { num: "500+", label: "คลินิกที่ใช้งาน" },
              { num: "50,000+", label: "คนไข้ในระบบ" },
              { num: "99.9%", label: "Uptime" },
              { num: "4.9★", label: "คะแนนผู้ใช้" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-bold text-primary">{s.num}</p>
                <p className="mt-1 text-sm text-muted">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
