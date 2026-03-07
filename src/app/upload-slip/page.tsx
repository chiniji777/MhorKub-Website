"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type Status = "idle" | "uploading" | "paid" | "pending_review" | "rejected" | "error" | "expired";

function UploadSlipContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [slipBase64, setSlipBase64] = useState<string | null>(null);
  const [tokenInfo, setTokenInfo] = useState<{ type: string; amount: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Decode token info for display (amount etc.)
  useEffect(() => {
    if (!token) return;
    try {
      // JWT payload is the second part, base64url encoded
      const payloadStr = token.split(".")[1];
      const payload = JSON.parse(atob(payloadStr.replace(/-/g, "+").replace(/_/g, "/")));
      setTokenInfo({
        type: payload.type,
        amount: payload.amt,
      });
      // Check expiry
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        setStatus("expired");
        setMessage("ลิงก์หมดอายุแล้ว กรุณาสร้าง QR ใหม่จากแอป MhorKub");
      }
    } catch {
      // Can't decode — token might be invalid, let API handle it
    }
  }, [token]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
      setMessage("กรุณาเลือกไฟล์ JPG หรือ PNG เท่านั้น");
      setStatus("error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage("ไฟล์ต้องมีขนาดไม่เกิน 5MB");
      setStatus("error");
      return;
    }

    setStatus("idle");
    setMessage("");

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreview(result);
      setSlipBase64(result.split(",")[1]);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!token || !slipBase64) return;

    setStatus("uploading");
    setMessage("กำลังอัปโหลด...");

    try {
      const res = await fetch("/api/v1/upload-slip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, slipImage: slipBase64 }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setStatus("expired");
          setMessage(data.error || "ลิงก์หมดอายุแล้ว");
        } else {
          setStatus("error");
          setMessage(data.error || "เกิดข้อผิดพลาด");
        }
        return;
      }

      if (data.status === "paid") {
        setStatus("paid");
        setMessage(data.message || "สำเร็จ!");
      } else if (data.status === "pending_review") {
        setStatus("pending_review");
        setMessage(data.message || "รอ Admin ตรวจสอบ");
      } else if (data.status === "rejected") {
        setStatus("rejected");
        setMessage(data.message || "สลิปไม่ผ่านการตรวจสอบ");
      } else {
        setStatus("pending_review");
        setMessage("ส่งสลิปแล้ว");
      }
    } catch {
      setStatus("error");
      setMessage("เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่");
    }
  };

  // No token provided
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">ลิงก์ไม่ถูกต้อง</h1>
          <p className="text-gray-500 text-sm">
            กรุณาสแกน QR Code จากแอป MhorKub เพื่อเปิดหน้านี้
          </p>
        </div>
      </div>
    );
  }

  // Token expired
  if (status === "expired") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">⏰</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">ลิงก์หมดอายุ</h1>
          <p className="text-gray-500 text-sm">{message}</p>
        </div>
      </div>
    );
  }

  // Success states
  if (status === "paid") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-xl font-bold text-green-600 mb-2">สำเร็จ!</h1>
          <p className="text-gray-600 text-sm">{message}</p>
          <p className="text-gray-400 text-xs mt-4">
            คุณสามารถปิดหน้านี้ได้ — ระบบจะอัปเดตสถานะให้อัตโนมัติ
          </p>
        </div>
      </div>
    );
  }

  if (status === "pending_review") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm w-full text-center">
          <div className="text-5xl mb-4">🕐</div>
          <h1 className="text-xl font-bold text-orange-500 mb-2">รอตรวจสอบ</h1>
          <p className="text-gray-600 text-sm">{message}</p>
          <p className="text-gray-400 text-xs mt-4">
            ปิดหน้านี้ได้เลย — ระบบจะเติมเงินให้อัตโนมัติเมื่อ Admin ยืนยัน
          </p>
        </div>
      </div>
    );
  }

  // Main upload UI
  const amountDisplay = tokenInfo ? `฿${(tokenInfo.amount / 100).toLocaleString()}` : "";
  const typeDisplay = tokenInfo?.type === "topup" ? "เติม AI Credit" : "ชำระค่าแพ็กเกจ";

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm w-full">
        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-cyan-100 rounded-full mb-3">
            <svg className="w-7 h-7 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-gray-800">อัปโหลดสลิปโอนเงิน</h1>
          {tokenInfo && (
            <p className="text-sm text-gray-500 mt-1">
              {typeDisplay} {amountDisplay}
            </p>
          )}
        </div>

        {/* File input */}
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />

        {preview ? (
          <div className="text-center mb-4">
            <img
              src={preview}
              alt="สลิป"
              className="max-h-64 mx-auto rounded-lg border shadow-sm"
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="text-cyan-600 text-sm mt-2 underline"
            >
              เปลี่ยนรูป
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-cyan-400 hover:bg-cyan-50 transition-colors mb-4"
          >
            <div className="text-4xl mb-2">📸</div>
            <p className="text-gray-600 font-medium">ถ่ายรูปหรือเลือกสลิป</p>
            <p className="text-gray-400 text-xs mt-1">JPG/PNG ไม่เกิน 5MB</p>
          </button>
        )}

        {/* Error message */}
        {(status === "error" || status === "rejected") && message && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-center">
            <p className="text-red-600 text-sm">{message}</p>
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={!slipBase64 || status === "uploading"}
          className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-colors text-base"
        >
          {status === "uploading" ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              กำลังอัปโหลด...
            </span>
          ) : (
            "ส่งสลิป"
          )}
        </button>

        {/* Footer */}
        <p className="text-center text-gray-400 text-xs mt-4">
          MhorKub — ระบบจัดการคลินิก
        </p>
      </div>
    </div>
  );
}

export default function UploadSlipPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <UploadSlipContent />
    </Suspense>
  );
}
