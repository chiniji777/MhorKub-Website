"use client";

import { useEffect, useState, useCallback } from "react";

interface Customer {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  referralCode: string;
  creditBalance: number;
  emailVerified: boolean;
  googleId: string | null;
  createdAt: string;
}

interface CustomerDetail extends Customer {
  orderCount: number;
  licenseCount: number;
  deviceCount: number;
}

type ModalState =
  | { type: "none" }
  | { type: "detail"; customer: CustomerDetail }
  | { type: "edit"; customer: Customer }
  | { type: "delete"; customer: Customer };

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>({ type: "none" });
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editVerified, setEditVerified] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/customers?page=${page}&search=${encodeURIComponent(search)}`);
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json();
    setCustomers(data.customers);
    setTotalPages(data.totalPages);
    setTotal(data.total);
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function openDetail(id: number) {
    setActionLoading(true);
    const res = await fetch(`/api/admin/customers/${id}`);
    if (!res.ok) { showToast("โหลดข้อมูลไม่สำเร็จ", "error"); setActionLoading(false); return; }
    const data = await res.json();
    setModal({
      type: "detail",
      customer: { ...data.customer, orderCount: data.orderCount, licenseCount: data.licenseCount, deviceCount: data.deviceCount },
    });
    setActionLoading(false);
  }

  function openEdit(c: Customer) {
    setEditName(c.name);
    setEditEmail(c.email);
    setEditPhone(c.phone || "");
    setEditVerified(c.emailVerified);
    setModal({ type: "edit", customer: c });
  }

  async function handleSaveEdit() {
    if (modal.type !== "edit") return;
    setActionLoading(true);
    const res = await fetch("/api/admin/customers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: modal.customer.id,
        name: editName,
        email: editEmail,
        phone: editPhone,
        emailVerified: editVerified,
      }),
    });
    setActionLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      showToast(data.error || "บันทึกไม่สำเร็จ", "error");
      return;
    }
    showToast("บันทึกสำเร็จ", "success");
    setModal({ type: "none" });
    fetchCustomers();
  }

  async function handleDelete() {
    if (modal.type !== "delete") return;
    setActionLoading(true);
    const res = await fetch("/api/admin/customers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: modal.customer.id }),
    });
    setActionLoading(false);
    if (!res.ok) {
      showToast("ลบไม่สำเร็จ", "error");
      return;
    }
    showToast("ลบลูกค้าสำเร็จ", "success");
    setModal({ type: "none" });
    fetchCustomers();
  }

  async function handleResendVerification(customerId: number) {
    setActionLoading(true);
    const res = await fetch("/api/admin/customers/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId }),
    });
    setActionLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(data.error || "ส่งอีเมลไม่สำเร็จ", "error");
      return;
    }
    showToast("ส่งอีเมลยืนยันแล้ว", "success");
  }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
          toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ลูกค้า</h1>
          <p className="text-muted-foreground">{total} คน</p>
        </div>
        <input
          type="text"
          placeholder="ค้นหาชื่อหรืออีเมล..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="rounded-lg border bg-background px-4 py-2 text-sm w-72"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">ID</th>
              <th className="px-4 py-3 text-left font-medium">ชื่อ</th>
              <th className="px-4 py-3 text-left font-medium">อีเมล</th>
              <th className="px-4 py-3 text-left font-medium">โทรศัพท์</th>
              <th className="px-4 py-3 text-center font-medium">สถานะอีเมล</th>
              <th className="px-4 py-3 text-right font-medium">เครดิต (บาท)</th>
              <th className="px-4 py-3 text-left font-medium">วันที่สมัคร</th>
              <th className="px-4 py-3 text-center font-medium">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">กำลังโหลด...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">ไม่พบลูกค้า</td></tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} className="border-t hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">{c.id}</td>
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3">{c.email}</td>
                  <td className="px-4 py-3">{c.phone || "-"}</td>
                  <td className="px-4 py-3 text-center">
                    {c.emailVerified ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        ยืนยันแล้ว
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                        รอยืนยัน
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">{(c.creditBalance / 100).toFixed(2)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(c.createdAt).toLocaleDateString("th-TH")}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => openDetail(c.id)}
                        className="rounded p-1.5 hover:bg-muted transition-colors"
                        title="ดูรายละเอียด"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                      </button>
                      <button
                        onClick={() => openEdit(c)}
                        className="rounded p-1.5 hover:bg-muted transition-colors"
                        title="แก้ไข"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                      </button>
                      <button
                        onClick={() => setModal({ type: "delete", customer: c })}
                        className="rounded p-1.5 hover:bg-red-100 text-red-600 transition-colors"
                        title="ลบ"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                      </button>
                      {!c.emailVerified && (
                        <button
                          onClick={() => handleResendVerification(c.id)}
                          className="rounded p-1.5 hover:bg-blue-100 text-blue-600 transition-colors"
                          title="ส่งอีเมลยืนยัน"
                          disabled={actionLoading}
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" /></svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded border px-3 py-1 text-sm disabled:opacity-50">ก่อนหน้า</button>
          <span className="text-sm text-muted-foreground">หน้า {page} จาก {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded border px-3 py-1 text-sm disabled:opacity-50">ถัดไป</button>
        </div>
      )}

      {/* Modal Overlay */}
      {modal.type !== "none" && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50" onClick={() => setModal({ type: "none" })}>
          <div className="relative mx-4 w-full max-w-lg rounded-xl bg-background p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>

            {/* Detail Modal */}
            {modal.type === "detail" && (
              <>
                <h2 className="mb-4 text-lg font-bold">รายละเอียดลูกค้า</h2>
                <div className="space-y-3 text-sm">
                  <Row label="ID" value={String(modal.customer.id)} />
                  <Row label="ชื่อ" value={modal.customer.name} />
                  <Row label="อีเมล" value={modal.customer.email} />
                  <Row label="โทรศัพท์" value={modal.customer.phone || "-"} />
                  <Row label="รหัสแนะนำ" value={modal.customer.referralCode} mono />
                  <Row label="เครดิต" value={`${(modal.customer.creditBalance / 100).toFixed(2)} บาท`} />
                  <Row label="สถานะอีเมล" value={modal.customer.emailVerified ? "ยืนยันแล้ว" : "รอยืนยัน"} badge={modal.customer.emailVerified ? "green" : "red"} />
                  <Row label="Google" value={modal.customer.googleId ? "เชื่อมต่อแล้ว" : "ไม่ได้เชื่อมต่อ"} />
                  <Row label="วันที่สมัคร" value={new Date(modal.customer.createdAt).toLocaleString("th-TH")} />
                  <div className="border-t pt-3 mt-3">
                    <div className="grid grid-cols-3 gap-3">
                      <StatBox label="คำสั่งซื้อ" value={modal.customer.orderCount} />
                      <StatBox label="ไลเซนส์" value={modal.customer.licenseCount} />
                      <StatBox label="อุปกรณ์" value={modal.customer.deviceCount} />
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex justify-end">
                  <button onClick={() => setModal({ type: "none" })} className="rounded-lg border px-4 py-2 text-sm hover:bg-muted transition-colors">ปิด</button>
                </div>
              </>
            )}

            {/* Edit Modal */}
            {modal.type === "edit" && (
              <>
                <h2 className="mb-4 text-lg font-bold">แก้ไขลูกค้า #{modal.customer.id}</h2>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium">ชื่อ</label>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">อีเมล</label>
                    <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">โทรศัพท์</label>
                    <input type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2 text-sm" placeholder="ไม่ระบุ" />
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" id="editVerified" checked={editVerified} onChange={(e) => setEditVerified(e.target.checked)} className="h-4 w-4 rounded border" />
                    <label htmlFor="editVerified" className="text-sm">ยืนยันอีเมลแล้ว</label>
                  </div>
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <button onClick={() => setModal({ type: "none" })} className="rounded-lg border px-4 py-2 text-sm hover:bg-muted transition-colors">ยกเลิก</button>
                  <button onClick={handleSaveEdit} disabled={actionLoading} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                    {actionLoading ? "กำลังบันทึก..." : "บันทึก"}
                  </button>
                </div>
              </>
            )}

            {/* Delete Confirm Modal */}
            {modal.type === "delete" && (
              <>
                <h2 className="mb-2 text-lg font-bold text-red-600">ลบลูกค้า</h2>
                <p className="mb-1 text-sm">คุณแน่ใจหรือไม่ว่าต้องการลบลูกค้านี้?</p>
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm">
                  <p className="font-medium">{modal.customer.name}</p>
                  <p className="text-muted-foreground">{modal.customer.email}</p>
                  <p className="mt-2 text-red-600 text-xs">ข้อมูลที่เกี่ยวข้องทั้งหมด (คำสั่งซื้อ, ไลเซนส์, อุปกรณ์ ฯลฯ) จะถูกลบด้วย</p>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setModal({ type: "none" })} className="rounded-lg border px-4 py-2 text-sm hover:bg-muted transition-colors">ยกเลิก</button>
                  <button onClick={handleDelete} disabled={actionLoading} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
                    {actionLoading ? "กำลังลบ..." : "ยืนยันลบ"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, mono, badge }: { label: string; value: string; mono?: boolean; badge?: "green" | "red" }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      {badge ? (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
          badge === "green" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}>{value}</span>
      ) : (
        <span className={mono ? "font-mono text-xs" : ""}>{value}</span>
      )}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-muted/50 p-3 text-center">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
