"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  ShoppingCart,
  Cpu,
  X,
} from "lucide-react";

interface PendingItem {
  id: number;
  type: "order" | "topup";
  customerName: string | null;
  customerEmail: string | null;
  amountThb: number;
  planName?: string | null;
  status: string;
  hasSlip: boolean;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  pending_review: "bg-orange-100 text-orange-800",
  paid: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

export default function PendingPaymentsPage() {
  const [items, setItems] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [slipModal, setSlipModal] = useState<{
    open: boolean;
    image: string | null;
    item: PendingItem | null;
    loading: boolean;
  }>({ open: false, image: null, item: null, loading: false });

  useEffect(() => {
    fetchItems();
  }, [filter]);

  async function fetchItems() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter) params.set("type", filter);
    const res = await fetch(`/api/admin/pending-payments?${params}`);
    const data = await res.json();
    setItems(data.items || []);
    setLoading(false);
  }

  async function viewSlip(item: PendingItem) {
    setSlipModal({ open: true, image: null, item, loading: true });
    const res = await fetch(
      `/api/admin/pending-payments/${item.id}?type=${item.type}`
    );
    const data = await res.json();
    setSlipModal((prev) => ({
      ...prev,
      image: data.slipImage || null,
      loading: false,
    }));
  }

  async function handleAction(
    item: PendingItem,
    action: "approve" | "reject"
  ) {
    const key = `${item.type}-${item.id}-${action}`;
    setActionLoading(key);

    const res = await fetch(`/api/admin/pending-payments/${item.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: item.type, action }),
    });

    if (res.ok) {
      // Remove from list
      setItems((prev) =>
        prev.filter((i) => !(i.id === item.id && i.type === item.type))
      );
      setSlipModal({ open: false, image: null, item: null, loading: false });
    } else {
      const data = await res.json();
      alert(data.error || "Action failed");
    }

    setActionLoading(null);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pending Payments</h1>
          <p className="text-sm text-muted-foreground">
            รายการที่รอตรวจสอบสลิป — Approve เพื่อเปิดสิทธิ์หรือเติมเครดิต
          </p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border bg-background px-3 py-2 text-sm"
        >
          <option value="">All Types</option>
          <option value="order">Orders (License)</option>
          <option value="topup">Top-up (AI Credit)</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">Customer</th>
              <th className="px-4 py-3 text-right font-medium">Amount</th>
              <th className="px-4 py-3 text-center font-medium">Status</th>
              <th className="px-4 py-3 text-center font-medium">Slip</th>
              <th className="px-4 py-3 text-left font-medium">Date</th>
              <th className="px-4 py-3 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                  ไม่มีรายการรอตรวจสอบ 🎉
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const approveKey = `${item.type}-${item.id}-approve`;
                const rejectKey = `${item.type}-${item.id}-reject`;
                return (
                  <tr key={`${item.type}-${item.id}`} className="border-t">
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-medium">
                        {item.type === "order" ? (
                          <>
                            <ShoppingCart size={14} className="text-primary" />
                            License
                          </>
                        ) : (
                          <>
                            <Cpu size={14} className="text-accent" />
                            AI Credit
                          </>
                        )}
                      </span>
                      {item.planName && (
                        <div className="text-xs text-muted-foreground">
                          {item.planName}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{item.customerName}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.customerEmail}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {(item.amountThb / 100).toLocaleString()} THB
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          statusColors[item.status] || ""
                        }`}
                      >
                        {item.status === "pending_review"
                          ? "รอตรวจ"
                          : item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.hasSlip ? (
                        <button
                          onClick={() => viewSlip(item)}
                          className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-primary hover:bg-primary/10"
                        >
                          <Eye size={14} />
                          ดูสลิป
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          ไม่มี
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString("th-TH")}{" "}
                      {new Date(item.createdAt).toLocaleTimeString("th-TH", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleAction(item, "approve")}
                          disabled={actionLoading === approveKey}
                          className="inline-flex items-center gap-1 rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50"
                        >
                          {actionLoading === approveKey ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <CheckCircle size={12} />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => handleAction(item, "reject")}
                          disabled={actionLoading === rejectKey}
                          className="inline-flex items-center gap-1 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
                        >
                          {actionLoading === rejectKey ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <XCircle size={12} />
                          )}
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Slip Modal */}
      {slipModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-6 shadow-xl">
            <button
              onClick={() =>
                setSlipModal({
                  open: false,
                  image: null,
                  item: null,
                  loading: false,
                })
              }
              className="absolute right-3 top-3 rounded-full p-1 hover:bg-gray-100"
            >
              <X size={20} />
            </button>

            <h2 className="mb-1 text-lg font-bold">ตรวจสอบสลิป</h2>
            {slipModal.item && (
              <div className="mb-3 text-sm text-muted-foreground">
                {slipModal.item.customerName} —{" "}
                {(slipModal.item.amountThb / 100).toLocaleString()} THB
                {slipModal.item.type === "order"
                  ? " (License)"
                  : " (AI Credit)"}
              </div>
            )}

            {slipModal.loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : slipModal.image ? (
              <div className="mb-4 overflow-hidden rounded-lg border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slipModal.image}
                  alt="สลิป"
                  className="w-full"
                />
              </div>
            ) : (
              <div className="mb-4 rounded-lg bg-gray-50 py-12 text-center text-sm text-muted-foreground">
                ไม่พบภาพสลิป
              </div>
            )}

            {slipModal.item && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleAction(slipModal.item!, "approve")}
                  disabled={!!actionLoading}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-green-500 px-4 py-3 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle size={16} />
                  )}
                  Approve
                </button>
                <button
                  onClick={() => handleAction(slipModal.item!, "reject")}
                  disabled={!!actionLoading}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
                >
                  {actionLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <XCircle size={16} />
                  )}
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
