// app/dashboard/panels/GradesPanel.tsx
"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Award,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  BookOpen,
  GraduationCap,
  FileCheck,
  AlertCircle,
  BarChart3,
  Trophy,
  Target,
  Calendar,
  Download,
  Lock,
} from "lucide-react";
import { useDashboard } from "../DashboardContext";
import { Student, UserRole, DeliveryFormat } from "@/app/type/database";

// ─────────────────────────────────────────────────────────────
// CURRICULUM MIRROR (matches CoursesPanel/AssignmentsPanel)
// ─────────────────────────────────────────────────────────────
const ART_FOUNDATIONS = [
  "Foundations of Perfumery",
  "Fragrance Families & History",
  "Raw Materials & Extraction",
  "The Art of Blending",
  "Formulation & Safety",
  "Launch & Certification",
];
const ART_ADVANCED = [
  "Advanced Formulation",
  "Niche & Fine Fragrance",
  "Regulatory & Compliance",
  "Production at Scale",
  "Business Foundations",
  "Capstone Showcase",
];
const COMMERCIAL = [
  "Business Models",
  "Brand Identity",
  "Pricing Strategy",
  "Digital Marketing",
  "Retail & Wholesale",
  "First Commercial Batch",
];
const ONE_DAY = ["Quick-Start Perfumery", "First Blend Workshop"];

