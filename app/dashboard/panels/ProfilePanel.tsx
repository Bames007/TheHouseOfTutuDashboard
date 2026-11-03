// app/dashboard/panels/ProfilePanel.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  CreditCard,
  Edit3,
  Save,
  X,
  AlertCircle,
  Shield,
  Receipt,
  Clock,
  Key,
  LogOut,
  Loader2,
  Copy,
  Check,
  Users,
} from "lucide-react";
import { useDashboard } from "@/app/dashboard/DashboardContext";
import {
  UserRole,
  Student,
  Admin,
  Instructor,
  Payment,
} from "@/app/type/database";

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function formatNaira(n?: number) {
  if (!n) return "₦0";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(n);
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function initials(name?: string) {
  if (!name) return "HT";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  awaiting_payment: "bg-amber-100 text-amber-800",
  pending_verification: "bg-blue-100 text-blue-800",
  suspended: "bg-red-100 text-red-800",
  graduated: "bg-purple-100 text-purple-800",
  paid: "bg-emerald-100 text-emerald-800",
  partial: "bg-amber-100 text-amber-800",
  unpaid: "bg-red-100 text-red-800",
  overdue: "bg-red-100 text-red-800",
  refunded: "bg-slate-100 text-slate-700",
  successful: "bg-emerald-100 text-emerald-800",
  pending: "bg-amber-100 text-amber-800",
  failed: "bg-red-100 text-red-800",
};

// ─────────────────────────────────────────────────────────────
// Small components
// ─────────────────────────────────────────────────────────────
function CopyIconButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          /* ignore */
        }
      }}
      className="p-1.5 rounded-md hover:bg-[#691C33]/10 transition-colors shrink-0"
      aria-label="Copy"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-600" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-slate-400" />
      )}
    </button>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  copyable,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  copyable?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-slate-100 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-[#691C33]/5 flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-[#691C33]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">
          {label}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <div className="text-sm text-slate-900 font-medium break-words">
            {value || "—"}
          </div>
          {copyable && <CopyIconButton value={copyable} />}
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-rose-100 p-5 md:p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-[#691C33]/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-[#691C33]" />
        </div>
        <h2 className="text-base md:text-lg font-bold text-slate-900">
          {title}
        </h2>
      </div>
      {children}
    </motion.div>
  );
}

