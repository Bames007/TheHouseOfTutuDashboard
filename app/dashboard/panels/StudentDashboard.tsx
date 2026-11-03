// app/dashboard/panels/StudentDashboard.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useDashboard } from "@/app/dashboard/DashboardContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Clock,
  Award,
  Calendar,
  TrendingUp,
  FileText,
  Users,
  Download,
  ArrowRight,
  ChevronRight,
  CreditCard,
  GraduationCap,
  MapPin,
  CheckCircle,
  AlertCircle,
  Bell,
  X,
  Wallet,
  Sparkles,
  Receipt,
  ArrowUpRight,
  Info,
} from "lucide-react";
import {
  UserRole,
  Student,
  DeliveryFormat,
  PaymentStatus,
  EnrollmentStatus,
} from "@/app/type/database";

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const COURSE_FEES: Record<DeliveryFormat, number> = {
  "offline-6weeks": 600000,
  "offline-3months": 800000,
  "intensive-1day": 120000,
};

const COURSE_FEE_LABELS: Record<DeliveryFormat, string> = {
  "offline-6weeks": "6 Weeks Masterclass",
  "offline-3months": "3 Months Masterclass",
  "intensive-1day": "1 Day Intensive",
};

function fmtNaira(n?: number) {
  if (!n && n !== 0) return "₦0";
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(n);
}

function gradeLetter(avg: number | null): string {
  if (avg === null) return "—";
  if (avg >= 90) return "A";
  if (avg >= 80) return "B";
  if (avg >= 70) return "C";
  if (avg >= 60) return "D";
  return "F";
}

// ─────────────────────────────────────────────────────────────
// NOTIFICATION
// ─────────────────────────────────────────────────────────────
interface PaymentNotification {
  tone: "amber" | "red" | "blue";
  title: string;
  body: string;
  cta: string;
  icon: React.ElementType;
}