function getModules(format?: DeliveryFormat): string[] {
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

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
interface GradeBand {
  letter: string;
  label: string;
  min: number;
  bg: string;
  text: string;
  bar: string;
}

const GRADE_BANDS: GradeBand[] = [
  {
    letter: "A",
    label: "Excellent",
    min: 90,
    bg: "bg-emerald-100",
    text: "text-emerald-800",
    bar: "bg-emerald-500",
  },
  {
    letter: "B",
    label: "Good",
    min: 80,
    bg: "bg-blue-100",
    text: "text-blue-800",
    bar: "bg-blue-500",
  },
  {
    letter: "C",
    label: "Average",
    min: 70,
    bg: "bg-amber-100",
    text: "text-amber-800",
    bar: "bg-amber-500",
  },
  {
    letter: "D",
    label: "Below Average",
    min: 60,
    bg: "bg-orange-100",
    text: "text-orange-800",
    bar: "bg-orange-500",
  },
  {
    letter: "F",
    label: "Failing",
    min: 0,
    bg: "bg-red-100",
    text: "text-red-800",
    bar: "bg-red-500",
  },
];

function bandFor(score: number): GradeBand {
  for (const b of GRADE_BANDS) {
    if (score >= b.min) return b;
  }
  return GRADE_BANDS[GRADE_BANDS.length - 1];
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

// ─────────────────────────────────────────────────────────────
// SMALL COMPONENTS
// ─────────────────────────────────────────────────────────────
function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = "burgundy",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ElementType;
  tone?: "burgundy" | "emerald" | "amber" | "blue" | "slate";
}) {
  const tones: Record<string, string> = {
    burgundy: "bg-[#691C33]/5 border-[#691C33]/15 text-[#691C33]",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-800",
    amber: "bg-amber-50 border-amber-100 text-amber-800",
    blue: "bg-blue-50 border-blue-100 text-blue-800",
    slate: "bg-slate-50 border-slate-200 text-slate-700",
  };
  return (
    <div className={`rounded-2xl p-4 border ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] md:text-[11px] uppercase tracking-wider font-bold opacity-80">
            {label}
          </p>
          <p className="text-lg md:text-xl font-bold mt-1 truncate">{value}</p>
          {hint && (
            <p className="text-[10px] md:text-xs opacity-70 mt-0.5 truncate">
              {hint}
            </p>
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
export default function GradesPanel() {
  const { user, navigateToPanel } = useDashboard();
  const student = user?.role === UserRole.STUDENT ? (user as Student) : null;

  const grades = (student?.grades || {}) as Record<string, number>;
  const modules = useMemo(
    () => (student ? getModules(student.deliveryFormat) : []),
    [student],
  );

  // Scored modules only (graded ones)
  const scoredModules = useMemo(
    () =>
      modules
        .map((title) => ({
          title,
          grade: grades[title],
        }))
        .filter((m) => typeof m.grade === "number"),
    [modules, grades],
  );

  const avg = useMemo(() => {
    if (scoredModules.length === 0) return null;
    const sum = scoredModules.reduce((s, m) => s + (m.grade || 0), 0);
    return Math.round(sum / scoredModules.length);
  }, [scoredModules]);

  const overallBand = avg !== null ? bandFor(avg) : null;

  const highestGrade = useMemo(() => {
    if (scoredModules.length === 0) return null;
    return scoredModules.reduce(
      (best, m) => ((m.grade || 0) > (best.grade || 0) ? m : best),
      scoredModules[0],
    );
  }, [scoredModules]);

  const lowestGrade = useMemo(() => {
    if (scoredModules.length === 0) return null;
    return scoredModules.reduce(
      (worst, m) => ((m.grade || 0) < (worst.grade || 0) ? m : worst),
      scoredModules[0],
    );
  }, [scoredModules]);

  // Letter distribution for the mini chart
  const distribution = useMemo(() => {
    const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    for (const m of scoredModules) {
      const band = bandFor(m.grade || 0);
      counts[band.letter]++;
    }
    return counts;
  }, [scoredModules]);

  const totalCount = scoredModules.length || 1;

  const attendance =
    typeof student?.attendanceScore === "number"
      ? student.attendanceScore
      : null;

  const isGraduated = student?.status === "graduated";
  const certificateReady =
    isGraduated && student?.certificateStatus === "issued";

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-full bg-[#691C33]/5 flex items-center justify-center mx-auto mb-3">
            <Award className="w-7 h-7 text-[#691C33]/60" />
          </div>
          <p className="text-sm text-slate-600">
            Grades are available for enrolled students only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-4">
      {/* ── OVERALL GRADE HERO ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#691C33] to-[#4F1526] p-5 md:p-7 text-white"
      >
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white" />
          <div className="absolute -bottom-12 left-1/3 w-32 h-32 rounded-full bg-white" />
        </div>

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Big number */}
          <div className="shrink-0">
            <div className="relative w-28 h-28">
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full -rotate-90"
                aria-hidden="true"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="8"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 44}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 44 }}
                  animate={{
                    strokeDashoffset:
                      2 * Math.PI * 44 * (1 - Math.min(1, (avg || 0) / 100)),
                  }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-3xl md:text-4xl font-bold leading-none">
                  {avg !== null ? `${avg}%` : "—"}
                </p>
                {overallBand && (
                  <p className="text-[10px] uppercase tracking-wider font-bold text-white/70 mt-1">
                    Grade {overallBand.letter}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/70 font-bold">
              Overall Grade
            </p>
            <h1 className="text-xl md:text-2xl font-bold leading-tight mt-1">
              {overallBand
                ? overallBand.label
                : "Your journey is just beginning"}
            </h1>
            <p className="text-sm text-white/85 mt-1">
              {scoredModules.length > 0
                ? `Based on ${scoredModules.length} graded module${scoredModules.length === 1 ? "" : "s"}`
                : "Grades will appear here as your modules are assessed."}
            </p>

            {scoredModules.length > 0 && (
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-xs text-white/85">
                {highestGrade && (
                  <span className="inline-flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-white/70" />
                    Best: {highestGrade.grade}% ({highestGrade.title})
                  </span>
                )}
                {lowestGrade && lowestGrade.title !== highestGrade?.title && (
                  <span className="inline-flex items-center gap-1">
                    <TrendingDown className="w-3.5 h-3.5 text-white/70" />
                    Focus: {lowestGrade.grade}% ({lowestGrade.title})
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── STATS ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile
          label="Graded Modules"
          value={`${scoredModules.length}/${modules.length}`}
          hint={
            scoredModules.length === modules.length
              ? "Complete"
              : `${modules.length - scoredModules.length} pending`
          }
          icon={CheckCircle}
          tone="slate"
        />
        <StatTile
          label="Attendance"
          value={attendance !== null ? `${attendance}%` : "—"}
          hint={attendance !== null ? "This term" : "Not tracked"}
          icon={Calendar}
          tone={attendance !== null && attendance >= 80 ? "emerald" : "amber"}
        />
        <StatTile
          label="Best Grade"
          value={highestGrade ? `${highestGrade.grade}%` : "—"}
          hint={highestGrade ? highestGrade.title : "No grades yet"}
          icon={Trophy}
          tone="emerald"
        />
        <StatTile
          label="Lowest Grade"
          value={lowestGrade ? `${lowestGrade.grade}%` : "—"}
          hint={lowestGrade ? lowestGrade.title : "No grades yet"}
          icon={Target}
          tone="amber"
        />
      </div>

      {/* ── GRADE DISTRIBUTION ────────────────────────────── */}
      {scoredModules.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-rose-100 shadow-sm p-5 md:p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[#691C33]/10 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-[#691C33]" />
            </div>
            <h2 className="text-base md:text-lg font-bold text-slate-900">
              Distribution
            </h2>
          </div>

          <div className="space-y-2.5">
            {GRADE_BANDS.map((band) => {
              const count = distribution[band.letter] || 0;
              const pct = (count / totalCount) * 100;
              return (
                <div key={band.letter} className="flex items-center gap-3">
                  <div className="w-16 shrink-0">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${band.bg} ${band.text}`}
                    >
                      Grade {band.letter}
                    </span>
                  </div>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      className={`h-full rounded-full ${band.bar}`}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-700 w-10 text-right shrink-0">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── MODULE BREAKDOWN ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-rose-100 shadow-sm p-5 md:p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#691C33]/10 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-[#691C33]" />
            </div>
            <h2 className="text-base md:text-lg font-bold text-slate-900">
              Module Grades
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {modules.length} modules
          </span>
        </div>

        <div className="space-y-2">
          {modules.map((title, i) => {
            const grade = grades[title];
            const hasGrade = typeof grade === "number";
            const band = hasGrade ? bandFor(grade) : null;

            return (
              <div
                key={title}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                  hasGrade
                    ? "border-slate-100 bg-white hover:border-[#691C33]/30"
                    : "border-slate-100 bg-slate-50"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    hasGrade ? "bg-[#691C33]/10" : "bg-slate-200"
                  }`}
                >
                  {hasGrade ? (
                    <CheckCircle className="w-4 h-4 text-[#691C33]" />
                  ) : (
                    <Lock className="w-4 h-4 text-slate-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className={`text-sm font-semibold truncate ${
                        hasGrade ? "text-slate-900" : "text-slate-500"
                      }`}
                    >
                      {title}
                    </p>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 shrink-0">
                      Wk {i + 1}
                    </span>
                  </div>
                  {hasGrade && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${grade}%` }}
                          transition={{ duration: 0.6 }}
                          className={`h-full rounded-full ${band?.bar || "bg-[#691C33]"}`}
                        />
                      </div>
                    </div>
                  )}
                  {!hasGrade && (
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Not yet graded
                    </p>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  {hasGrade && band ? (
                    <>
                      <p className={`text-sm font-bold ${band.text}`}>
                        {grade}%
                      </p>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">
                        {band.letter}
                      </p>
                    </>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ── CERTIFICATE / GRADUATION ──────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-rose-100 shadow-sm p-5 md:p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-[#691C33]/10 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-[#691C33]" />
          </div>
          <h2 className="text-base md:text-lg font-bold text-slate-900">
            Certificate
          </h2>
        </div>

        {certificateReady ? (
          <div className="rounded-xl p-4 bg-emerald-50 border border-emerald-200">
            <div className="flex items-start gap-3">
              <Award className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-emerald-950">
                  Your certificate is ready
                </p>
                <p className="text-xs text-emerald-800 mt-1">
                  Download your certificate to share with employers or clients.
                </p>
                <button
                  onClick={() => navigateToPanel("settings", "Settings")}
                  className="mt-3 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              </div>
            </div>
          </div>
        ) : isGraduated ? (
          <div className="rounded-xl p-4 bg-emerald-50 border border-emerald-200">
            <div className="flex items-start gap-3">
              <Award className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-emerald-950">
                  Program completed
                </p>
                <p className="text-xs text-emerald-800 mt-1">
                  {student.certificateRequested
                    ? "Your certificate request is being processed."
                    : "Request your certificate from the settings panel."}
                </p>
                <button
                  onClick={() => navigateToPanel("settings", "Settings")}
                  className="mt-3 inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  {student.certificateRequested ? "View status" : "Request"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl p-4 bg-slate-50 border border-slate-200">
            <div className="flex items-start gap-3">
              <Clock className="w-6 h-6 text-slate-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900">
                  Certificate locked
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Complete all {modules.length} modules to unlock your
                  certificate of completion.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#691C33] rounded-full transition-all"
                      style={{
                        width: `${(scoredModules.length / modules.length) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 shrink-0">
                    {scoredModules.length}/{modules.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── ATTENDANCE NOTE ───────────────────────────────── */}
      {attendance !== null && attendance < 80 && (
        <div className="rounded-2xl p-4 bg-amber-50 border border-amber-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-950">
            Your attendance is currently{" "}
            <span className="font-bold">{attendance}%</span>. Most programs
            require <span className="font-bold">80%</span> attendance for
            certification.
          </p>
        </div>
      )}
    </div>
  );
}
