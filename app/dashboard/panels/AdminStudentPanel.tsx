// app/dashboard/panels/AdminStudentsPanel.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Users,
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  CreditCard,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  ChevronRight,
  Award,
  Calendar,
  Loader2,
  Banknote,
  Receipt,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { useDashboard } from "../DashboardContext";
import {
  Student,
  Payment,
  EnrollmentStatus,
  PaymentStatus,
} from "@/app/type/database";

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function fmtNaira(n?: number) {
  if (!n && n !== 0) return "₦0";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(n);
}

function fmtDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

const STATUS_META: Record<
  string,
  { label: string; bg: string; text: string; border: string }
> = {
  awaiting_payment: {
    label: "Awaiting Payment",
    bg: "bg-amber-100",
    text: "text-amber-800",
    border: "border-amber-200",
  },
  pending_verification: {
    label: "Pending Verification",
    bg: "bg-blue-100",
    text: "text-blue-800",
    border: "border-blue-200",
  },
  active: {
    label: "Active",
    bg: "bg-emerald-100",
    text: "text-emerald-800",
    border: "border-emerald-200",
  },
  graduated: {
    label: "Graduated",
    bg: "bg-purple-100",
    text: "text-purple-800",
    border: "border-purple-200",
  },
  suspended: {
    label: "Suspended",
    bg: "bg-red-100",
    text: "text-red-800",
    border: "border-red-200",
  },
};

