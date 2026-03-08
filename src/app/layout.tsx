import type { Metadata } from "next";
import { Inter, IBM_Plex_Sans_Thai } from "next/font/google";
import "./globals.css";
import AnalyticsTracker from "@/components/analytics-tracker";
import FacebookPixel from "@/components/fb-pixel";

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
  openGraph: {
    title: "MhorKub — ระบบบริหารคลินิกอัจฉริยะ",
    description: "ระบบบริหารคลินิกครบวงจร จัดการคนไข้ คิว ใบสั่งยา สต็อก บิล พร้อม AI ช่วยวินิจฉัย — ใช้งานได้ทั้งออนไลน์และออฟไลน์",
    url: "https://mhorkub.com",
    siteName: "MhorKub",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MhorKub — ระบบบริหารคลินิกอัจฉริยะ",
      },
    ],
    locale: "th_TH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MhorKub — ระบบบริหารคลินิกอัจฉริยะ",
    description: "ระบบบริหารคลินิกครบวงจร จัดการคนไข้ คิว ใบสั่งยา สต็อก บิล พร้อม AI ช่วยวินิจฉัย",
    images: ["/og-image.png"],
  },
  metadataBase: new URL("https://mhorkub.com"),
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
        <FacebookPixel />
        {children}
      </body>
    </html>
  );
}
