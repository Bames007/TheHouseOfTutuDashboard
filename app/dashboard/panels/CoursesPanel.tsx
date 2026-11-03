// app/dashboard/panels/CoursesPanel.tsx
"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Award,
  CheckCircle,
  Lock,
  PlayCircle,
  Clock,
  Calendar,
  GraduationCap,
  Receipt,
  CreditCard,
  User,
  Info,
  Target,
  FlaskRound,
  Package,
  BarChart,
  Briefcase,
  Globe,
  Users,
  Sparkles,
  AlertCircle,
  MapPin,
  ArrowRight,
  TrendingUp,
  FileCheck,
} from "lucide-react";
import { useDashboard } from "../DashboardContext";
import { Student, UserRole } from "@/app/type/database";

// ─────────────────────────────────────────────────────────────
// CURRICULUM DATA — matches the website Curriculum section
// ─────────────────────────────────────────────────────────────
type ModuleIcon = React.ElementType;

interface ModuleDef {
  title: string;
  description: string;
  icon: ModuleIcon;
  weekNumber: number;
}

const ART_FOUNDATIONS: ModuleDef[] = [
  {
    title: "Foundations of Perfumery",
    description:
      "What perfumery is, how the nose works, and the fragrance pyramid",
    icon: BookOpen,
    weekNumber: 1,
  },
  {
    title: "Fragrance Families & History",
    description: "The 8 families and Africa's role in the story of scent",
    icon: Target,
    weekNumber: 2,
  },
  {
    title: "Raw Materials & Extraction",
    description: "Natural vs synthetic, plus the 5 extraction methods",
    icon: Package,
    weekNumber: 3,
  },
  {
    title: "The Art of Blending",
    description: "Accords, the Rule of Three, and building your first blend",
    icon: FlaskRound,
    weekNumber: 4,
  },
  {
    title: "Formulation & Safety",
    description: "Percentages, concentrations, IFRA, and patch testing",
    icon: BarChart,
    weekNumber: 5,
  },
  {
    title: "Launch & Certification",
    description: "Maceration, basic pricing, and a Mini Showcase",
    icon: Award,
    weekNumber: 6,
  },
];

const ART_ADVANCED: ModuleDef[] = [
  {
    title: "Advanced Formulation",
    description: "Complex accords and reverse-engineering famous compositions",
    icon: FlaskRound,
    weekNumber: 7,
  },
  {
    title: "Niche & Fine Fragrance",
    description: "Designing signature scents for the high-end market",
    icon: Sparkles,
    weekNumber: 8,
  },
  {
    title: "Regulatory & Compliance",
    description: "IFRA standards, labelling, and product safety files",
    icon: Info,
    weekNumber: 9,
  },
  {
    title: "Production at Scale",
    description: "Sourcing, batching, and quality control at volume",
    icon: Package,
    weekNumber: 10,
  },
  {
    title: "Business Foundations",
    description: "Pricing, positioning, and the business of perfume",
    icon: Briefcase,
    weekNumber: 11,
  },
  {
    title: "Capstone Showcase",
    description: "Launch a market-ready fragrance line with peer review",
    icon: Award,
    weekNumber: 12,
  },
];

const COMMERCIAL: ModuleDef[] = [
  {
    title: "Business Models",
    description:
      "The 4 paths available to a perfumer — from home studio to export",
    icon: Briefcase,
    weekNumber: 1,
  },
  {
    title: "Brand Identity",
    description: "Naming, storytelling, and visual packaging that sells",
    icon: Package,
    weekNumber: 2,
  },
  {
    title: "Pricing Strategy",
    description: "Cost × Markup — pricing your product for real profit",
    icon: BarChart,
    weekNumber: 3,
  },
  {
    title: "Digital Marketing",
    description: "Content, ads, and selling fragrance online",
    icon: Globe,
    weekNumber: 4,
  },
  {
    title: "Retail & Wholesale",
    description: "Selling to stores, hotels, and corporate clients",
    icon: Users,
    weekNumber: 5,
  },
  {
    title: "First Commercial Batch",
    description: "Production, packaging, and your public launch",
    icon: Award,
    weekNumber: 6,
  },
];

