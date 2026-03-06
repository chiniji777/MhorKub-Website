import type { Metadata } from "next";
import { Inter, IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";
import AnalyticsTracker from "@/components/analytics-tracker";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexSansThai = IBM_Plex_Sans_Thai({
  variable: "--font-ibm-plex-sans-thai",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MhorKub — ระบบบริหารคลินิกอัจฉริยะ",
  description: "ระบบบริหารคลินิกครบวงจร จัดการคนไข้ คิว ใบสั่งยา สต็อก บิล พร้อม AI ช่วยวินิจฉัย — ใช้งานได้ทั้งออนไลน์และออฟไลน์",
  keywords: ["คลินิก", "ระบบคลินิก", "clinic management", "MhorKub", "มหรคุณ"],
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="scroll-smooth">
      <body className={`${inter.variable} ${ibmPlexSansThai.variable} antialiased`}>
        <AnalyticsTracker />
        {children}
      </body>
    </html>
  );
}
