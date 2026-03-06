"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, Eye, EyeOff, Loader2 } from "lucide-react";

export default function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const callbackUrl = searchParams.get("callbackUrl") || "/admin";
  const authError = searchParams.get("error");

  async function handleCredentialsLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-sm">
          <div className="mb-6 flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Admin Login</h1>
            <p className="text-sm text-muted">เข้าสู่ระบบจัดการ MhorKub</p>
          </div>

          {(error || authError) && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error || (authError === "OAuthAccountNotLinked"
                ? "อีเมลนี้ไม่มีสิทธิ์เข้าระบบ Admin"
                : "เกิดข้อผิดพลาดในการเข้าสู่ระบบ")}
            </div>
          )}

          <form onSubmit={handleCredentialsLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/60" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="อีเมล"
                className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                autoFocus
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/60" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="รหัสผ่าน"
                className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-10 text-sm text-foreground placeholder:text-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted/60 hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || googleLoading || !email || !password}
              className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  กำลังเข้าสู่ระบบ...
                </span>
              ) : "เข้าสู่ระบบ"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted">หรือ</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            {googleLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบด้วย Google"}
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-muted">
          เฉพาะผู้ดูแลระบบที่ได้รับอนุญาตเท่านั้น
        </p>
      </div>
    </div>
  );
}