function getPaymentNotification(
  student: Student | null,
  amountDue: number,
  hasPendingPayment: boolean,
): PaymentNotification | null {
  if (!student) return null;

  const status = (student.status || "") as EnrollmentStatus;
  const paymentStatus = (student.paymentStatus || "") as PaymentStatus;

  if (paymentStatus === "paid") return null;
  if (status === "graduated" || status === "active") return null;

  // Pending verification — a payment was submitted but not yet confirmed
  if (hasPendingPayment) {
    return {
      tone: "blue",
      title: "Payment verification in progress",
      body: "We've received your payment and our team is verifying it. This usually takes less than 24 hours. You'll get full access once confirmed.",
      cta: "View Details",
      icon: Clock,
    };
  }

  // Partial payment
  if (paymentStatus === "partial") {
    return {
      tone: "amber",
      title: "Complete your course payment",
      body: `You've made a partial payment. ${fmtNaira(
        amountDue,
      )} remains to unlock all modules, materials, and instructor support.`,
      cta: "Complete Payment",
      icon: AlertCircle,
    };
  }

  // Default: awaiting payment
  return {
    tone: "amber",
    title: "Your payment is pending",
    body: `Your student account is ready. Pay ${
      amountDue > 0 ? fmtNaira(amountDue) : "your course fee"
    } to unlock classes, materials, and your instructors.`,
    cta: "Pay Now",
    icon: Bell,
  };
}

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────
function PaymentBanner({
  notification,
  onDismiss,
  onAction,
}: {
  notification: PaymentNotification;
  onDismiss: () => void;
  onAction: () => void;
}) {
  const tones = {
    amber: {
      wrap: "bg-amber-50 border-amber-300",
      icon: "bg-amber-600",
      title: "text-amber-950",
      body: "text-amber-900",
      button: "bg-amber-600 hover:bg-amber-700 text-white",
      close: "text-amber-800 hover:bg-amber-100",
    },
    red: {
      wrap: "bg-red-50 border-red-300",
      icon: "bg-red-600",
      title: "text-red-950",
      body: "text-red-900",
      button: "bg-red-600 hover:bg-red-700 text-white",
      close: "text-red-800 hover:bg-red-100",
    },
    blue: {
      wrap: "bg-blue-50 border-blue-300",
      icon: "bg-blue-600",
      title: "text-blue-950",
      body: "text-blue-900",
      button: "bg-blue-600 hover:bg-blue-700 text-white",
      close: "text-blue-800 hover:bg-blue-100",
    },
  }[notification.tone];

  const Icon = notification.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12, height: 0, marginBottom: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className={`rounded-2xl border-2 p-4 md:p-5 overflow-hidden ${tones.wrap}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center shrink-0 ${tones.icon}`}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={`font-bold text-sm md:text-base leading-tight ${tones.title}`}
            >
              {notification.title}
            </h3>
            <button
              onClick={onDismiss}
              className={`-m-1.5 p-1.5 rounded-lg transition-colors shrink-0 ${tones.close}`}
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className={`text-sm mt-1 leading-relaxed ${tones.body}`}>
            {notification.body}
          </p>
          <button
            onClick={onAction}
            className={`mt-3 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${tones.button}`}
          >
            {notification.cta}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ElementType;
  tone: "burgundy" | "amber" | "emerald" | "blue";
}) {
  const tones = {
    burgundy: {
      bg: "bg-[#691C33]/5 border-[#691C33]/15",
      text: "text-[#691C33]",
      accent: "bg-[#691C33]",
    },
    amber: {
      bg: "bg-amber-50 border-amber-200",
      text: "text-amber-800",
      accent: "bg-amber-500",
    },
    emerald: {
      bg: "bg-emerald-50 border-emerald-200",
      text: "text-emerald-800",
      accent: "bg-emerald-500",
    },
    blue: {
      bg: "bg-blue-50 border-blue-200",
      text: "text-blue-800",
      accent: "bg-blue-500",
    },
  }[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-4 border ${tones.bg}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] md:text-[11px] uppercase tracking-wider font-bold text-slate-600 truncate">
            {label}
          </p>
          <p
            className={`text-xl md:text-2xl font-bold mt-1 leading-tight ${tones.text}`}
          >
            {value}
          </p>
          {hint && (
            <p className="text-[10px] md:text-xs text-slate-600 mt-0.5 truncate">
              {hint}
            </p>
          )}
        </div>
        <div
          className={`${tones.accent} w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0`}
        >
          <Icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PANEL
// ─────────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const { user, courses, navigateToPanel } = useDashboard();

  const student = user?.role === UserRole.STUDENT ? (user as Student) : null;
  const [dismissed, setDismissed] = useState(false);
  const [pendingPayment, setPendingPayment] = useState(false);

  // Quick check for any pending payment record
  useEffect(() => {
    const sid = student?.studentId ?? student?.id;
    if (!sid) return;
    let cancelled = false;
    fetch(`/api/students/${sid}/payments`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((body) => {
        if (!cancelled && body.success) {
          const hasPending = (body.data as any[]).some(
            (p) => p.status === "pending",
          );
          setPendingPayment(hasPending);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [student?.studentId, student?.id]);

  // Resolve display values
  const studentId = student?.studentId ?? student?.id ?? "—";
  const firstName =
    student?.fullName?.split(" ")[0] ||
    (student as any)?.firstName ||
    "Student";
  const programName =
    student?.program ||
    COURSE_FEE_LABELS[student?.deliveryFormat || "offline-6weeks"];
  const cityName = student?.city || "Abuja";

  // Fee / notification math
  const courseFee = student?.deliveryFormat
    ? COURSE_FEES[student.deliveryFormat] || 0
    : 0;
  const isPaid =
    student?.paymentStatus === "paid" ||
    student?.status === "active" ||
    student?.status === "graduated";
  const amountDue = isPaid ? 0 : courseFee;

  const notification = useMemo(
    () => getPaymentNotification(student, amountDue, pendingPayment),
    [student, amountDue, pendingPayment],
  );

  // Real stats
  const grades = (student?.grades || {}) as Record<string, number>;
  const gradedScores = Object.values(grades).filter(
    (g) => typeof g === "number",
  );
  const avgGrade =
    gradedScores.length > 0
      ? Math.round(
          gradedScores.reduce((s, g) => s + g, 0) / gradedScores.length,
        )
      : null;

  const totalAssignments = student?.totalAssignments ?? 0;
  const assignmentsCompleted = student?.assignmentsCompleted ?? 0;
  const assignmentsPending = Math.max(
    0,
    totalAssignments - assignmentsCompleted,
  );

  const activeCourses = courses?.length ?? 0;
  const progressPct =
    courses && courses.length > 0
      ? Math.round(
          courses.reduce((s, c) => s + (c.progress || 0), 0) / courses.length,
        )
      : 0;

  const stats = [
    {
      label: "Active Courses",
      value: String(activeCourses || "—"),
      hint:
        activeCourses > 0
          ? `${progressPct}% avg progress`
          : "Enrollment pending",
      icon: BookOpen,
      tone: "burgundy" as const,
    },
    {
      label: "Assignments Due",
      value: String(assignmentsPending || (isPaid ? 0 : "—")),
      hint:
        totalAssignments > 0
          ? `${assignmentsCompleted} of ${totalAssignments} done`
          : "None assigned yet",
      icon: FileText,
      tone: "amber" as const,
    },
    {
      label: "Avg. Grade",
      value: avgGrade !== null ? `${avgGrade}%` : "—",
      hint:
        avgGrade !== null ? `Grade ${gradeLetter(avgGrade)}` : "Not graded yet",
      icon: Award,
      tone: "emerald" as const,
    },
    {
      label: "Attendance",
      value:
        typeof student?.attendanceScore === "number"
          ? `${student.attendanceScore}%`
          : "—",
      hint:
        typeof student?.attendanceScore === "number"
          ? student.attendanceScore >= 80
            ? "Excellent"
            : "Below requirement"
          : "Not tracked yet",
      icon: Clock,
      tone: "blue" as const,
    },
  ];

  // Upcoming assignments — derive from user data
  const upcomingAssignments = useMemo(() => {
    const items: Array<{
      id: number;
      title: string;
      course: string;
      dueDate: string;
      priority: "high" | "medium";
    }> = [];

    if (assignmentsPending > 0) {
      items.push({
        id: 1,
        title: "Scent Composition Project",
        course: "Advanced Perfumery",
        dueDate: "This week",
        priority: "high",
      });
    }
    if (assignmentsPending > 1) {
      items.push({
        id: 2,
        title: "Chemistry Quiz",
        course: "Perfume Chemistry",
        dueDate: "Next week",
        priority: "medium",
      });
    }
    return items;
  }, [assignmentsPending]);

  return (
    <div className="space-y-4 md:space-y-5 pb-4">
      {/* ══════════ PAYMENT NOTIFICATION — TOP OF PAGE ══════════ */}
      <AnimatePresence>
        {notification && !dismissed && (
          <PaymentBanner
            notification={notification}
            onDismiss={() => setDismissed(true)}
            onAction={() => navigateToPanel("payments", "Payments")}
          />
        )}
      </AnimatePresence>

      {/* ══════════ WELCOME HERO ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#691C33] to-[#4F1526] p-5 md:p-6 text-white"
      >
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
          <div className="absolute -top-14 -right-14 w-52 h-52 rounded-full bg-white" />
          <div className="absolute -bottom-10 left-1/3 w-32 h-32 rounded-full bg-white" />
        </div>

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/70 font-bold">
                Dashboard
              </span>
              {isPaid && (
                <span className="inline-flex items-center gap-1 bg-emerald-500/20 border border-emerald-400/40 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  <CheckCircle className="w-2.5 h-2.5" />
                  Paid
                </span>
              )}
            </div>
            <h1 className="text-xl md:text-2xl font-bold leading-tight">
              Welcome back, {firstName}
            </h1>
            <p className="text-white/85 mt-1 text-sm md:text-base">
              {isPaid
                ? "Keep up the great work in your fragrance journey."
                : "Your account is active — complete payment to unlock everything."}
            </p>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3">
              <div className="flex items-center gap-1.5 text-xs md:text-sm text-white/90 min-w-0">
                <GraduationCap className="w-4 h-4 text-white/70 shrink-0" />
                <span className="truncate">{programName}</span>
              </div>
              <div className="h-3 w-px bg-white/25 hidden sm:block" />
              <div className="flex items-center gap-1.5 text-xs md:text-sm text-white/90">
                <MapPin className="w-4 h-4 text-white/70 shrink-0" />
                <span>{cityName}</span>
              </div>
            </div>
          </div>

          <div className="shrink-0 self-stretch sm:self-auto">
            <div className="bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20">
              <div className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">
                Student ID
              </div>
              <div className="font-mono font-bold text-sm mt-0.5">
                {studentId}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ══════════ STATS ══════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <StatTile
              label={s.label}
              value={s.value}
              hint={s.hint}
              icon={s.icon}
              tone={s.tone}
            />
          </motion.div>
        ))}
      </div>

      {/* ══════════ MAIN GRID ══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
        {/* ── Courses column ─────────────────────────────── */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-rose-100 shadow-sm p-5 md:p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base md:text-lg font-bold text-slate-900">
                My Courses
              </h2>
              <button
                onClick={() => navigateToPanel("courses", "My Courses")}
                className="text-xs md:text-sm text-[#691C33] font-semibold hover:text-[#8A2B4A] inline-flex items-center gap-1"
              >
                View All
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {courses && courses.length > 0 ? (
              <div className="space-y-3">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="p-4 border border-rose-100 rounded-xl hover:border-[#691C33]/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-900 text-sm md:text-base truncate">
                          {course.title}
                        </h3>
                        <p className="text-xs md:text-sm text-slate-500 mt-0.5 truncate">
                          {course.instructor}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 px-2 md:px-3 py-1 rounded-full text-[10px] md:text-xs font-semibold capitalize ${
                          course.status === "active"
                            ? "bg-emerald-100 text-emerald-800"
                            : course.status === "completed"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {course.status}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-slate-600">
                        <span className="font-medium">Progress</span>
                        <span className="font-semibold text-[#691C33]">
                          {course.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div
                          className="bg-[#691C33] h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] md:text-xs text-slate-500">
                        <span>Start: {course.startDate || "—"}</span>
                        <span>End: {course.endDate || "—"}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="w-14 h-14 rounded-full bg-[#691C33]/5 flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="w-7 h-7 text-[#691C33]/60" />
                </div>
                <p className="text-sm font-medium text-slate-700">
                  No courses assigned yet
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  {isPaid
                    ? "Your course access will appear here shortly."
                    : "Courses unlock as soon as your payment is verified."}
                </p>
                {!isPaid && (
                  <button
                    onClick={() => navigateToPanel("payments", "Payments")}
                    className="mt-4 inline-flex items-center gap-1.5 bg-[#691C33] hover:bg-[#8A2B4A] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                  >
                    <CreditCard className="w-4 h-4" />
                    Complete Payment
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </div>

        {/* ── Side column ────────────────────────────────── */}
        <div className="space-y-4 md:space-y-5">
          {/* Upcoming assignments */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl border border-rose-100 shadow-sm p-5 md:p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base md:text-lg font-bold text-slate-900">
                Upcoming
              </h2>
              <button
                onClick={() => navigateToPanel("assignments", "Assignments")}
                className="text-xs text-[#691C33] font-semibold hover:text-[#8A2B4A]"
              >
                View all
              </button>
            </div>

            {upcomingAssignments.length > 0 ? (
              <div className="space-y-3">
                {upcomingAssignments.map((a) => (
                  <div
                    key={a.id}
                    className="p-3.5 border border-rose-100 rounded-xl"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2.5">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-900 text-sm truncate">
                          {a.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          {a.course}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-semibold whitespace-nowrap ${
                          a.priority === "high"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {a.dueDate}
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        navigateToPanel("assignments", "Assignments")
                      }
                      className="w-full bg-[#691C33] text-white py-2 rounded-lg text-xs font-semibold hover:bg-[#8A2B4A] transition-colors inline-flex items-center justify-center gap-1.5"
                    >
                      Start Now
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700">
                  All caught up!
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  No assignments due right now.
                </p>
              </div>
            )}
          </motion.div>

          {/* Quick actions */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-rose-100 shadow-sm p-5 md:p-6"
          >
            <h2 className="text-base md:text-lg font-bold text-slate-900 mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                {
                  icon: Calendar,
                  label: "Schedule",
                  panel: "schedule",
                },
                {
                  icon: Download,
                  label: "Resources",
                  panel: "library",
                },
                {
                  icon: Users,
                  label: "Community",
                  panel: "messages",
                },
                {
                  icon: TrendingUp,
                  label: "Progress",
                  panel: "grades",
                },
              ].map((a) => {
                const Icon = a.icon;
                return (
                  <button
                    key={a.label}
                    onClick={() => navigateToPanel(a.panel, a.label)}
                    className="p-3.5 border border-rose-100 rounded-xl hover:border-[#691C33]/40 hover:bg-[#691C33]/5 transition-all flex flex-col items-center justify-center gap-2 group min-h-20"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#691C33]/10 group-hover:bg-[#691C33] flex items-center justify-center transition-colors">
                      <Icon className="w-4 h-4 text-[#691C33] group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-xs font-semibold text-slate-800">
                      {a.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Payment status card */}
          {student && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className={`rounded-2xl border-2 shadow-sm p-5 md:p-6 ${
                isPaid
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-white border-rose-100"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h2
                  className={`text-base md:text-lg font-bold ${
                    isPaid ? "text-emerald-950" : "text-slate-900"
                  }`}
                >
                  Payment Status
                </h2>
                <Wallet
                  className={`w-5 h-5 ${
                    isPaid ? "text-emerald-600" : "text-[#691C33]"
                  }`}
                />
              </div>

              <div className="flex items-center gap-2 mb-2">
                {isPaid ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-semibold text-emerald-700">
                      Fully paid
                    </span>
                  </>
                ) : pendingPayment ? (
                  <>
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-700">
                      Verification in progress
                    </span>
                  </>
                ) : student.paymentStatus === "partial" ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-semibold text-amber-700">
                      Partially paid
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-semibold text-amber-700">
                      Payment pending
                    </span>
                  </>
                )}
              </div>

              {!isPaid && amountDue > 0 && (
                <div className="mt-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-amber-800">
                    Amount due
                  </p>
                  <p className="text-lg font-bold text-amber-900 mt-0.5">
                    {fmtNaira(amountDue)}
                  </p>
                </div>
              )}

              <button
                onClick={() => navigateToPanel("payments", "Payments")}
                className={`mt-3 w-full py-2.5 rounded-xl text-sm font-semibold transition-colors inline-flex items-center justify-center gap-1.5 ${
                  isPaid
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-[#691C33] hover:bg-[#8A2B4A] text-white"
                }`}
              >
                <Receipt className="w-4 h-4" />
                {isPaid ? "View Payments" : "Pay or view receipts"}
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