const ONE_DAY: ModuleDef[] = [
  {
    title: "Quick-Start Perfumery",
    description: "The essentials of scent creation in a single day",
    icon: FlaskRound,
    weekNumber: 1,
  },
  {
    title: "First Blend Workshop",
    description: "Build, bottle, and take home your first composition",
    icon: Award,
    weekNumber: 1,
  },
];

function getModulesForFormat(format?: string): ModuleDef[] {
  switch (format) {
    case "offline-6weeks":
      return ART_FOUNDATIONS;
    case "offline-3months":
      return [...ART_FOUNDATIONS, ...ART_ADVANCED];
    case "intensive-1day":
      return ONE_DAY;
    default:
      return ART_FOUNDATIONS;
  }
}

function getProgramMeta(format?: string) {
  switch (format) {
    case "offline-6weeks":
      return {
        label: "6 Weeks Masterclass",
        track: "Art of Perfumery",
        totalWeeks: 6,
        mode: "Weekly in-person",
      };
    case "offline-3months":
      return {
        label: "3 Months Masterclass",
        track: "Art + Business Track",
        totalWeeks: 12,
        mode: "Weekly in-person",
      };
    case "intensive-1day":
      return {
        label: "1-Day Intensive",
        track: "Fast-Track Perfumery",
        totalWeeks: 1,
        mode: "Single day class",
      };
    default:
      return {
        label: "Masterclass",
        track: "Perfumery",
        totalWeeks: 6,
        mode: "Weekly in-person",
      };
  }
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function fmtDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function fmtDateShort(iso?: string) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return `${d.toLocaleDateString("en-NG", { month: "short" })} ${d.getDate()}`;
  } catch {
    return iso;
  }
}

function weeksSince(iso?: string): number {
  if (!iso) return 0;
  const start = new Date(iso).getTime();
  if (isNaN(start)) return 0;
  return Math.max(
    0,
    Math.floor((Date.now() - start) / (7 * 24 * 60 * 60 * 1000)),
  );
}

function addWeeks(iso: string, n: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + n * 7);
  return d.toISOString().slice(0, 10);
}

