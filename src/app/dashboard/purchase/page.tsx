"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Crown,
  CreditCard,
  QrCode,
  Loader2,
  Check,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  Smartphone,
} from "lucide-react";
import QRCode from "qrcode";
import { cn } from "@/lib/utils";

interface Plan {
  id: number;
  name: string;
  durationDays: number;
  priceThb: number;
  stripePriceId: string | null;
}

type Step = "plans" | "payment" | "qr" | "slip" | "done" | "pending_review" | "rejected";

export default function PurchasePage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [step, setStep] = useState<Step>("plans");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  // PromptPay state
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [slipUploadToken, setSlipUploadToken] = useState<string | null>(null);
  const [slipUploadQr, setSlipUploadQr] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }
    // Check for cancelled payment
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "cancelled") {
      setError("การชำระเงินถูกยกเลิก");
    }

    fetch("/api/v1/plans")
      .then((r) => r.json())
      .then((data) => {
        // Filter out free plans (trial) and sort by price ascending
        const paid = data.filter((p: Plan) => p.priceThb > 0);
        paid.sort((a: Plan, b: Plan) => a.priceThb - b.priceThb);
        setPlans(paid);
      })
      .catch(() => setError("โหลดแพ็กเกจไม่ได้"))
      .finally(() => setLoadingPlans(false));
  }, [router, token]);

  // ─── Stripe Checkout ───────────────────────────────────────────

  async function handleStripeCheckout() {
    if (!selectedPlan || !token) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
          referralCode: referralCode || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Redirect to Stripe Checkout
      window.location.href = data.checkoutUrl;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      setLoading(false);
    }
  }

  // ─── PromptPay Flow ────────────────────────────────────────────

  async function handlePromptPay() {
    if (!selectedPlan || !token) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/v1/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
          referralCode: referralCode || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setQrDataUrl(data.qrDataUrl);
      setOrderId(data.order.id);

      // Generate mobile slip upload QR
      if (data.slipUploadToken) {
        setSlipUploadToken(data.slipUploadToken);
        const base = window.location.origin;
        const uploadUrl = `${base}/slip/${data.slipUploadToken}`;
        const qr = await QRCode.toDataURL(uploadUrl, { width: 200, margin: 1 });
        setSlipUploadQr(qr);
      }

      setStep("qr");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  function handleSlipSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSlipPreview(reader.result as string);
      setStep("slip");
    };
    reader.readAsDataURL(file);
  }

  async function handleSlipSubmit() {
    if (!slipPreview || !orderId || !token) return;
    setVerifying(true);
    setError("");

    try {
      const res = await fetch(`/api/v1/orders/${orderId}/verify-slip`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ slipImage: slipPreview }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.status === "rejected") {
        setRejectReason(data.message || "สลิปไม่ผ่านการตรวจสอบ");
        setStep("rejected");
      } else if (data.status === "pending_review") {
        setStep("pending_review");
      } else {
        setStep("done");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "ตรวจสอบสลิปล้มเหลว");
    } finally {
      setVerifying(false);
    }
  }

  // Auto-redirect to dashboard after success
  useEffect(() => {
    if (step !== "done") return;
    const timer = setTimeout(() => router.push("/dashboard"), 3000);
    return () => clearTimeout(timer);
  }, [step, router]);

  // ─── Poll for mobile slip upload ──────────────────────────────

  useEffect(() => {
    if (!slipUploadToken) return;
    if (step !== "qr" && step !== "slip") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/v1/slip/status?token=${slipUploadToken}&_t=${Date.now()}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (data.uploaded) {
          clearInterval(interval);
          if (data.status === "paid") setStep("done");
          else if (data.status === "pending_review") setStep("pending_review");
          else if (data.status === "rejected") {
            setRejectReason(data.message || "สลิปไม่ผ่าน");
            setStep("rejected");
          }
        }
      } catch { /* ignore polling errors */ }
    }, 4000);

    return () => clearInterval(interval);
  }, [slipUploadToken, step]);

  // ─── Price Helpers ─────────────────────────────────────────────

  function formatPrice(satang: number) {
    return (satang / 100).toLocaleString("th-TH");
  }

  function cashbackAmount(plan: Plan) {
    if (!referralCode) return 0;
    return Math.round(plan.priceThb * 0.1);
  }

  function periodLabel(days: number) {
    if (days <= 30) return "เดือน";
    if (days <= 180) return "6 เดือน";
    return "ปี";
  }

  // ─── Loading ───────────────────────────────────────────────────

  if (loadingPlans) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-white">
      {/* Header */}
      <header className="border-b border-border/50 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <ArrowLeft size={16} className="text-muted" />
            <span className="text-lg font-bold text-primary">MhorKub</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-bold text-foreground">
          <Crown className="mr-2 inline h-6 w-6 text-primary" />
          ซื้อแพ็กเกจ
        </h1>
        <p className="mb-6 text-sm text-muted">
          เลือกแพ็กเกจและช่องทางชำระเงินที่สะดวก
        </p>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* ─── Step 1: Select Plan ─── */}
        {step === "plans" && (
          <>
            <div className="mb-6 grid gap-3 sm:grid-cols-3">
              {plans.map((plan) => {
                const isBestSeller = plan.durationDays === 30;
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    className={cn(
                      "relative rounded-xl border-2 p-5 text-left transition-all",
                      selectedPlan?.id === plan.id
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border/50 bg-white hover:border-primary/30 hover:shadow-sm"
                    )}
                  >
                    {isBestSeller && (
                      <span className="absolute -top-2.5 right-3 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                        Best Seller
                      </span>
                    )}
                    <p className="text-sm font-medium text-muted">{plan.name}</p>
                    <p className="mt-1 text-xl font-bold text-foreground">
                      {formatPrice(plan.priceThb)}{" "}
                      <span className="text-sm font-normal text-muted">
                        บาท/{periodLabel(plan.durationDays)}
                      </span>
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {plan.durationDays} วัน
                    </p>
                    {selectedPlan?.id === plan.id && (
                      <Check className="mt-2 h-5 w-5 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Referral Code */}
            <div className="mb-6">
              <label className="mb-1 block text-sm font-medium text-foreground">
                รหัสแนะนำ (ถ้ามี)
              </label>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="เช่น MHK-ABC123"
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none"
              />
              {referralCode && (
                <p className="mt-1 text-xs text-accent">
                  ✨ รับเงินคืน 10% เมื่อใช้รหัสแนะนำ
                </p>
              )}
            </div>

            {selectedPlan && (
              <div className="space-y-3">
                {/* Price summary */}
                <div className="rounded-xl border border-border/50 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted">แพ็กเกจ</span>
                    <span className="font-medium">{selectedPlan.name}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t pt-2">
                    <span className="font-semibold">ยอดชำระ</span>
                    <span className="text-lg font-bold text-primary">
                      {formatPrice(selectedPlan.priceThb)} บาท
                    </span>
                  </div>
                  {referralCode && (
                    <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-sm">
                      <span className="text-emerald-700">เงินคืน 10%</span>
                      <span className="font-semibold text-emerald-600">
                        +{formatPrice(cashbackAmount(selectedPlan))} บาท
                      </span>
                    </div>
                  )}
                </div>

                {/* Payment method buttons */}
                <button
                  onClick={() => setStep("payment")}
                  className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow-md"
                >
                  เลือกช่องทางชำระเงิน
                </button>
              </div>
            )}
          </>
        )}

        {/* ─── Step 1.5: Choose Payment Method ─── */}
        {step === "payment" && selectedPlan && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border/50 bg-white p-4">
              <p className="mb-1 text-sm text-muted">แพ็กเกจที่เลือก</p>
              <p className="text-lg font-bold text-foreground">
                {selectedPlan.name} —{" "}
                <span className="text-primary">
                  {formatPrice(selectedPlan.priceThb)} บาท
                </span>
              </p>
            </div>

            {/* PromptPay (QR) — Primary */}
            <button
              onClick={handlePromptPay}
              disabled={loading}
              className="flex w-full items-center gap-4 rounded-xl border-2 border-primary bg-primary/5 p-5 text-left transition-all hover:bg-primary/10 hover:shadow-md disabled:opacity-50"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <QrCode className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">PromptPay QR</p>
                <p className="text-xs text-muted">
                  จ่ายครั้งเดียว · สแกน QR แล้วอัปโหลดสลิป
                </p>
              </div>
              {loading && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
            </button>

            {/* Stripe (Card) — Secondary */}
            {selectedPlan.stripePriceId && (
              <button
                onClick={handleStripeCheckout}
                disabled={loading}
                className="flex w-full items-center gap-4 rounded-xl border-2 border-border/50 bg-white p-5 text-left transition-all hover:border-primary/30 hover:shadow-md disabled:opacity-50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-50">
                  <CreditCard className="h-6 w-6 text-slate-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">
                    บัตรเครดิต / เดบิต
                  </p>
                  <p className="text-xs text-muted">
                    ต่ออายุอัตโนมัติ · Visa, MasterCard, JCB
                  </p>
                </div>
                <div className="text-xs font-medium text-muted">
                  <Sparkles size={14} className="mr-1 inline" />
                  Auto-Renew
                </div>
                {loading && <Loader2 className="h-5 w-5 animate-spin text-slate-600" />}
              </button>
            )}

            <button
              onClick={() => setStep("plans")}
              className="w-full text-center text-sm text-muted hover:text-foreground"
            >
              ← เปลี่ยนแพ็กเกจ
            </button>
          </div>
        )}

        {/* ─── Step 2: PromptPay QR ─── */}
        {step === "qr" && qrDataUrl && (
          <div className="text-center">
            <div className="mx-auto mb-4 inline-block rounded-2xl border border-border/50 bg-white p-6 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt="PromptPay QR"
                className="mx-auto h-64 w-64"
              />
            </div>
            <p className="mb-1 text-lg font-bold text-foreground">
              สแกน QR เพื่อชำระ{" "}
              <span className="text-primary">
                {selectedPlan ? formatPrice(selectedPlan.priceThb) : "—"} บาท
              </span>
            </p>
            <p className="mb-6 text-sm text-muted">
              ชำระเงินแล้ว กรุณาอัปโหลดสลิป
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleSlipSelect}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-dark"
            >
              <Upload size={16} className="mr-2 inline" />
              อัปโหลดสลิปจากเครื่องนี้
            </button>

            {/* Mobile Slip Upload QR */}
            {slipUploadQr && (
              <div className="mt-6 border-t border-border/30 pt-6">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Smartphone size={16} className="text-emerald-500" />
                  <p className="text-sm font-medium text-foreground">
                    หรือ อัปโหลดสลิปจากมือถือ
                  </p>
                </div>
                <div className="mx-auto inline-block rounded-xl border border-border/50 bg-white p-3 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slipUploadQr}
                    alt="Scan to upload slip"
                    className="h-40 w-40"
                  />
                </div>
                <p className="mt-2 text-xs text-muted">
                  สแกน QR นี้ด้วยมือถือ → แนบสลิปส่งได้เลย
                </p>
              </div>
            )}
          </div>
        )}

        {/* ─── Step 3: Confirm Slip ─── */}
        {step === "slip" && slipPreview && (
          <div className="text-center">
            <div className="mx-auto mb-4 inline-block overflow-hidden rounded-2xl border border-border/50 bg-white shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slipPreview}
                alt="Slip preview"
                className="max-h-80 object-contain"
              />
            </div>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => {
                  setSlipPreview(null);
                  setStep("qr");
                }}
                className="rounded-lg border border-border px-5 py-2.5 text-sm text-muted hover:bg-background"
              >
                เลือกใหม่
              </button>
              <button
                onClick={handleSlipSubmit}
                disabled={verifying}
                className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
              >
                {verifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    กำลังตรวจสอบ...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    ยืนยันการชำระเงิน
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ─── Done ─── */}
        {step === "done" && (
          <div className="text-center py-12">
            <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
            <h2 className="text-xl font-bold text-foreground">
              ชำระเงินสำเร็จ!
            </h2>
            <p className="mt-2 text-sm text-muted">
              สิทธิ์ใช้งานถูกเปิดใช้งานแล้ว
            </p>
            <p className="mt-4 text-xs text-muted">กำลังกลับหน้า Dashboard อัตโนมัติ...</p>
            <Link
              href="/dashboard"
              className="mt-4 inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              กลับหน้า Dashboard
            </Link>
          </div>
        )}

        {/* ─── Rejected ─── */}
        {step === "rejected" && (
          <div className="text-center py-12">
            <AlertCircle className="mx-auto mb-4 h-16 w-16 text-red-500" />
            <h2 className="text-xl font-bold text-foreground">
              สลิปไม่ผ่านการตรวจสอบ
            </h2>
            <p className="mt-2 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3 inline-block">
              {rejectReason}
            </p>
            <p className="mt-4 text-sm text-muted">
              กรุณาชำระเงินใหม่และอัปโหลดสลิปที่ถูกต้อง
            </p>
            <button
              onClick={() => {
                setSlipPreview(null);
                setRejectReason("");
                setStep("qr");
              }}
              className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        )}

        {/* ─── Pending Review ─── */}
        {step === "pending_review" && (
          <div className="text-center py-12">
            <Clock className="mx-auto mb-4 h-16 w-16 text-amber-500" />
            <h2 className="text-xl font-bold text-foreground">
              รอตรวจสอบ
            </h2>
            <p className="mt-2 text-sm text-muted">
              ส่งสลิปแล้ว กรุณารอ Admin ตรวจสอบ (ปกติไม่เกิน 30 นาที)
            </p>
            <Link
              href="/dashboard"
              className="mt-6 inline-block rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              กลับหน้า Dashboard
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
