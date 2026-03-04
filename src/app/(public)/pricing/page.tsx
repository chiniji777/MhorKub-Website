import { Pricing } from "@/components/landing/pricing";
import { Check, X } from "lucide-react";

const comparisonFeatures = [
  { name: "จำนวนคนไข้", trial: "50 คน", clinic: "ไม่จำกัด", hospital: "ไม่จำกัด" },
  { name: "จำนวนเครื่อง", trial: "1", clinic: "3", hospital: "ไม่จำกัด" },
  { name: "AI ช่วยวินิจฉัย", trial: "20 ครั้ง", clinic: "ไม่จำกัด", hospital: "ไม่จำกัด" },
  { name: "ระบบคิว", trial: true, clinic: true, hospital: true },
  { name: "ใบสั่งยา & สต็อก", trial: true, clinic: true, hospital: true },
  { name: "บิล & การเงิน", trial: true, clinic: true, hospital: true },
  { name: "สำรองข้อมูลอัตโนมัติ", trial: false, clinic: true, hospital: true },
  { name: "รองรับ LAN หลายเครื่อง", trial: false, clinic: true, hospital: true },
  { name: "On-premise deployment", trial: false, clinic: false, hospital: true },
  { name: "Custom features", trial: false, clinic: false, hospital: true },
  { name: "ซัพพอร์ตเฉพาะทาง", trial: false, clinic: false, hospital: true },
];

function CellValue({ value }: { value: boolean | string }) {
  if (typeof value === "string") return <span className="text-sm font-medium text-foreground">{value}</span>;
  return value ? <Check size={18} className="text-primary" /> : <X size={18} className="text-muted/40" />;
}

export default function PricingPage() {
  return (
    <div>
      <Pricing />

      <section className="bg-white py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-10 text-center text-2xl font-bold text-foreground">
            เปรียบเทียบแพ็กเกจ
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-4 pr-4 text-sm font-semibold text-foreground">ฟีเจอร์</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-foreground">ทดลองใช้</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-primary">คลินิก</th>
                  <th className="px-4 py-4 text-center text-sm font-semibold text-foreground">โรงพยาบาล</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((f) => (
                  <tr key={f.name} className="border-b border-border/50">
                    <td className="py-3.5 pr-4 text-sm text-muted">{f.name}</td>
                    <td className="px-4 py-3.5 text-center"><CellValue value={f.trial} /></td>
                    <td className="px-4 py-3.5 text-center bg-primary/5"><CellValue value={f.clinic} /></td>
                    <td className="px-4 py-3.5 text-center"><CellValue value={f.hospital} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