function gradeTone(grade?: number) {
  if (grade === undefined || grade === null)
    return { bg: "bg-slate-100", text: "text-slate-500", label: "—" };
  if (grade >= 90)
    return { bg: "bg-emerald-100", text: "text-emerald-800", label: "A" };
  if (grade >= 80)
    return { bg: "bg-blue-100", text: "text-blue-800", label: "B" };
  if (grade >= 70)
    return { bg: "bg-amber-100", text: "text-amber-800", label: "C" };
  if (grade >= 60)
    return { bg: "bg-orange-100", text: "text-orange-800", label: "D" };
  return { bg: "bg-red-100", text: "text-red-800", label: "F" };
}

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────
function GradeTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = "burgundy",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ElementType;
  tone?: "burgundy" | "emerald" | "blue";
}) {
  const tones = {
    burgundy: "bg-[#691C33]/5 border-[#691C33]/15 text-[#691C33]",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
    blue: "bg-blue-50 border-blue-100 text-blue-700",
  };
  return (
    <div className={`rounded-2xl p-4 border ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] md:text-[11px] uppercase tracking-wider font-bold opacity-80">
            {label}
          </p>
          <p className="text-xl md:text-2xl font-bold mt-1">{value}</p>
          {hint && (
            <p className="text-[10px] md:text-xs opacity-70 mt-0.5">{hint}</p>
          )}
        </div>
        <Icon className="w-4 h-4 md:w-5 md:h-5 opacity-60 shrink-0" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PANEL
// ─────────────────────────────────────────────────────────────
export default function CoursesPanel() {
  const { user, navigateToPanel } = useDashboard();
  const student = user?.role === UserRole.STUDENT ? (user as Student) : null;

  const modules = useMemo(
    () => (student ? getModulesForFormat(student.deliveryFormat) : []),
    [student],
  );
  const meta = useMemo(
    () => (student ? getProgramMeta(student.deliveryFormat) : null),
    [student],
  );

  const grades = (student?.grades || {}) as Record<string, number>;

  const currentWeek = useMemo(() => {
    if (!student || !meta) return 1;
    return Math.min(weeksSince(student.createdAt) + 1, meta.totalWeeks);
  }, [student, meta]);

  const completedCount = modules.filter(
    (m) => grades[m.title] !== undefined,
  ).length;
  const progressPct =
    modules.length > 0
      ? Math.round((completedCount / modules.length) * 100)
      : 0;

  const avgGrade = useMemo(() => {
    const scored = modules
      .map((m) => grades[m.title])
      .filter((g): g is number => typeof g === "number");
    if (scored.length === 0) return null;
    return Math.round(scored.reduce((s, g) => s + g, 0) / scored.length);
  }, [modules, grades]);

  const attendance =
    typeof student?.attendanceScore === "number"
      ? student.attendanceScore
      : null;

  const isOneDay = student?.deliveryFormat === "intensive-1day";
  const isPaid =
    student?.paymentStatus === "paid" ||
    student?.status === "active" ||
    student?.status === "graduated";
  const isGraduated = student?.status === "graduated";

  // Build week strip
  const weekStrip = useMemo(() => {
    if (!student || !meta || isOneDay) return [];
    const start = student.createdAt || student.enrollmentDate;
    if (!start) return [];
    const items = [];
    for (let w = 1; w <= meta.totalWeeks; w++) {
      const dateIso = addWeeks(start, w - 1);
      const d = new Date(dateIso);
      const isPast = w < currentWeek;
      const isCurrent = w === currentWeek;
      items.push({ week: w, date: dateIso, isPast, isCurrent });
    }
    return items;
  }, [student, meta, currentWeek, isOneDay]);

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-full bg-[#691C33]/5 flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-7 h-7 text-[#691C33]/60" />
          </div>
          <p className="text-sm text-slate-600">
            Course information is available for enrolled students only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-4">
      {/* ══════════ GRADES — AT THE VERY TOP ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4"
      >
        <GradeTile
          label="Overall Grade"
          value={avgGrade !== null ? `${avgGrade}%` : "—"}
          hint={
            avgGrade !== null
              ? `Grade ${gradeTone(avgGrade).label}`
              : "No grades recorded yet"
          }
          icon={Award}
          tone="burgundy"
        />
        <GradeTile
          label="Attendance"
          value={attendance !== null ? `${attendance}%` : "—"}
          hint={attendance !== null ? "This term" : "Not tracked yet"}
          icon={CheckCircle}
          tone="emerald"
        />
        <GradeTile
          label="Progress"
          value={`${progressPct}%`}
          hint={`${completedCount} of ${modules.length} modules`}
          icon={TrendingUp}
          tone="blue"
        />
      </motion.div>

      {/* ══════════ PROGRAM HEADER ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#691C33] to-[#4F1526] p-5 md:p-6 text-white"
      >
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white" />
          <div className="absolute -bottom-12 left-1/3 w-32 h-32 rounded-full bg-white" />
        </div>
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 bg-white/15 border border-white/20 rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-wider font-bold mb-2">
              {isGraduated ? (
                <>
                  <Award className="w-3 h-3" />
                  Graduated
                </>
              ) : isPaid ? (
                <>
                  <PlayCircle className="w-3 h-3" />
                  In Progress
                </>
              ) : (
                <>
                  <AlertCircle className="w-3 h-3" />
                  Awaiting Payment
                </>
              )}
            </div>
            <h1 className="text-xl md:text-2xl font-bold leading-tight">
              {student.program || meta?.label}
            </h1>
            <p className="text-white/85 text-sm mt-1">{meta?.label}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-xs text-white/85">
              <span className="inline-flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-white/70" />
                {meta?.track}
              </span>
              <div className="h-3 w-px bg-white/25" />
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-white/70" />
                {meta?.mode}
              </span>
              {isOneDay && student.oneDayDay && (
                <>
                  <div className="h-3 w-px bg-white/25" />
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-white/70" />
                    {student.oneDayDay} ·{" "}
                    {student.oneDaySlotLabel || student.oneDaySlot}
                  </span>
                </>
              )}
              <div className="h-3 w-px bg-white/25" />
              <span className="font-mono">{student.id}</span>
            </div>
          </div>

          <div className="shrink-0 flex gap-2">
            <div className="bg-white/15 border border-white/20 rounded-xl px-3 py-2">
              <p className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">
                Enrolled
              </p>
              <p className="text-sm font-bold mt-0.5">
                {fmtDate(student.createdAt || student.enrollmentDate)}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ══════════ CALENDAR STRIP ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl border border-rose-100 shadow-sm p-5 md:p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#691C33]/10 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-[#691C33]" />
            </div>
            <h2 className="text-base md:text-lg font-bold text-slate-900">
              {isOneDay ? "Your Class Day" : "Class Schedule"}
            </h2>
          </div>
          {!isOneDay && (
            <span className="text-xs text-slate-500 font-medium">
              Week {currentWeek} of {meta?.totalWeeks}
            </span>
          )}
        </div>

        {isOneDay ? (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[#691C33]/5 border border-[#691C33]/15">
            <div className="w-12 h-12 rounded-xl bg-[#691C33] flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-sm md:text-base">
                {student.oneDayDay || "Day not set"} ·{" "}
                {student.oneDaySlotLabel ||
                  student.oneDaySlot ||
                  "Time not set"}
              </p>
              <p className="text-xs md:text-sm text-slate-600 mt-0.5">
                2-hour intensive session · {meta?.mode}
              </p>
            </div>
            <MapPin className="w-4 h-4 text-[#691C33]/60 shrink-0" />
          </div>
        ) : (
          <div className="-mx-5 md:-mx-6 px-5 md:px-6 overflow-x-auto">
            <div className="flex gap-2 min-w-max pb-2">
              {weekStrip.map((w) => (
                <div
                  key={w.week}
                  className={`flex-shrink-0 w-16 md:w-20 rounded-xl border-2 p-2.5 text-center transition-all ${
                    w.isCurrent
                      ? "bg-[#691C33] border-[#691C33] text-white shadow-lg shadow-[#691C33]/20"
                      : w.isPast
                        ? "bg-[#691C33]/5 border-[#691C33]/20 text-[#691C33]"
                        : "bg-white border-slate-200 text-slate-600"
                  }`}
                >
                  <p
                    className={`text-[10px] uppercase tracking-wider font-bold ${
                      w.isCurrent ? "text-white/75" : "opacity-70"
                    }`}
                  >
                    Wk {w.week}
                  </p>
                  <p className="text-xs md:text-sm font-bold mt-1">
                    {fmtDateShort(w.date)}
                  </p>
                  {w.isPast && (
                    <CheckCircle className="w-3 h-3 mx-auto mt-1 opacity-70" />
                  )}
                  {w.isCurrent && (
                    <p className="text-[9px] uppercase tracking-wider font-bold mt-1 text-white/85">
                      Now
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* ══════════ MODULES GRID ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl border border-rose-100 shadow-sm p-5 md:p-6"
      >
        <div className="flex items-center justify-between mb-4 md:mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#691C33]/10 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-[#691C33]" />
            </div>
            <h2 className="text-base md:text-lg font-bold text-slate-900">
              Curriculum
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {modules.length} modules
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {modules.map((m, idx) => {
            const Icon = m.icon;
            const grade = grades[m.title];
            const hasGrade = typeof grade === "number";
            const isUnlocked = isOneDay || m.weekNumber <= currentWeek;
            const isCurrent =
              !isOneDay && m.weekNumber === currentWeek && !hasGrade;
            const isCompleted = hasGrade;
            const isLocked = !isUnlocked && !hasGrade;

            const tone = gradeTone(grade);

            return (
              <motion.div
                key={m.title}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + idx * 0.02 }}
                className={`relative rounded-2xl border-2 p-4 transition-all ${
                  isCompleted
                    ? "bg-emerald-50/60 border-emerald-200"
                    : isCurrent
                      ? "bg-[#691C33] border-[#691C33] text-white shadow-lg shadow-[#691C33]/20"
                      : isLocked
                        ? "bg-slate-50 border-slate-200 opacity-70"
                        : "bg-white border-rose-100 hover:border-[#691C33]/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isCurrent
                        ? "bg-white/20"
                        : isCompleted
                          ? "bg-emerald-600"
                          : isLocked
                            ? "bg-slate-200"
                            : "bg-[#691C33]/10"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isCurrent
                          ? "text-white"
                          : isCompleted
                            ? "text-white"
                            : isLocked
                              ? "text-slate-400"
                              : "text-[#691C33]"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3
                        className={`font-semibold text-sm md:text-base leading-tight ${
                          isCurrent ? "text-white" : "text-slate-900"
                        }`}
                      >
                        {m.title}
                      </h3>
                      {isCompleted && (
                        <span
                          className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${tone.bg} ${tone.text}`}
                        >
                          {grade}%
                        </span>
                      )}
                      {isCurrent && (
                        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-white text-[#691C33]">
                          Now
                        </span>
                      )}
                      {isLocked && (
                        <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                    </div>
                    <p
                      className={`text-xs md:text-sm leading-relaxed ${
                        isCurrent ? "text-white/85" : "text-slate-600"
                      }`}
                    >
                      {m.description}
                    </p>
                    {!isOneDay && (
                      <p
                        className={`text-[10px] mt-2 uppercase tracking-wider font-semibold ${
                          isCurrent ? "text-white/65" : "text-slate-400"
                        }`}
                      >
                        Week {m.weekNumber}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ══════════ PAYMENT / CERTIFICATE ══════════ */}
      {!isPaid && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl p-5 md:p-6 bg-amber-50 border-2 border-amber-300"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-amber-950 text-sm md:text-base">
                Complete your payment
              </h3>
              <p className="text-sm text-amber-900 mt-1">
                Unlock all {modules.length} modules once your course fee is
                verified.
              </p>
              <button
                onClick={() => navigateToPanel("payments", "Payments")}
                className="mt-3 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition-colors"
              >
                Go to Payments
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {isGraduated && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl p-5 md:p-6 bg-emerald-50 border-2 border-emerald-300"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-emerald-950 text-sm md:text-base">
                Program completed — congratulations
              </h3>
              <p className="text-sm text-emerald-900 mt-1">
                {student.certificateStatus === "issued"
                  ? "Your certificate is ready to download."
                  : student.certificateRequested
                    ? "Your certificate request is being processed."
                    : "Request your certificate from the settings panel."}
              </p>
              <button
                onClick={() => navigateToPanel("settings", "Settings")}
                className="mt-3 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-xl text-sm font-semibold inline-flex items-center gap-2 transition-colors"
              >
                <FileCheck className="w-4 h-4" />
                Certificate
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ══════════ ENROLLMENT DETAILS ══════════ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-white rounded-2xl border border-rose-100 shadow-sm p-5 md:p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#691C33]/10 flex items-center justify-center">
            <Receipt className="w-4 h-4 text-[#691C33]" />
          </div>
          <h2 className="text-base md:text-lg font-bold text-slate-900">
            Enrollment Details
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
          {[
            {
              label: "Receipt Number",
              value: student.enrollmentReceipt || "—",
              mono: true,
            },
            { label: "Program", value: student.program || meta?.label || "—" },
            { label: "Format", value: meta?.label || "—" },
            { label: "Track", value: meta?.track || "—" },
            {
              label: "Duration",
              value: isOneDay ? "1 day (2 hours)" : `${meta?.totalWeeks} weeks`,
            },
            {
              label: "Enrolled",
              value: fmtDate(student.createdAt || student.enrollmentDate),
            },
            { label: "Student ID", value: student.id, mono: true },
            { label: "Batch", value: student.batch || "—" },
          ].map((row) => (
            <div
              key={row.label}
              className="flex items-start justify-between gap-3 py-2.5 border-b border-slate-100 last:border-0"
            >
              <p className="text-xs text-slate-500 font-medium shrink-0">
                {row.label}
              </p>
              <p
                className={`text-xs md:text-sm font-semibold text-slate-900 text-right break-words ${
                  row.mono ? "font-mono" : ""
                }`}
              >
                {row.value}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
