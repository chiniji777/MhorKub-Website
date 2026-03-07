"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("ไม่พบ token ยืนยัน");
      return;
    }

    fetch(`/api/v1/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setStatus("error");
          setErrorMessage(data.error || "ยืนยันอีเมลไม่สำเร็จ");
          return;
        }

        // Store tokens and redirect to dashboard
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("customer", JSON.stringify(data.customer));
        setStatus("success");

        // Redirect after short delay
        setTimeout(() => router.push("/dashboard"), 2000);
      })
      .catch(() => {
        setStatus("error");
        setErrorMessage("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
      });
  }, [token, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-blue-50/30 to-white px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-border/50 bg-white p-8 shadow-lg text-center">
          {status === "loading" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
              <h1 className="text-xl font-bold text-foreground mb-2">กำลังยืนยันอีเมล...</h1>
              <p className="text-sm text-muted">กรุณารอสักครู่</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h1 className="text-xl font-bold text-foreground mb-2">ยืนยันอีเมลสำเร็จ!</h1>
              <p className="text-sm text-muted mb-4">บัญชีของคุณพร้อมใช้งานแล้ว</p>
              <p className="text-xs text-muted">กำลังไปหน้า Dashboard...</p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <h1 className="text-xl font-bold text-foreground mb-2">ยืนยันอีเมลไม่สำเร็จ</h1>
              <p className="text-sm text-red-600 mb-6">{errorMessage}</p>
              <div className="flex flex-col gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
                >
                  ไปหน้าเข้าสู่ระบบ
                </Link>
                <Link
                  href="/register"
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  สมัครสมาชิกใหม่
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
