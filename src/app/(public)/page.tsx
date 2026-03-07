import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { Pricing } from "@/components/landing/pricing";
import { Testimonials } from "@/components/landing/testimonials";
import { Referral } from "@/components/landing/referral";
import { CTA } from "@/components/landing/cta";

export default function Home() {
  return (
    <>
      <Hero />
      <Features />
      <Pricing />
      <Referral />
      {/* <Testimonials /> — ยังไม่มีรีวิวจริง เปิดกลับมาทีหลัง */}
      <CTA />
    </>
  );
}
