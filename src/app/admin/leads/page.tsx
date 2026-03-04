"use client";

import { useEffect, useState } from "react";
import { Users, Mail, Phone, Building, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  clinicName: string | null;
  message: string;
  status: string;
  createdAt: string;
}

const STATUS_OPTIONS = ["new", "contacted", "qualified", "closed"];
const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-yellow-100 text-yellow-700",
  qualified: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-600",
};

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    try {
      const res = await fetch("/api/admin/leads");
      if (res.ok) {
        setLeads(await res.json());
      }
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: number, status: string) {
    try {
      await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? { ...l, status } : l))
      );
    } catch {
      // handle error
    }
  }

  if (loading) {
    return <div className="py-20 text-center text-muted">กำลังโหลด...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads</h1>
          <p className="mt-1 text-sm text-muted">{leads.length} รายการ</p>
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="mt-12 text-center">
          <Users className="mx-auto h-12 w-12 text-muted/40" />
          <p className="mt-3 text-muted">ยังไม่มี leads</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className={cn(
                "cursor-pointer rounded-xl border border-border bg-surface p-4 transition-colors hover:border-primary/30",
                selectedLead?.id === lead.id && "border-primary/50 ring-1 ring-primary/20"
              )}
              onClick={() => setSelectedLead(selectedLead?.id === lead.id ? null : lead)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{lead.name}</h3>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_COLORS[lead.status] || STATUS_COLORS.new)}>
                      {lead.status}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted">
                    <span className="flex items-center gap-1"><Mail size={12} /> {lead.email}</span>
                    {lead.phone && <span className="flex items-center gap-1"><Phone size={12} /> {lead.phone}</span>}
                    {lead.clinicName && <span className="flex items-center gap-1"><Building size={12} /> {lead.clinicName}</span>}
                    <span className="flex items-center gap-1"><Clock size={12} /> {new Date(lead.createdAt).toLocaleDateString("th-TH")}</span>
                  </div>
                </div>

                <select
                  value={lead.status}
                  onChange={(e) => {
                    e.stopPropagation();
                    updateStatus(lead.id, e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded-lg border border-border bg-background px-2 py-1 text-xs text-foreground focus:outline-none"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {selectedLead?.id === lead.id && (
                <div className="mt-3 rounded-lg bg-background p-3 text-sm text-foreground">
                  <p className="mb-1 text-xs font-medium text-muted">ข้อความ:</p>
                  {lead.message}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
