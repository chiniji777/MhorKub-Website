"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function AdminBridgePage() {
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    // Check if already has admin session
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((session) => {
        if (session?.user) {
          // Already authenticated as admin → go straight
          router.replace("/admin");
          return;
        }

        // No admin session → try bridge login with customer token
        const token = localStorage.getItem("accessToken");
        if (!token) {
          router.replace("/admin/login");
          return;
        }

        signIn("credentials", {
          customerToken: token,
          redirect: false,
        }).then((result) => {
          if (result?.error) {
            setError(true);
            setTimeout(() => router.replace("/admin/login"), 2000);
          } else {
            router.replace("/admin");
          }
        });
      });
  }, [router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium">ไม่มีสิทธิ์เข้า Admin Panel</p>
          <p className="mt-1 text-sm text-muted-foreground">กำลังไปหน้า Login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">กำลังเข้าสู่ระบบ Admin...</p>
      </div>
    </div>
  );
}