function StatusBadge({ status }: { status?: string }) {
  const meta = STATUS_META[status || ""] || {
    label: status || "—",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${meta.bg} ${meta.text} ${meta.border}`}
    >
      {meta.label}
    </span>
  );
}

function initials(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─────────────────────────────────────────────────────────────
// STUDENT DETAIL DRAWER
// ─────────────────────────────────────────────────────────────
function StudentDetail({
  student,
  onClose,
  onPaymentUpdated,
}: {
  student: Student;
  onClose: () => void;
  onPaymentUpdated: () => void;
}) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  const studentId = student.studentId ?? student.id;

  useEffect(() => {
    let cancelled = false;
    setLoadingPayments(true);
    fetch(`/api/students/${studentId}/payments`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((body) => {
        if (!cancelled && body.success) {
          const sorted = (body.data as Payment[]).sort(
            (a, b) =>
              new Date(b.recordedAt).getTime() -
              new Date(a.recordedAt).getTime(),
          );
          setPayments(sorted);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingPayments(false);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  const markPayment = async (paymentId: string, status: string) => {
    setUpdatingId(paymentId);
    setBanner(null);
    try {
      const res = await fetch(
        `/api/students/${studentId}/payments/${paymentId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ status }),
        },
      );
      const body = await res.json();
      if (!body.success) throw new Error(body.error || "Update failed");

      setBanner(`Payment marked as ${status}.`);
      onPaymentUpdated();

      // Refresh payments
      const r = await fetch(`/api/students/${studentId}/payments`, {
        credentials: "same-origin",
      });
      const refreshed = await r.json();
      if (refreshed.success) {
        const sorted = (refreshed.data as Payment[]).sort(
          (a, b) =>
            new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
        );
        setPayments(sorted);
      }
    } catch (err: any) {
      setBanner(err?.message || "Failed to update");
    } finally {
      setUpdatingId(null);
    }
  };

  const courseFee = (student as any).courseFee ?? 0;
  const totalPaid = payments
    .filter((p) => p.status === "successful")
    .reduce((s, p) => s + (p.amount || 0), 0);
  const amountDue = Math.max(0, courseFee - totalPaid);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-slate-950/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="absolute top-0 right-0 bottom-0 w-full sm:max-w-lg bg-white overflow-y-auto [color-scheme:light]"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[#691C33] text-white px-5 py-4 flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0 font-bold">
            {initials(student.fullName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wider text-white/70 font-bold">
              Student
            </p>
            <h2 className="text-base font-bold truncate">{student.fullName}</h2>
            <p className="text-xs text-white/80 font-mono truncate">
              {student.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {banner && (
            <div className="rounded-xl p-3 bg-emerald-50 border border-emerald-200 text-sm text-emerald-900 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{banner}</span>
            </div>
          )}

          {/* Status row */}
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={student.status} />
            {student.paymentStatus && (
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                <CreditCard className="w-3 h-3" />
                {student.paymentStatus}
              </span>
            )}
          </div>

          {/* Identity */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-2.5">
            {[
              {
                icon: Mail,
                label: "Email",
                value: student.email,
                mono: false,
              },
              {
                icon: Phone,
                label: "Phone",
                value: student.phoneNumber,
                mono: false,
              },
              {
                icon: MapPin,
                label: "Location",
                value: [student.city, student.country]
                  .filter(Boolean)
                  .join(", "),
                mono: false,
              },
              {
                icon: Calendar,
                label: "Enrolled",
                value: fmtDate(student.createdAt || student.enrollmentDate),
                mono: false,
              },
              {
                icon: GraduationCap,
                label: "Program",
                value: student.program,
                mono: false,
              },
              {
                icon: Receipt,
                label: "Receipt",
                value: student.enrollmentReceipt,
                mono: true,
              },
            ].map((row) => {
              const Icon = row.icon;
              return (
                <div key={row.label} className="flex items-start gap-3">
                  <Icon className="w-4 h-4 text-[#691C33] shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                      {row.label}
                    </p>
                    <p
                      className={`text-sm text-slate-900 break-words ${
                        row.mono ? "font-mono" : ""
                      }`}
                    >
                      {row.value || "—"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Fees summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl p-3 bg-[#691C33]/5 border border-[#691C33]/15">
              <p className="text-[9px] uppercase tracking-wider font-bold text-[#691C33]/70">
                Fee
              </p>
              <p className="text-sm font-bold text-[#691C33] mt-0.5">
                {fmtNaira(courseFee)}
              </p>
            </div>
            <div className="rounded-xl p-3 bg-emerald-50 border border-emerald-200">
              <p className="text-[9px] uppercase tracking-wider font-bold text-emerald-700">
                Paid
              </p>
              <p className="text-sm font-bold text-emerald-800 mt-0.5">
                {fmtNaira(totalPaid)}
              </p>
            </div>
            <div
              className={`rounded-xl p-3 border ${
                amountDue > 0
                  ? "bg-amber-50 border-amber-200"
                  : "bg-emerald-50 border-emerald-200"
              }`}
            >
              <p
                className={`text-[9px] uppercase tracking-wider font-bold ${
                  amountDue > 0 ? "text-amber-700" : "text-emerald-700"
                }`}
              >
                {amountDue > 0 ? "Due" : "Complete"}
              </p>
              <p
                className={`text-sm font-bold mt-0.5 ${
                  amountDue > 0 ? "text-amber-900" : "text-emerald-900"
                }`}
              >
                {fmtNaira(amountDue)}
              </p>
            </div>
          </div>

          {/* Payments */}
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-2">
              Payment Records
            </p>
            {loadingPayments ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 text-[#691C33] animate-spin" />
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-6 bg-slate-50 rounded-xl">
                <CreditCard className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No payments recorded</p>
              </div>
            ) : (
              <div className="space-y-2">
                {payments.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl border border-slate-200 p-3"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900">
                          {fmtNaira(p.amount)}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono truncate mt-0.5">
                          {p.reference}
                        </p>
                        <p className="text-[11px] text-slate-600 mt-1 truncate">
                          {p.note || "School fees"}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {fmtDate(p.recordedAt)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          p.status === "successful"
                            ? "bg-emerald-100 text-emerald-800"
                            : p.status === "pending"
                              ? "bg-amber-100 text-amber-800"
                              : p.status === "failed"
                                ? "bg-red-100 text-red-800"
                                : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>

                    {/* Actions */}
                    {p.status === "pending" && (
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => markPayment(p.id, "successful")}
                          disabled={updatingId === p.id}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                        >
                          {updatingId === p.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ShieldCheck className="w-3.5 h-3.5" />
                          )}
                          Verify
                        </button>
                        <button
                          onClick={() => markPayment(p.id, "failed")}
                          disabled={updatingId === p.id}
                          className="bg-white border border-red-200 text-red-700 hover:bg-red-50 py-2 px-3 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    )}
                    {p.status === "successful" && (
                      <div className="flex items-center gap-1 text-[10px] text-emerald-700 mt-1">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                        {p.verifiedAt ? ` · ${fmtDate(p.verifiedAt)}` : ""}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Grades snapshot */}
          {student.grades && Object.keys(student.grades).length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-2">
                Grades
              </p>
              <div className="space-y-1.5">
                {Object.entries(student.grades).map(([title, score]) => (
                  <div
                    key={title}
                    className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-100 last:border-0"
                  >
                    <p className="text-xs text-slate-700 truncate">{title}</p>
                    <span className="text-xs font-bold text-[#691C33] shrink-0">
                      {score}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PANEL
// ─────────────────────────────────────────────────────────────
type FilterKey =
  | "all"
  | "awaiting_payment"
  | "pending_verification"
  | "active"
  | "graduated";

export default function AdminStudentsPanel() {
  const { user } = useDashboard();
  const isAdmin = String(user?.role || "").toLowerCase() === "admin";

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selected, setSelected] = useState<Student | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetch("/api/students", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((body) => {
        if (body.success) setStudents(body.data || []);
        else setError(body.error || "Failed to load");
      })
      .catch((e) => setError(e?.message || "Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  const filtered = useMemo(() => {
    let list = students;
    if (filter !== "all") {
      list = list.filter((s) => s.status === filter);
    }
    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (s) =>
          s.fullName?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.id?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [students, filter, search]);

  const counts = useMemo(() => {
    return {
      total: students.length,
      awaiting: students.filter((s) => s.status === "awaiting_payment").length,
      pending: students.filter((s) => s.status === "pending_verification")
        .length,
      active: students.filter((s) => s.status === "active").length,
    };
  }, [students]);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <ShieldCheck className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-600">Admin access required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Total Students",
            value: counts.total,
            icon: Users,
            tone: "bg-[#691C33]/5 border-[#691C33]/15 text-[#691C33]",
          },
          {
            label: "Awaiting Payment",
            value: counts.awaiting,
            icon: AlertCircle,
            tone: "bg-amber-50 border-amber-200 text-amber-800",
          },
          {
            label: "Pending Verify",
            value: counts.pending,
            icon: Clock,
            tone: "bg-blue-50 border-blue-200 text-blue-800",
          },
          {
            label: "Active",
            value: counts.active,
            icon: CheckCircle,
            tone: "bg-emerald-50 border-emerald-200 text-emerald-800",
          },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className={`rounded-2xl p-4 border ${s.tone}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider font-bold opacity-80 truncate">
                    {s.label}
                  </p>
                  <p className="text-xl md:text-2xl font-bold mt-1">
                    {s.value}
                  </p>
                </div>
                <Icon className="w-4 h-4 md:w-5 md:h-5 opacity-60 shrink-0" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Search + filters */}
      <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or ID…"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-[#691C33]/30 focus:ring-2 focus:ring-[#691C33]/10 outline-none transition-all text-sm text-slate-900 placeholder:text-slate-500"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {[
            { id: "all" as FilterKey, label: "All", count: counts.total },
            {
              id: "awaiting_payment" as FilterKey,
              label: "Awaiting",
              count: counts.awaiting,
            },
            {
              id: "pending_verification" as FilterKey,
              label: "Pending",
              count: counts.pending,
            },
            {
              id: "active" as FilterKey,
              label: "Active",
              count: counts.active,
            },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                filter === f.id
                  ? "bg-[#691C33] text-white"
                  : "bg-slate-50 border border-slate-200 text-slate-600 hover:border-[#691C33]/40"
              }`}
            >
              {f.label}
              <span
                className={`text-[10px] font-bold rounded-full min-w-[18px] h-4 px-1 flex items-center justify-center ${
                  filter === f.id
                    ? "bg-white text-[#691C33]"
                    : "bg-white border border-slate-200 text-slate-600"
                }`}
              >
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-900">Students</h2>
          <span className="text-xs text-slate-500 font-medium">
            {filtered.length} {filtered.length === 1 ? "result" : "results"}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-[#691C33] animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={load}
              className="mt-3 bg-[#691C33] text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-600 font-medium">No students</p>
            <p className="text-xs text-slate-500 mt-1">
              {search ? "Try a different search" : "No students yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((s) => (
              <motion.button
                key={s.id}
                onClick={() => setSelected(s)}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-[#691C33]/40 hover:bg-[#691C33]/[0.02] transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#691C33]/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-[#691C33]">
                      {initials(s.fullName)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {s.fullName}
                      </p>
                      <StatusBadge status={s.status} />
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {s.email}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      <span className="text-[10px] font-mono text-slate-500">
                        {s.id}
                      </span>
                      <span className="text-[10px] text-slate-400">·</span>
                      <span className="text-[10px] text-slate-500 truncate">
                        {s.program}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#691C33] shrink-0 mt-2 transition-colors" />
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Detail drawer */}
      <AnimatePresence>
        {selected && (
          <StudentDetail
            student={selected}
            onClose={() => setSelected(null)}
            onPaymentUpdated={load}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
