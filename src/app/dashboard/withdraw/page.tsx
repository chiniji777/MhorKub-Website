"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  History,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Ban,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────

interface ReferralStats {
  creditBalanceThb: number;
}

interface Withdrawal {
  id: number;
  amountThb: number;
  bankAccount: string;
  bankName: string;
  status: string;
  processedAt: string | null;
  createdAt: string;
}

// ─── Constants ───────────────────────────────────────────────────

const BANKS = [
  "กสิกรไทย (KBANK)",
  "กรุงเทพ (BBL)",
  "ไทยพาณิชย์ (SCB)",
  "กรุงไทย (KTB)",
  "กรุงศรี (BAY)",
  "ทหารไทยธนชาต (TTB)",
  "ออมสิน (GSB)",
  "PromptPay",
];

// ─── Component ───────────────────────────────────────────────────

export default function WithdrawPage() {
  const router = useRouter();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [wAmount, setWAmount] = useState("");
  const [wBank, setWBank] = useState("");
  const [wAccount, setWAccount] = useState("");
  const [wSubmitting, setWSubmitting] = useState(false);
  const [wSuccess, setWSuccess] = useState("");
  const [wError, setWError] = useState("");

  function authHeaders() {
    return { Authorization: `Bearer ${localStorage.getItem("accessToken")}` };
  }

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/login");
      return;
    }

    Promise.all([
      fetch("/api/v1/referral", { headers: authHeaders() }).then((r) =>
        r.json()
      ),
      fetch("/api/v1/withdrawals", { headers: authHeaders() }).then((r) =>
        r.json()
      ),
    ])
      .then(([referral, wdraw]) => {
        setStats(referral);
        setWithdrawals(wdraw.withdrawals || []);
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setWError("");
    setWSuccess("");

    const amountNum = parseFloat(wAmount);
    if (!amountNum || amountNum < 100) {
      setWError("จำนวนขั้นต่ำ 100 บาท");
      return;
    }
    if (!wBank) {
      setWError("กรุณาเลือกธนาคาร");
      return;
    }
    if (!wAccount.trim()) {
      setWError("กรุณากรอกเลขบัญชีหรือ PromptPay");
      return;
    }

    setWSubmitting(true);
    try {
      const res = await fetch("/api/v1/referral/withdraw", {
        method: "POST",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({
          amountThb: Math.round(amountNum * 100),
          bankAccount: wAccount.trim(),
          bankName: wBank,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setWError(data.error || "ไม่สามารถส่งคำขอถอนเงินได้");
        return;
      }
      setWSuccess("ส่งคำขอถอนเงินเรียบร้อยแล้ว!");
      setWAmount("");
      setWAccount("");
      setWBank("");

      // Refresh stats & withdrawals
      const [newStats, newWdraw] = await Promise.all([
        fetch("/api/v1/referral", { headers: authHeaders() }).then((r) =>
          r.json()
        ),
        fetch("/api/v1/withdrawals", { headers: authHeaders() }).then((r) =>
          r.json()
        ),
      ]);
      setStats(newStats);
      setWithdrawals(newWdraw.withdrawals || []);
    } catch {
      setWError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setWSubmitting(false);
    }
  }

  function statusBadge(status: string) {
    const map: Record<
      string,
      { color: string; icon: React.ReactNode; label: string }
    > = {
      pending: {
        color: "bg-yellow-100 text-yellow-700",
        icon: <Clock size={12} />,
        label: "รอดำเนินการ",
      },
      approved: {
        color: "bg-blue-100 text-blue-700",
        icon: <CheckCircle size={12} />,
        label: "อนุมัติแล้ว",
      },
      completed: {
        color: "bg-green-100 text-green-700",
        icon: <CheckCircle size={12} />,
        label: "โอนแล้ว",
      },
      rejected: {
        color: "bg-red-100 text-red-700",
        icon: <XCircle size={12} />,
        label: "ปฏิเสธ",
      },
      cancelled: {
        color: "bg-gray-100 text-gray-600",
        icon: <Ban size={12} />,
        label: "ยกเลิก",
      },
    };
    const s = map[status] || map.pending;
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${s.color}`}
      >
        {s.icon}
        {s.label}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">ถอนเงิน</h1>
        <p className="text-sm text-muted">ถอนรายได้จากรหัสแนะนำ</p>
      </div>

      {/* Withdrawal Form */}
      <div className="rounded-2xl border border-border/50 bg-white p-6 shadow-sm mb-4">
        <div className="mb-4 flex items-center gap-2">
          <Wallet className="h-5 w-5 text-emerald-500" />
          <h2 className="font-semibold text-foreground">ถอนเงิน</h2>
        </div>

        <div className="mb-4 rounded-xl bg-emerald-50 p-4">
          <p className="text-xs text-emerald-600/70">ยอดที่ถอนได้</p>
          <p className="text-2xl font-bold text-emerald-600">
            {stats.creditBalanceThb.toLocaleString("th-TH", {
              minimumFractionDigits: 2,
            })}{" "}
            <span className="text-sm font-normal">บาท</span>
          </p>
        </div>

        {wSuccess && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            <CheckCircle size={16} />
            {wSuccess}
          </div>
        )}

        {wError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle size={16} />
            {wError}
          </div>
        )}

        <form onSubmit={handleWithdraw} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              จำนวนเงิน (บาท)
            </label>
            <input
              type="number"
              min={100}
              step={1}
              value={wAmount}
              onChange={(e) => setWAmount(e.target.value)}
              placeholder="ขั้นต่ำ 100 บาท"
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              ธนาคาร
            </label>
            <select
              value={wBank}
              onChange={(e) => setWBank(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">— เลือกธนาคาร —</option>
              {BANKS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              {wBank === "PromptPay" ? "หมายเลข PromptPay" : "เลขบัญชี"}
            </label>
            <input
              type="text"
              value={wAccount}
              onChange={(e) => setWAccount(e.target.value)}
              placeholder={
                wBank === "PromptPay"
                  ? "เบอร์โทรหรือเลขบัตรประชาชน"
                  : "xxx-x-xxxxx-x"
              }
              className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <button
            type="submit"
            disabled={wSubmitting || stats.creditBalanceThb < 100}
            className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
          >
            {wSubmitting ? (
              <Loader2 size={16} className="mx-auto animate-spin" />
            ) : (
              "ขอถอนเงิน"
            )}
          </button>

          {stats.creditBalanceThb < 100 && (
            <p className="text-center text-xs text-muted">
              ยอดขั้นต่ำ 100 บาทถึงจะถอนได้
            </p>
          )}
        </form>
      </div>

      {/* Withdrawal History */}
      <div className="rounded-2xl border border-border/50 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <History className="h-5 w-5 text-slate-500" />
          <h2 className="font-semibold text-foreground">ประวัติการถอน</h2>
        </div>

        {withdrawals.length === 0 ? (
          <div className="py-8 text-center">
            <History className="mx-auto mb-3 h-12 w-12 text-muted/30" />
            <p className="text-sm text-muted">ยังไม่มีประวัติการถอนเงิน</p>
          </div>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((w) => (
              <div
                key={w.id}
                className="rounded-xl border border-border/30 p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      {(w.amountThb / 100).toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                      })}{" "}
                      บาท
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {w.bankName} · {w.bankAccount}
                    </p>
                  </div>
                  {statusBadge(w.status)}
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted">
                  <span>
                    ส่งคำขอ{" "}
                    {new Date(w.createdAt).toLocaleDateString("th-TH", {
                      day: "numeric",
                      month: "short",
                      year: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {w.processedAt && (
                    <span>
                      · ดำเนินการ{" "}
                      {new Date(w.processedAt).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
