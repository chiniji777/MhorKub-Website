export const SITE = {
  name: "MhorKub",
  nameTh: "มหรคุณ",
  tagline: "ระบบบริหารคลินิกอัจฉริยะ",
  taglineEn: "Intelligent Clinic Management System",
  description: "ระบบบริหารคลินิกครบวงจร จัดการคนไข้ คิว ใบสั่งยา สต็อก บิล พร้อม AI ช่วยวินิจฉัย — ใช้งานได้ทั้งออนไลน์และออฟไลน์",
  url: "https://mhorkub.com",
} as const;

export const NAV_LINKS = [
  { href: "/", label: "หน้าหลัก" },
  { href: "/features", label: "ฟีเจอร์" },
  { href: "/pricing", label: "ราคา" },
  { href: "/blog", label: "บทความ" },
  { href: "/about", label: "เกี่ยวกับเรา" },
  { href: "/contact", label: "ติดต่อ" },
] as const;

export const FEATURES = [
  {
    icon: "Users",
    title: "จัดการคนไข้",
    titleEn: "Patient Management",
    description: "บันทึกข้อมูลคนไข้ครบถ้วน ประวัติการรักษา แพ้ยา โรคประจำตัว ค้นหาได้ทันที",
  },
  {
    icon: "ClipboardList",
    title: "ระบบคิวอัจฉริยะ",
    titleEn: "Smart Queue",
    description: "จัดคิวอัตโนมัติ แสดงผลบนจอ คนไข้ดูคิวผ่านมือถือได้ ไม่ต้องรอนาน",
  },
  {
    icon: "Stethoscope",
    title: "บันทึกการตรวจ",
    titleEn: "Medical Records",
    description: "SOAP Notes, Body Map, ICD Code พร้อม AI ช่วยแปลงเสียงเป็นบันทึก",
  },
  {
    icon: "Pill",
    title: "ใบสั่งยา & สต็อก",
    titleEn: "Prescription & Inventory",
    description: "สั่งยา เช็คแพ้ยา ตัดสต็อกอัตโนมัติ แจ้งเตือนยาใกล้หมด",
  },
  {
    icon: "Receipt",
    title: "บิล & การเงิน",
    titleEn: "Billing & Finance",
    description: "ออกบิล รับชำระ พิมพ์ใบเสร็จ สรุปรายได้ ครบจบในที่เดียว",
  },
  {
    icon: "Brain",
    title: "AI ช่วยวินิจฉัย",
    titleEn: "AI-Assisted Diagnosis",
    description: "แปลงเสียงเป็น SOAP อัตโนมัติ แนะนำการวินิจฉัย สั่งยา ด้วย AI",
  },
] as const;

export const PRICING_TIERS = [
  {
    name: "ทดลองใช้",
    nameEn: "Trial",
    price: "ฟรี",
    period: "14 วัน",
    features: [
      "ฟีเจอร์ครบทุกอย่าง",
      "จำกัด 50 คนไข้",
      "AI 20 ครั้ง",
      "เครื่องเดียว",
    ],
    cta: "เริ่มทดลอง",
    highlighted: false,
  },
  {
    name: "คลินิก",
    nameEn: "Clinic",
    price: "1,990",
    period: "บาท/เดือน",
    features: [
      "คนไข้ไม่จำกัด",
      "AI ไม่จำกัด",
      "3 เครื่อง",
      "สำรองข้อมูลอัตโนมัติ",
      "ซัพพอร์ตทาง LINE",
    ],
    cta: "สมัครเลย",
    highlighted: true,
  },
  {
    name: "โรงพยาบาล",
    nameEn: "Hospital",
    price: "ติดต่อเรา",
    period: "",
    features: [
      "ทุกอย่างใน Clinic",
      "เครื่องไม่จำกัด",
      "On-premise ได้",
      "Custom features",
      "ซัพพอร์ตเฉพาะทาง",
    ],
    cta: "ติดต่อฝ่ายขาย",
    highlighted: false,
  },
] as const;
