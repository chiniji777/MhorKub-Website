"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Edit3,
  Save,
  X,
  Loader2,
  Mail,
  Phone,
} from "lucide-react";

interface Profile {
  id: number;
  email: string;
  name: string;
  phone?: string;
  referralCode: string;
  creditBalance: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  function authHeaders() {
    return { Authorization: `Bearer ${localStorage.getItem("accessToken")}` };
  }

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }

    fetch("/api/v1/me", { headers: authHeaders() })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        setProfile(data);
        setEditName(data.name);
        setEditPhone(data.phone || "");
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/v1/me", {
        method: "PUT",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, phone: editPhone }),
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile((p) =>
          p ? { ...p, name: updated.name, phone: updated.phone } : p
        );
        setEditing(false);
        setSuccessMsg("บันทึกข้อมูลเรียบร้อยแล้ว");
        setTimeout(() => setSuccessMsg(""), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">ข้อมูลส่วนตัว</h1>
        <p className="text-sm text-muted">จัดการข้อมูลบัญชีของคุณ</p>
      </div>

      {successMsg && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <Save size={16} />
          {successMsg}
        </div>
      )}

      <div className="rounded-2xl border border-border/50 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">ข้อมูลบัญชี</h2>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:bg-background transition-colors"
            >
              <Edit3 size={12} />
              แก้ไข
            </button>
          )}
        </div>

        <div className="space-y-5">
          {/* Email — read only */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted mb-1.5">
              <Mail size={12} />
              อีเมล
            </label>
            <div className="rounded-lg bg-background px-4 py-3 text-sm text-foreground">
              {profile.email}
            </div>
            <p className="mt-1 text-[11px] text-muted">ไม่สามารถเปลี่ยนอีเมลได้</p>
          </div>

          {/* Name */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted mb-1.5">
              <User size={12} />
              ชื่อ
            </label>
            {editing ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full rounded-lg border border-border px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            ) : (
              <div className="rounded-lg bg-background px-4 py-3 text-sm text-foreground">
                {profile.name}
              </div>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted mb-1.5">
              <Phone size={12} />
              เบอร์โทร
            </label>
            {editing ? (
              <input
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                placeholder="0xx-xxx-xxxx"
                className="w-full rounded-lg border border-border px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            ) : (
              <div className="rounded-lg bg-background px-4 py-3 text-sm text-foreground">
                {profile.phone || "—"}
              </div>
            )}
          </div>

          {/* Action buttons */}
          {editing && (
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                บันทึก
              </button>
              <button
                onClick={() => {
                  setEditing(false);
                  setEditName(profile.name);
                  setEditPhone(profile.phone || "");
                }}
                className="flex items-center gap-1.5 rounded-lg border border-border px-5 py-2.5 text-sm text-muted hover:bg-background transition-colors"
              >
                <X size={14} />
                ยกเลิก
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