function EditField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 text-sm text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#691C33]/20 focus:border-[#691C33] outline-none transition-all placeholder:text-slate-400"
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main panel
// ─────────────────────────────────────────────────────────────
export default function ProfilePanel() {
  const { user, navigateToPanel, logout } = useDashboard();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [form, setForm] = useState({
    phoneNumber: "",
    city: "",
    country: "Nigeria",
    address: "",
    emergencyContact: "",
  });

  const studentRecord = useMemo(
    () => (user?.role === UserRole.STUDENT ? (user as Student) : null),
    [user],
  );
  const adminRecord = useMemo(
    () => (user?.role === UserRole.ADMIN ? (user as Admin) : null),
    [user],
  );
  const instructorRecord = useMemo(
    () => (user?.role === UserRole.INSTRUCTOR ? (user as Instructor) : null),
    [user],
  );

  const studentId = studentRecord?.studentId ?? studentRecord?.id ?? null;

  // Populate edit form from current student record
  useEffect(() => {
    if (!studentRecord) return;
    setForm({
      phoneNumber: studentRecord.phoneNumber || "",
      city: studentRecord.city || "",
      country: studentRecord.country || "Nigeria",
      address: studentRecord.address || "",
      emergencyContact: studentRecord.emergencyContact || "",
    });
  }, [studentRecord]);

  // Fetch payment history (students only)
  useEffect(() => {
    if (!studentId) return;
    let cancelled = false;
    setPaymentsLoading(true);
    fetch(`/api/students/${studentId}/payments`, {
      credentials: "same-origin",
    })
      .then((r) => r.json())
      .then((body) => {
        if (!cancelled && body.success) setPayments(body.data || []);
      })
      .catch(() => {
        /* silent */
      })
      .finally(() => {
        if (!cancelled) setPaymentsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  if (!user) return null;

  const displayName = user.fullName || "User";
  const displayEmail = user.email || "—";
  const roleLabel =
    user.role === UserRole.ADMIN
      ? "Administrator"
      : user.role === UserRole.INSTRUCTOR
        ? "Instructor"
        : "Student";
  const avatar = (user as any).profileImage || (user as any).avatar;

  const programTitle = studentRecord?.program || "—";
  const formatLabel =
    studentRecord?.deliveryFormat === "intensive-1day"
      ? "1-Day Intensive"
      : studentRecord?.deliveryFormat === "offline-3months"
        ? "3 Months Masterclass"
        : studentRecord?.deliveryFormat === "offline-6weeks"
          ? "6 Weeks Masterclass"
          : "—";

  const totalPaid = payments
    .filter((p) => p.status === "successful")
    .reduce((s, p) => s + (p.amount || 0), 0);

  const courseFee = (studentRecord as any)?.courseFee ?? 0;
  const amountDue = Math.max(0, courseFee - totalPaid);

  const handleChange = (name: string, value: string) =>
    setForm((prev) => ({ ...prev, [name]: value }));

  const handleSave = async () => {
    if (!studentId) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(form),
      });
      const body = await res.json();
      if (!body.success) throw new Error(body.error || "Failed to save");

      // Sync localStorage so the session keeps the new values
      try {
        const raw = localStorage.getItem("user");
        if (raw) {
          const stored = JSON.parse(raw);
          localStorage.setItem("user", JSON.stringify({ ...stored, ...form }));
        }
      } catch {
        /* silent */
      }

      window.location.reload();
    } catch (err: any) {
      setSaveError(err?.message || "Failed to save changes");
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 pb-4">
      {/* ══════════ HERO ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#691C33] to-[#4F1526] p-5 md:p-6 text-white"
      >
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white" />
          <div className="absolute -bottom-12 left-1/3 w-32 h-32 rounded-full bg-white" />
        </div>

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 overflow-hidden flex items-center justify-center shrink-0">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl md:text-2xl font-bold text-white">
                {initials(displayName)}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-bold leading-tight truncate">
                {displayName}
              </h1>
              <span className="text-[10px] uppercase tracking-wider bg-white/20 border border-white/25 rounded-full px-2 py-0.5 font-bold">
                {roleLabel}
              </span>
            </div>
            <p className="text-white/85 text-sm mt-1 truncate">
              {displayEmail}
            </p>

            {studentRecord && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-white/85">
                <div className="flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-white/70" />
                  <span className="truncate">{programTitle}</span>
                </div>
                <div className="h-3 w-px bg-white/25" />
                <span className="font-mono">{studentId}</span>
              </div>
            )}
          </div>

          {studentRecord && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="shrink-0 bg-white text-[#691C33] hover:bg-white/90 active:scale-[0.98] px-4 py-2.5 rounded-xl font-semibold text-sm inline-flex items-center gap-2 transition-all"
            >
              <Edit3 className="w-4 h-4" />
              Edit Profile
            </button>
          )}
        </div>
      </motion.div>

      {/* ══════════ PERSONAL + PROGRAM ══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Section title="Personal Information" icon={UserIcon}>
          {!editing ? (
            <div>
              <InfoRow icon={UserIcon} label="Full Name" value={displayName} />
              <InfoRow
                icon={Mail}
                label="Email"
                value={displayEmail}
                copyable={displayEmail !== "—" ? displayEmail : undefined}
              />
              {studentRecord && (
                <>
                  <InfoRow
                    icon={Phone}
                    label="Phone"
                    value={studentRecord.phoneNumber}
                    copyable={studentRecord.phoneNumber}
                  />
                  <InfoRow
                    icon={Calendar}
                    label="Date of Birth"
                    value={formatDate(studentRecord.dateOfBirth)}
                  />
                  <InfoRow
                    icon={MapPin}
                    label="Location"
                    value={[studentRecord.city, studentRecord.country]
                      .filter(Boolean)
                      .join(", ")}
                  />
                  {studentRecord.address && (
                    <InfoRow
                      icon={MapPin}
                      label="Address"
                      value={studentRecord.address}
                    />
                  )}
                  {studentRecord.emergencyContact && (
                    <InfoRow
                      icon={Phone}
                      label="Emergency Contact"
                      value={studentRecord.emergencyContact}
                    />
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <EditField
                  label="Phone Number"
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  placeholder="+234 …"
                  type="tel"
                />
                <EditField
                  label="Emergency Contact"
                  name="emergencyContact"
                  value={form.emergencyContact}
                  onChange={handleChange}
                  placeholder="Name · phone"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <EditField
                  label="City"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="City"
                />
                <EditField
                  label="Country"
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  placeholder="Country"
                />
              </div>
              <EditField
                label="Address"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Street, area"
              />

              {saveError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-2.5 text-sm text-red-800">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {saveError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-[#691C33] hover:bg-[#8A2B4A] text-white py-2.5 rounded-xl font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setSaveError(null);
                  }}
                  disabled={saving}
                  className="px-4 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl font-medium text-sm inline-flex items-center gap-2 transition-colors disabled:opacity-60"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Section>

        {studentRecord ? (
          <Section title="Program Details" icon={GraduationCap}>
            <InfoRow
              icon={GraduationCap}
              label="Program"
              value={programTitle}
            />
            <InfoRow icon={Clock} label="Format" value={formatLabel} />
            {studentRecord.batch && (
              <InfoRow icon={Users} label="Batch" value={studentRecord.batch} />
            )}
            {studentRecord.oneDayDay && studentRecord.oneDaySlot && (
              <InfoRow
                icon={Calendar}
                label="1-Day Schedule"
                value={`${studentRecord.oneDayDay} · ${studentRecord.oneDaySlotLabel || studentRecord.oneDaySlot}`}
              />
            )}
            <InfoRow
              icon={Calendar}
              label="Enrolled"
              value={formatDate(
                studentRecord.createdAt || studentRecord.enrollmentDate,
              )}
            />
            <InfoRow
              icon={Receipt}
              label="Receipt Number"
              value={
                <span className="font-mono">
                  {studentRecord.enrollmentReceipt || "—"}
                </span>
              }
              copyable={studentRecord.enrollmentReceipt}
            />
            <InfoRow
              icon={Shield}
              label="Status"
              value={
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                    STATUS_STYLES[studentRecord.status] ||
                    "bg-slate-100 text-slate-700"
                  }`}
                >
                  {(studentRecord.status || "—").replace(/_/g, " ")}
                </span>
              }
            />
          </Section>
        ) : (
          <Section title="Account" icon={Shield}>
            <InfoRow
              icon={Shield}
              label={
                user.role === UserRole.ADMIN ? "Admin ID" : "Instructor ID"
              }
              value={user.id}
              copyable={user.id}
            />
            {adminRecord?.permissions && adminRecord.permissions.length > 0 && (
              <InfoRow
                icon={Shield}
                label="Permissions"
                value={adminRecord.permissions.join(", ")}
              />
            )}
            {instructorRecord?.specialties &&
              instructorRecord.specialties.length > 0 && (
                <InfoRow
                  icon={GraduationCap}
                  label="Specialties"
                  value={instructorRecord.specialties.join(", ")}
                />
              )}
            {adminRecord?.lastActivity && (
              <InfoRow
                icon={Clock}
                label="Last Activity"
                value={formatDate(adminRecord.lastActivity)}
              />
            )}
          </Section>
        )}
      </div>

      {/* ══════════ PAYMENT (students only) ══════════ */}
      {studentRecord && (
        <Section title="Payment Summary" icon={CreditCard}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="p-3.5 rounded-xl bg-[#691C33]/5 border border-[#691C33]/10">
              <p className="text-[11px] uppercase tracking-wider text-[#691C33]/70 font-semibold">
                Course Fee
              </p>
              <p className="text-lg font-bold text-[#691C33] mt-1">
                {formatNaira(courseFee)}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100">
              <p className="text-[11px] uppercase tracking-wider text-emerald-700 font-semibold">
                Total Paid
              </p>
              <p className="text-lg font-bold text-emerald-800 mt-1">
                {formatNaira(totalPaid)}
              </p>
            </div>
            <div
              className={`p-3.5 rounded-xl border ${
                amountDue > 0
                  ? "bg-amber-50 border-amber-200"
                  : "bg-emerald-50 border-emerald-200"
              }`}
            >
              <p
                className={`text-[11px] uppercase tracking-wider font-semibold ${
                  amountDue > 0 ? "text-amber-800" : "text-emerald-800"
                }`}
              >
                {amountDue > 0 ? "Amount Due" : "Fully Paid"}
              </p>
              <p
                className={`text-lg font-bold mt-1 ${
                  amountDue > 0 ? "text-amber-900" : "text-emerald-900"
                }`}
              >
                {amountDue > 0 ? formatNaira(amountDue) : "₦0"}
              </p>
            </div>
          </div>

          {paymentsLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 text-[#691C33] animate-spin" />
            </div>
          ) : payments.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Recent Transactions
              </p>
              {payments.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-3 p-3 border border-slate-100 rounded-xl"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">
                      {formatNaira(p.amount)}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {(p.method || "—").replace(/-/g, " ")} · {p.reference}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                        STATUS_STYLES[p.status] || "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {p.status}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {formatDate(p.recordedAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <CreditCard className="w-6 h-6 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No payments recorded yet</p>
            </div>
          )}

          <button
            onClick={() => navigateToPanel("payments", "Payments")}
            className="mt-4 w-full bg-[#691C33] hover:bg-[#8A2B4A] text-white py-2.5 rounded-xl font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            {amountDue > 0 ? "Complete Payment" : "View All Payments"}
          </button>
        </Section>
      )}

      {/* ══════════ ACCOUNT & SECURITY ══════════ */}
      <Section title="Account & Security" icon={Key}>
        <InfoRow
          icon={Mail}
          label="Login Email"
          value={displayEmail}
          copyable={displayEmail !== "—" ? displayEmail : undefined}
        />
        <InfoRow
          icon={Key}
          label="Password"
          value={<span className="font-mono text-slate-400">••••••••</span>}
        />
        <InfoRow
          icon={Calendar}
          label="Member Since"
          value={formatDate((user as any).createdAt)}
        />

        <div className="flex flex-col sm:flex-row gap-2 pt-4 mt-2 border-t border-slate-100">
          <button
            onClick={() => navigateToPanel("settings", "Settings")}
            className="flex-1 bg-white border border-[#691C33]/20 text-[#691C33] hover:bg-[#691C33]/5 py-2.5 rounded-xl font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors"
          >
            <Key className="w-4 h-4" />
            Change Password
          </button>
          <button
            onClick={logout}
            className="flex-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 py-2.5 rounded-xl font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </Section>
    </div>
  );
}
