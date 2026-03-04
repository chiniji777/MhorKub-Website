import { Users, ClipboardList, Stethoscope, Pill, Receipt, Brain, Wifi, WifiOff, Monitor, Printer, Shield, BarChart3 } from "lucide-react";

const allFeatures = [
  {
    category: "การจัดการคนไข้",
    items: [
      { icon: Users, title: "ทะเบียนคนไข้", desc: "บันทึกข้อมูลครบถ้วน HN, บัตรประชาชน, ประวัติ, แพ้ยา, โรคประจำตัว" },
      { icon: Shield, title: "ระบบแพ้ยา", desc: "เช็คแพ้ยาอัตโนมัติก่อนสั่งยา พร้อมแจ้งเตือนระดับความรุนแรง" },
      { icon: ClipboardList, title: "ประวัติการรักษา", desc: "ดูประวัติย้อนหลังทุกครั้งที่มา รวมการวินิจฉัย ยาที่ได้รับ ค่าใช้จ่าย" },
    ],
  },
  {
    category: "การตรวจรักษา",
    items: [
      { icon: Stethoscope, title: "SOAP Notes", desc: "บันทึกการตรวจแบบ SOAP พร้อม Body Map แสดงตำแหน่งที่ตรวจ" },
      { icon: Brain, title: "AI ช่วยบันทึก", desc: "พูดภาษาไทย AI แปลงเป็น SOAP Notes อัตโนมัติ พร้อมแนะนำ ICD Code" },
      { icon: Monitor, title: "ระบบคิว", desc: "จัดคิวอัตโนมัติ แสดงบนจอ คนไข้ดูผ่านมือถือ รองรับหลายห้องตรวจ" },
    ],
  },
  {
    category: "ยา & สต็อก",
    items: [
      { icon: Pill, title: "ใบสั่งยา", desc: "สั่งยา กำหนดวิธีใช้ ขนาด ความถี่ ตัดสต็อกอัตโนมัติเมื่อจ่ายยา" },
      { icon: BarChart3, title: "จัดการสต็อก", desc: "รับยาเข้า ดู lot/วันหมดอายุ แจ้งเตือนยาใกล้หมด OCR ใบแจ้งหนี้" },
      { icon: Receipt, title: "บิล & การเงิน", desc: "ออกบิลอัตโนมัติ รับชำระ พิมพ์ใบเสร็จ สรุปรายได้รายวัน/เดือน" },
    ],
  },
  {
    category: "ระบบ & เทคโนโลยี",
    items: [
      { icon: WifiOff, title: "Offline-First", desc: "ทำงานได้แม้ไม่มีเน็ต ข้อมูลเก็บในเครื่อง ปลอดภัย 100%" },
      { icon: Wifi, title: "หลายเครื่อง (LAN)", desc: "เชื่อมต่อหลายเครื่องในคลินิกผ่าน LAN ค้นหาเซิร์ฟเวอร์อัตโนมัติ" },
      { icon: Printer, title: "พิมพ์เอกสาร", desc: "พิมพ์ใบเสร็จ ใบสั่งยา ใบรับรองแพทย์ ตั๋วคิว ตรงจากระบบ" },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold text-foreground sm:text-5xl">
            ฟีเจอร์ทั้งหมด
          </h1>
          <p className="mt-4 text-lg text-muted">
            MhorKub ออกแบบมาสำหรับคลินิกไทยโดยเฉพาะ ใช้งานง่าย ครอบคลุมทุกขั้นตอน
          </p>
        </div>

        {allFeatures.map((group) => (
          <div key={group.category} className="mt-16">
            <h2 className="text-2xl font-bold text-foreground">{group.category}</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-border/50 bg-white p-6 transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3 text-primary">
                    <item.icon size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
