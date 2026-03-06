"use client";

import { useEffect, useState, useRef } from "react";
import {
  Upload,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Smartphone,
} from "lucide-react";

type Step = "loading" | "ready" | "uploading" | "done" | "pending_review" | "rejected" | "error";

interface TokenInfo {
  id: number;
  type: "order" | "topup";
  amountThb: number;
}

export default function SlipUploadPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = useState<string>("");
  const [step, setStep] = useState<Step>("loading");
  const [info, setInfo] = useState<TokenInfo | null>(null);
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [resultMsg, setResultMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Decode token info from status API
  useEffect(() => {
    params.then(({ token: t }) => {
      setToken(t);

      // Decode JWT payload (base64url) to show amount before API call
      try {
        const payloadPart = t.split(".")[1];
        const decoded = JSON.parse(atob(payloadPart.replace(/-/g, "+").replace(/_/g, "/")));
        setInfo({
          id: Number(decoded.sub),
          type: decoded.typ,
          amountThb: decoded.amt,
        });
      } catch {
        // Can't decode locally, will check via API
      }

      // Check status via API
      fetch(`/api/v1/slip/status?token=${t}`)
        .then((r) => {
          if (!r.ok) throw new Error("invalid");
          return r.json();
        })
        .then((data) => {
          if (data.uploaded) {
            // Already uploaded
            if (data.status === "paid") {
              setResultMsg(data.message || "ชำระเงินสำเร็จ");
              setStep("done");
            } else if (data.status === "pending_review") {
              setResultMsg(data.message || "รอ Admin ตรวจสอบ");
              setStep("pending_review");
            } else {
              setStep("ready");
            }
          } else {
            setStep("ready");
          }
        })
        .catch(() => {
          setErrorMsg("ลิงก์หมดอายุหรือไม่ถูกต้อง");
          setStep("error");
        });
    });
  }, [params]);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSlipPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleUpload() {
    if (!slipPreview || !token) return;
    setStep("uploading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/v1/slip/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, slipImage: slipPreview }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "เกิดข้อผิดพลาด");
        setStep("ready");
        return;
      }

      setResultMsg(data.message || "");

      if (data.status === "paid") {
        setStep("done");
      } else if (data.status === "pending_review") {
        setStep("pending_review");
      } else if (data.status === "rejected") {
        setErrorMsg(data.message || "สลิปไม่ผ่านการตรวจสอบ");
        setStep("rejected");
      }
    } catch {
      setErrorMsg("เกิดข้อผิดพลาด กรุณาลองใหม่");
      setStep("ready");
    }
  }

  function retry() {
    setSlipPreview(null);
    setErrorMsg("");
    setStep("ready");
    if (fileRef.current) fileRef.current.value = "";
  }

  const amountDisplay = info
    ? (info.amountThb / 100).toLocaleString("th-TH", { minimumFractionDigits: 2 })
    : "...";
  const typeLabel = info?.type === "topup" ? "เติมเครดิต AI" : "ซื้อแพ็กเกจ";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col items-center px-4 py-8">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Smartphone className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-lg font-bold text-foreground">MhorKub</h1>
        <p className="text-xs text-muted">อัปโหลดสลิปการโอนเงิน</p>
      </div>

      <div className="w-full max-w-sm">
        {/* Amount Info */}
        {info && step !== "error" && (
          <div className="mb-4 rounded-xl bg-white border border-border/50 p-4 text-center shadow-sm">
            <p className="text-xs text-muted">{typeLabel}</p>
            <p className="text-2xl font-bold text-foreground">
              {amountDisplay}{" "}
              <span className="text-sm font-normal text-muted">บาท</span>
            </p>
          </div>
        )}

        {/* Loading */}
        {step === "loading" && (
          <div className="flex flex-col items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-3 text-sm text-muted">กำลังตรวจสอบ...</p>
          </div>
        )}

        {/* Error — invalid/expired token */}
        {step === "error" && (
          <div className="rounded-xl bg-white border border-red-200 p-6 text-center shadow-sm">
            <AlertCircle className="mx-auto mb-3 h-12 w-12 text-red-400" />
            <p className="font-medium text-red-700">{errorMsg}</p>
            <p className="mt-2 text-xs text-muted">
              กรุณากลับไปหน้าชำระเงินแล้วสแกน QR ใหม่
            </p>
          </div>
        )}

        {/* Ready to upload */}
        {(step === "ready" || step === "uploading") && (
          <div className="rounded-xl bg-white border border-border/50 p-5 shadow-sm">
            {errorMsg && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertCircle size={16} />
                {errorMsg}
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            {!slipPreview ? (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 px-4 py-10 text-center transition-colors hover:border-primary/50 hover:bg-primary/10 active:scale-[0.98]"
              >
                <Upload className="mx-auto mb-3 h-10 w-10 text-primary/60" />
                <p className="text-sm font-medium text-primary">
                  แนบสลิปการโอนเงิน
                </p>
                <p className="mt-1 text-xs text-muted">
                  เลือกรูปสลิปจากเครื่อง (JPG, PNG)
                </p>
              </button>
            ) : (
              <div>
                {/* Preview */}
                <div className="mb-4 overflow-hidden rounded-lg border border-border/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={slipPreview}
                    alt="สลิป"
                    className="w-full object-contain max-h-80"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={retry}
                    disabled={step === "uploading"}
                    className="flex-1 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-muted hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    เลือกใหม่
                  </button>
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={step === "uploading"}
                    className="flex-1 rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {step === "uploading" ? (
                      <Loader2 size={16} className="mx-auto animate-spin" />
                    ) : (
                      <span className="flex items-center justify-center gap-1.5">
                        <Upload size={14} />
                        ส่งสลิป
                      </span>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Success */}
        {step === "done" && (
          <div className="rounded-xl bg-white border border-green-200 p-6 text-center shadow-sm">
            <CheckCircle className="mx-auto mb-3 h-14 w-14 text-green-500" />
            <p className="text-lg font-semibold text-green-700">
              {resultMsg || "สำเร็จ!"}
            </p>
            <p className="mt-2 text-xs text-muted">
              คุณสามารถปิดหน้านี้ได้เลย
            </p>
          </div>
        )}

        {/* Pending Review */}
        {step === "pending_review" && (
          <div className="rounded-xl bg-white border border-amber-200 p-6 text-center shadow-sm">
            <Clock className="mx-auto mb-3 h-14 w-14 text-amber-500" />
            <p className="text-lg font-semibold text-amber-700">
              {resultMsg || "รอ Admin ตรวจสอบ"}
            </p>
            <p className="mt-2 text-xs text-muted">
              เราได้รับสลิปแล้ว จะดำเนินการให้เร็วที่สุด
            </p>
          </div>
        )}

        {/* Rejected */}
        {step === "rejected" && (
          <div className="rounded-xl bg-white border border-red-200 p-6 text-center shadow-sm">
            <XCircle className="mx-auto mb-3 h-14 w-14 text-red-400" />
            <p className="font-semibold text-red-700">{errorMsg}</p>
            <button
              type="button"
              onClick={retry}
              className="mt-4 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors"
            >
              ลองใหม่
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="mt-8 text-[10px] text-muted/50">MhorKub &copy; 2025</p>
    </div>
  );
}
