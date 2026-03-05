"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Cpu,
  Loader2,
  QrCode,
  Check,
  Sparkles,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TOPUP_AMOUNTS = [50, 100, 300, 500, 1000, 5000, 10000];

type Step = "select" | "qr" | "slip" | "done" | "pending_review" | "rejected";

export default function TopupPage() {
  const [step, setStep] = useState<Step>("select");
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [topupId, setTopupId] = useState<number | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [newBalance, setNewBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [error, setError] = useState("");
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [debugMsg, setDebugMsg] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }

    fetch("/api/v1/ai/balance", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Unauthorized");
        return r.json();
      })
      .then((data) => setBalance(data.creditBalance ?? 0))
      .catch(() => router.push("/login"))
      .finally(() => setLoadingBalance(false));
  }, [router]);

  function getToken() {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return null;
    }
    return token;
  }

  // Step 1 → 2: Create topup + get QR
  async function handleCreateTopup() {
    if (!selected) return;
    const token = getToken();
    if (!token) return;

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/v1/ai/topup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amountThb: selected * 100 }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "ไม่สามารถสร้าง QR ได้");
        return;
      }

      setQrDataUrl(data.qrDataUrl);
      setTopupId(data.topup.id);
      setStep("qr");
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  }

  // Handle slip file selection
  function handleSlipFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSlipPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  // Step 3: Upload slip → verify
  async function handleVerifySlip() {
    if (!slipPreview || !topupId) return;
    const token = getToken();
    if (!token) return;

    setError("");
    setVerifying(true);

    try {
      const res = await fetch(`/api/v1/ai/topup/${topupId}/verify-slip`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ slipImage: slipPreview }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "ตรวจสอบสลิปไม่สำเร็จ");
        return;
      }

      // Validation failed → show rejection reason
      if (data.status === "rejected") {
        setRejectReason(data.message || "สลิปไม่ผ่านการตรวจสอบ");
        setStep("rejected");
        return;
      }

      // SlipOK failed → pending admin review
      if (data.status === "pending_review") {
        setDebugMsg(data.debug || null);
        setStep("pending_review");
        return;
      }

      setNewBalance(data.newBalance);
      setStep("done");
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setVerifying(false);
    }
  }

  // Reset everything
  function resetFlow() {
    setStep("select");
    setSelected(null);
    setQrDataUrl(null);
    setTopupId(null);
    setSlipPreview(null);
    setError("");
    if (newBalance !== null) setBalance(newBalance);
    setNewBalance(null);
  }

  if (loadingBalance) {
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
        <div className="mx-auto flex max-w-xl items-center gap-3 px-4 py-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            กลับ
          </Link>
          <span className="text-lg font-bold text-foreground">เติมเครดิต AI</span>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-8">
        {/* Current Balance */}
        <div className="mb-6 rounded-2xl border border-border/50 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm text-muted">
            <Cpu size={16} className="text-accent" />
            เครดิตคงเหลือ
          </div>
          <p className="mt-1 text-3xl font-bold text-accent">
            {balance !== null
              ? (balance / 100).toLocaleString("th-TH", { minimumFractionDigits: 2 })
              : "—"}{" "}
            <span className="text-base font-normal text-muted">บาท</span>
          </p>
        </div>

        {/* Step indicator */}
        <div className="mb-6 flex items-center justify-center gap-2 text-xs text-muted">
          <span className={cn("rounded-full px-2.5 py-1 font-medium", step === "select" ? "bg-accent text-white" : "bg-border/30")}>
            1. เลือกจำนวน
          </span>
          <span className="text-border">→</span>
          <span className={cn("rounded-full px-2.5 py-1 font-medium", step === "qr" ? "bg-accent text-white" : "bg-border/30")}>
            2. สแกนจ่าย
          </span>
          <span className="text-border">→</span>
          <span className={cn("rounded-full px-2.5 py-1 font-medium", step === "slip" || step === "done" || step === "pending_review" ? "bg-accent text-white" : "bg-border/30")}>
            3. ส่งสลิป
          </span>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* ── STEP 1: Select Amount ─────────────────── */}
        {step === "select" && (
          <>
            <div className="mb-6">
              <h2 className="mb-3 text-sm font-medium text-muted">เลือกจำนวนเงิน</h2>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {TOPUP_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setSelected(amount)}
                    className={cn(
                      "relative rounded-xl border-2 px-3 py-4 text-center font-bold transition-all hover:-translate-y-0.5",
                      selected === amount
                        ? "border-accent bg-accent/5 text-accent shadow-md shadow-accent/10"
                        : "border-border/50 bg-white text-foreground hover:border-accent/30 hover:shadow-sm"
                    )}
                  >
                    {selected === amount && (
                      <div className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-white">
                        <Check size={12} />
                      </div>
                    )}
                    <span className="text-lg">{amount.toLocaleString()}</span>
                    <span className="block text-xs font-normal text-muted">บาท</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleCreateTopup}
              disabled={!selected || loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition-all hover:bg-accent/90 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  กำลังสร้าง QR...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  {selected ? `เติมเครดิต ${selected.toLocaleString()} บาท` : "เลือกจำนวนเงินก่อน"}
                </>
              )}
            </button>
          </>
        )}

        {/* ── STEP 2: Show QR ───────────────────────── */}
        {step === "qr" && qrDataUrl && (
          <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6 text-center shadow-sm">
            <div className="mb-3 flex items-center justify-center gap-2">
              <QrCode size={20} className="text-accent" />
              <h2 className="text-lg font-bold text-foreground">สแกนจ่ายเงิน</h2>
            </div>
            <p className="mb-4 text-sm text-muted">
              สแกน QR Code ด้วยแอปธนาคาร เพื่อเติมเครดิต{" "}
              <span className="font-semibold text-accent">{selected?.toLocaleString()} บาท</span>
            </p>
            <div className="mx-auto w-fit rounded-xl bg-white p-4 shadow-md">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrDataUrl} alt="PromptPay QR Code" className="h-64 w-64" />
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => setStep("slip")}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition-all hover:bg-accent/90"
              >
                <Upload size={16} />
                โอนแล้ว → ส่งสลิป
              </button>
              <button
                onClick={resetFlow}
                className="rounded-lg px-4 py-2 text-sm text-muted hover:bg-background transition-colors"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Upload Slip ───────────────────── */}
        {step === "slip" && (
          <div className="rounded-2xl border border-border/50 bg-white p-6 shadow-sm">
            <h2 className="mb-1 text-lg font-bold text-foreground">ส่งสลิปยืนยัน</h2>
            <p className="mb-4 text-sm text-muted">
              อัปโหลดภาพสลิปการโอนเงิน {selected?.toLocaleString()} บาท
            </p>

            {/* File input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleSlipFile}
              className="hidden"
            />

            {slipPreview ? (
              <div className="mb-4">
                <div className="relative mx-auto w-fit overflow-hidden rounded-xl border border-border shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={slipPreview} alt="สลิป" className="max-h-80 w-auto" />
                </div>
                <button
                  onClick={() => {
                    setSlipPreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="mt-2 text-sm text-muted hover:text-red-500 transition-colors"
                >
                  เปลี่ยนรูป
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-12 text-sm text-muted hover:border-accent/50 hover:text-accent transition-colors"
              >
                <Upload size={20} />
                คลิกเพื่ออัปโหลดสลิป
              </button>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleVerifySlip}
                disabled={!slipPreview || verifying}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition-all hover:bg-accent/90 disabled:opacity-50"
              >
                {verifying ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    กำลังตรวจสอบ...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    ยืนยันสลิป
                  </>
                )}
              </button>
              <button
                onClick={() => setStep("qr")}
                disabled={verifying}
                className="rounded-xl border border-border px-4 py-3 text-sm text-muted hover:bg-background transition-colors disabled:opacity-50"
              >
                กลับ
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Done ──────────────────────────── */}
        {step === "done" && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center shadow-sm">
            <CheckCircle size={48} className="mx-auto mb-3 text-green-500" />
            <h2 className="text-xl font-bold text-foreground">เติมเครดิตสำเร็จ!</h2>
            <p className="mt-2 text-sm text-muted">
              เติมเครดิต{" "}
              <span className="font-semibold text-green-600">{selected?.toLocaleString()} บาท</span>{" "}
              เข้าบัญชีเรียบร้อยแล้ว
            </p>
            {newBalance !== null && (
              <p className="mt-3 text-2xl font-bold text-accent">
                {(newBalance / 100).toLocaleString("th-TH", { minimumFractionDigits: 2 })}{" "}
                <span className="text-base font-normal text-muted">บาท</span>
              </p>
            )}
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={resetFlow}
                className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white hover:bg-accent/90 transition-colors"
              >
                เติมเครดิตอีกครั้ง
              </button>
              <Link
                href="/dashboard"
                className="rounded-xl border border-border px-4 py-3 text-sm text-muted hover:bg-background transition-colors"
              >
                กลับ Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* ── STEP: Rejected ───────────────────────── */}
        {step === "rejected" && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
            <AlertCircle size={48} className="mx-auto mb-3 text-red-500" />
            <h2 className="text-xl font-bold text-foreground">สลิปไม่ผ่านการตรวจสอบ</h2>
            <p className="mt-3 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-600 inline-block">
              {rejectReason}
            </p>
            <p className="mt-4 text-sm text-muted">
              กรุณาชำระเงินใหม่และอัปโหลดสลิปที่ถูกต้อง
            </p>
            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => {
                  setSlipPreview(null);
                  setRejectReason("");
                  setStep("qr");
                }}
                className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white hover:bg-accent/90 transition-colors"
              >
                ลองใหม่อีกครั้ง
              </button>
              <Link
                href="/dashboard"
                className="rounded-xl border border-border px-4 py-3 text-sm text-muted hover:bg-background transition-colors"
              >
                กลับ Dashboard
              </Link>
            </div>
          </div>
        )}

        {/* ── STEP: Pending Review ──────────────────── */}
        {step === "pending_review" && (
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-8 text-center shadow-sm">
            <Clock size={48} className="mx-auto mb-3 text-orange-500" />
            <h2 className="text-xl font-bold text-foreground">รอ Admin ตรวจสอบ</h2>
            <p className="mt-2 text-sm text-muted">
              ส่งสลิปเรียบร้อยแล้ว ระบบอัตโนมัติไม่สามารถตรวจสอบได้
              <br />
              Admin จะตรวจสอบและเติมเครดิตให้ภายใน 24 ชม.
            </p>
            <p className="mt-3 text-lg font-semibold text-orange-600">
              {selected?.toLocaleString()} บาท
            </p>
            {debugMsg && (
              <p className="mt-2 rounded bg-orange-100 px-3 py-2 text-xs text-orange-700 font-mono break-all">
                Debug: {debugMsg}
              </p>
            )}
            <div className="mt-6 flex flex-col gap-2">
              <Link
                href="/dashboard"
                className="rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white hover:bg-accent/90 transition-colors"
              >
                กลับ Dashboard
              </Link>
              <button
                onClick={resetFlow}
                className="rounded-xl border border-border px-4 py-3 text-sm text-muted hover:bg-background transition-colors"
              >
                เติมเครดิตรายการใหม่
              </button>
            </div>
          </div>
        )}

        {/* Info */}
        {step === "select" && (
          <p className="mt-4 text-center text-xs text-muted">
            ชำระผ่าน PromptPay QR Code · เครดิตจะเข้าหลังตรวจสอบสลิป
          </p>
        )}
      </main>
    </div>
  );
}
