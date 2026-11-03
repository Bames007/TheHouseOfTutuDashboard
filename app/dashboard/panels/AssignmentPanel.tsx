// app/dashboard/panels/AssignmentsPanel.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardList,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Upload,
  Loader2,
  ChevronRight,
  Award,
  ArrowRight,
  Paperclip,
  Send,
  Filter,
  Calendar,
  AlertTriangle,
  BookOpen,
  MessageSquare,
} from "lucide-react";
import { useDashboard } from "../DashboardContext";
import { Student, UserRole, DeliveryFormat } from "@/app/type/database";

// ─────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────
type AssignmentState =
  | "upcoming"
  | "due_soon"
  | "overdue"
  | "submitted"
  | "graded";

type Priority = "high" | "medium" | "low";

interface SubmissionView {
  submittedAt: string;
  score?: number;
  feedback?: string;
  fileName?: string;
}

interface AssignmentView {
  id: string;
  title: string;
  description: string;
  course: string;
  weekNumber: number;
  dueDate: string;
  maxScore: number;
  priority: Priority;
  studentSubmission?: SubmissionView;
}

// ─────────────────────────────────────────────────────────────
// MOCK DATA — one assignment per curriculum module
// TODO: replace buildAssignments() with
//   fetch(`/api/students/${studentId}/assignments`)
// once the backend endpoint exists.
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

function getModuleTitles(format?: DeliveryFormat): string[] {
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

function buildAssignments(
  format: DeliveryFormat | undefined,
  grades: Record<string, number>,
): AssignmentView[] {
  const now = new Date();
  const offset = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d.toISOString();
  };
  const modules = getModuleTitles(format);

  return modules.map((title, i) => {
    // Weeks 1–2 due 15/10 days ago, week 3 five days ago,
    // week 4 today, weeks 5+ upcoming.
    const dueOffset = (i - 3) * 5;
    const due = offset(dueOffset);
    const grade = grades[title];

    const studentSubmission: SubmissionView | undefined =
      typeof grade === "number"
        ? {
            submittedAt: offset(dueOffset - 2),
            score: grade,
            feedback:
              grade >= 85
                ? "Excellent work — clear structure and thorough reasoning. Well done."
                : grade >= 70
                  ? "Good effort overall. Tighten the analysis in the second section."
                  : "Accepted, but please review the module notes and consider a resubmission.",
            fileName: `${title.toLowerCase().replace(/\s+/g, "-")}.pdf`,
          }
        : undefined;

    return {
      id: `asg-${i + 1}`,
      title: `${title} — Practice`,
      description: `Complete the practice exercise for ${title}. Upload a document, image, or scan of your work. Graded against the module rubric on accuracy, reasoning, and presentation.`,
      course: title,
      weekNumber: i + 1,
      dueDate: due,
      maxScore: 100,
      priority: i < 2 ? "high" : i < 4 ? "medium" : "low",
      studentSubmission,
    };
  });
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
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

function fmtDateTime(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-NG", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function daysUntil(iso: string): number {
  const d = new Date(iso).getTime();
  const today = new Date().setHours(0, 0, 0, 0);
  return Math.round((d - today) / (1000 * 60 * 60 * 24));
}

function getAssignmentState(a: AssignmentView): AssignmentState {
  if (a.studentSubmission) {
    return typeof a.studentSubmission.score === "number"
      ? "graded"
      : "submitted";
  }
  const days = daysUntil(a.dueDate);
  if (days < 0) return "overdue";
  if (days <= 3) return "due_soon";
  return "upcoming";
}

const STATE_STYLES: Record<
  AssignmentState,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  upcoming: {
    label: "Upcoming",
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  due_soon: {
    label: "Due Soon",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  overdue: {
    label: "Overdue",
    bg: "bg-red-50",
    text: "text-red-800",
    border: "border-red-200",
    dot: "bg-red-500",
  },
  submitted: {
    label: "Submitted",
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-slate-500",
  },
  graded: {
    label: "Graded",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
};

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
  tone?: "burgundy" | "emerald" | "amber" | "blue" | "red" | "slate";
}) {
  const tones: Record<string, string> = {
    burgundy: "bg-[#691C33]/5 border-[#691C33]/15 text-[#691C33]",
    emerald: "bg-emerald-50 border-emerald-100 text-emerald-800",
    amber: "bg-amber-50 border-amber-100 text-amber-800",
    blue: "bg-blue-50 border-blue-100 text-blue-800",
    red: "bg-red-50 border-red-100 text-red-800",
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

function PriorityDot({ priority }: { priority: Priority }) {
  const map = {
    high: "bg-red-500",
    medium: "bg-amber-500",
    low: "bg-slate-400",
  };
  return (
    <span
      className={`inline-block w-1.5 h-1.5 rounded-full ${map[priority]}`}
      aria-label={`${priority} priority`}
    />
  );
}

// ─────────────────────────────────────────────────────────────
// DETAIL MODAL
// ─────────────────────────────────────────────────────────────
function AssignmentDetail({
  assignment,
  onClose,
  onSubmit,
}: {
  assignment: AssignmentView;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const state = getAssignmentState(assignment);
  const stateStyle = STATE_STYLES[state];
  const isGraded = state === "graded";
  const isSubmitted = state === "submitted" || isGraded;
  const days = daysUntil(assignment.dueDate);

  const dueLabel =
    days === 0
      ? "Due today"
      : days > 0
        ? `Due in ${days} day${days === 1 ? "" : "s"}`
        : `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl max-h-[92vh] overflow-y-auto [color-scheme:light]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-slate-200">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#691C33]/10 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-[#691C33]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {assignment.title}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                {assignment.course}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center shrink-0"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Status row */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${stateStyle.bg} ${stateStyle.text} ${stateStyle.border}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${stateStyle.dot}`} />
              {stateStyle.label}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-600">
              <Clock className="w-3.5 h-3.5" />
              {dueLabel}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-600">
              <Award className="w-3.5 h-3.5" />
              {assignment.maxScore} pts
            </span>
          </div>

          {/* Description */}
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 mb-1.5">
              Instructions
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">
              {assignment.description}
            </p>
          </div>

          {/* Key details */}
          <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-100">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                Due Date
              </p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">
                {fmtDate(assignment.dueDate)}
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
                Week
              </p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">
                Week {assignment.weekNumber}
              </p>
            </div>
          </div>

          {/* Submission / grade */}
          {isSubmitted && assignment.studentSubmission && (
            <div
              className={`rounded-2xl p-4 border-2 ${
                isGraded
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle
                  className={`w-5 h-5 ${
                    isGraded ? "text-emerald-600" : "text-slate-500"
                  }`}
                />
                <p
                  className={`text-sm font-bold ${
                    isGraded ? "text-emerald-950" : "text-slate-900"
                  }`}
                >
                  {isGraded ? "Graded" : "Submitted — awaiting grade"}
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Submitted</span>
                  <span className="font-semibold text-slate-900">
                    {fmtDateTime(assignment.studentSubmission.submittedAt)}
                  </span>
                </div>
                {assignment.studentSubmission.fileName && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">File</span>
                    <span className="font-mono text-slate-900 truncate max-w-[60%] text-right">
                      {assignment.studentSubmission.fileName}
                    </span>
                  </div>
                )}
                {isGraded && (
                  <div className="flex items-center justify-between pt-2 mt-2 border-t border-emerald-200">
                    <span className="text-emerald-800 font-medium">Score</span>
                    <span className="text-lg font-bold text-emerald-900">
                      {assignment.studentSubmission.score} /{" "}
                      {assignment.maxScore}
                    </span>
                  </div>
                )}
              </div>

              {isGraded && assignment.studentSubmission.feedback && (
                <div className="mt-3 pt-3 border-t border-emerald-200">
                  <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-800 mb-1.5 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    Instructor Feedback
                  </p>
                  <p className="text-xs text-emerald-900 leading-relaxed">
                    {assignment.studentSubmission.feedback}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* CTA */}
          {!isSubmitted && (
            <button
              onClick={onSubmit}
              className="w-full bg-[#691C33] hover:bg-[#8A2B4A] text-white py-3.5 rounded-xl font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <Upload className="w-4 h-4" />
              Submit Assignment
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {isSubmitted && (
            <button
              onClick={onClose}
              className="w-full bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 py-3 rounded-xl font-semibold text-sm transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// SUBMIT MODAL
// ─────────────────────────────────────────────────────────────
function SubmitAssignmentModal({
  assignment,
  onClose,
  onSuccess,
}: {
  assignment: AssignmentView;
  onClose: () => void;
  onSuccess: (fileName: string) => void;
}) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      setError("File must be under 15 MB");
      return;
    }
    setFileName(file.name);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!fileName) {
      setError("Please attach a file before submitting");
      return;
    }
    setSubmitting(true);
    setError(null);

    // TODO: replace with
    //   POST /api/students/{studentId}/assignments/{assignmentId}/submit
    // with FormData containing the file + notes.
    await new Promise((r) => setTimeout(r, 1200));

    setSubmitting(false);
    onSuccess(fileName);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={() => !submitting && onClose()}
    >
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl [color-scheme:light]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Submit Assignment
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                {assignment.title}
              </p>
            </div>
            <button
              onClick={() => !submitting && onClose()}
              disabled={submitting}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center disabled:opacity-50"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Drop zone */}
          <label
            htmlFor="assignment-file"
            className={`block w-full rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
              fileName
                ? "border-emerald-300 bg-emerald-50"
                : "border-slate-300 bg-slate-50 hover:border-[#691C33]/50 hover:bg-[#691C33]/5"
            }`}
          >
            <input
              id="assignment-file"
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              onChange={handleFile}
              className="sr-only"
              disabled={submitting}
            />
            {fileName ? (
              <>
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-emerald-900 truncate">
                  {fileName}
                </p>
                <p className="text-xs text-emerald-700 mt-1">Tap to replace</p>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700">
                  Click or tap to attach
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  PDF, Word, PNG, or JPG · max 15 MB
                </p>
              </>
            )}
          </label>

          {/* Notes */}
          <div className="mt-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Notes for instructor{" "}
              <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Anything your instructor should know about this submission…"
              className="w-full px-3.5 py-2.5 text-sm text-slate-900 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#691C33]/20 focus:border-[#691C33] outline-none transition-all resize-none placeholder:text-slate-400"
              disabled={submitting}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-2.5 mt-3 text-sm text-red-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting || !fileName}
            className="w-full mt-4 bg-[#691C33] hover:bg-[#8A2B4A] text-white py-3.5 rounded-xl font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PANEL
// ─────────────────────────────────────────────────────────────
type FilterKey = "all" | "pending" | "submitted" | "graded";

export default function AssignmentsPanel() {
  const { user } = useDashboard();
  const student = user?.role === UserRole.STUDENT ? (user as Student) : null;

  const [filter, setFilter] = useState<FilterKey>("all");
  const [selected, setSelected] = useState<AssignmentView | null>(null);
  const [submitting, setSubmitting] = useState<AssignmentView | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set());

  const grades = (student?.grades || {}) as Record<string, number>;

  const assignments = useMemo(() => {
    if (!student) return [];
    return buildAssignments(student.deliveryFormat, grades);
  }, [student, grades]);

  // Overlay freshly submitted assignments with a synthetic submission state
  const decorated = useMemo(
    () =>
      assignments.map((a) => {
        if (submittedIds.has(a.id) && !a.studentSubmission) {
          return {
            ...a,
            studentSubmission: {
              submittedAt: new Date().toISOString(),
              fileName: "just-submitted.pdf",
            },
          } as AssignmentView;
        }
        return a;
      }),
    [assignments, submittedIds],
  );

  const stats = useMemo(() => {
    let total = decorated.length;
    let submitted = 0;
    let graded = 0;
    let overdue = 0;
    for (const a of decorated) {
      const s = getAssignmentState(a);
      if (s === "submitted" || s === "graded") submitted++;
      if (s === "graded") graded++;
      if (s === "overdue") overdue++;
    }
    return { total, submitted, graded, overdue };
  }, [decorated]);

  const filtered = useMemo(() => {
    if (filter === "all") return decorated;
    if (filter === "pending")
      return decorated.filter((a) =>
        ["upcoming", "due_soon", "overdue"].includes(getAssignmentState(a)),
      );
    if (filter === "submitted")
      return decorated.filter((a) =>
        ["submitted", "graded"].includes(getAssignmentState(a)),
      );
    if (filter === "graded")
      return decorated.filter((a) => getAssignmentState(a) === "graded");
    return decorated;
  }, [decorated, filter]);

  useEffect(() => {
    if (!successBanner) return;
    const t = setTimeout(() => setSuccessBanner(null), 5000);
    return () => clearTimeout(t);
  }, [successBanner]);

  const handleSubmitSuccess = (fileName: string) => {
    if (!submitting) return;
    setSubmittedIds((prev) => new Set(prev).add(submitting.id));
    setSuccessBanner(
      `Submitted "${submitting.title}" — ${fileName} sent to your instructor.`,
    );
    setSubmitting(null);
    setSelected(null);
  };

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-full bg-[#691C33]/5 flex items-center justify-center mx-auto mb-3">
            <ClipboardList className="w-7 h-7 text-[#691C33]/60" />
          </div>
          <p className="text-sm text-slate-600">
            Assignments are available for enrolled students only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-4">
      {/* Success banner */}
      <AnimatePresence>
        {successBanner && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl p-4 bg-emerald-50 border-2 border-emerald-300 flex items-start gap-3"
          >
            <CheckCircle className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-950 flex-1 font-medium">
              {successBanner}
            </p>
            <button
              onClick={() => setSuccessBanner(null)}
              className="text-emerald-700 hover:text-emerald-900 shrink-0"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile
          label="Total"
          value={stats.total}
          hint="Assignments"
          icon={ClipboardList}
          tone="burgundy"
        />
        <StatTile
          label="Submitted"
          value={stats.submitted}
          hint={`of ${stats.total}`}
          icon={FileText}
          tone="slate"
        />
        <StatTile
          label="Graded"
          value={stats.graded}
          hint={`of ${stats.total}`}
          icon={Award}
          tone="emerald"
        />
        <StatTile
          label="Overdue"
          value={stats.overdue}
          hint={stats.overdue > 0 ? "Action needed" : "All clear"}
          icon={AlertTriangle}
          tone={stats.overdue > 0 ? "red" : "slate"}
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-1.5 flex gap-1 overflow-x-auto">
        {[
          { id: "all" as FilterKey, label: "All", icon: Filter },
          { id: "pending" as FilterKey, label: "Pending", icon: Clock },
          { id: "submitted" as FilterKey, label: "Submitted", icon: FileText },
          { id: "graded" as FilterKey, label: "Graded", icon: Award },
        ].map((f) => {
          const Icon = f.icon;
          const isActive = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex-1 min-w-fit flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-[#691C33] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Assignment list */}
      <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-5 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base md:text-lg font-bold text-slate-900">
            {filter === "all"
              ? "All Assignments"
              : filter === "pending"
                ? "Pending"
                : filter === "submitted"
                  ? "Submitted"
                  : "Graded"}
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            {filtered.length}{" "}
            {filtered.length === 1 ? "assignment" : "assignments"}
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <ClipboardList className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-sm text-slate-600 font-medium">
              {filter === "graded"
                ? "No graded assignments yet"
                : filter === "submitted"
                  ? "No submissions yet"
                  : filter === "pending"
                    ? "All caught up — no pending assignments"
                    : "No assignments yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((a) => {
              const state = getAssignmentState(a);
              const stateStyle = STATE_STYLES[state];
              const days = daysUntil(a.dueDate);
              const dueLabel =
                days === 0
                  ? "Due today"
                  : days > 0
                    ? `Due in ${days}d`
                    : `${Math.abs(days)}d overdue`;

              return (
                <motion.button
                  key={a.id}
                  onClick={() => setSelected(a)}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full text-left p-3.5 md:p-4 border border-slate-100 rounded-xl hover:border-[#691C33]/40 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stateStyle.bg} ${stateStyle.border} border`}
                    >
                      <FileText className={`w-5 h-5 ${stateStyle.text}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-1">
                        <PriorityDot priority={a.priority} />
                        <h3 className="font-semibold text-sm text-slate-900 leading-tight flex-1 line-clamp-1">
                          {a.title}
                        </h3>
                        <span
                          className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${stateStyle.bg} ${stateStyle.text}`}
                        >
                          {stateStyle.label}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 truncate">
                        {a.course} · Week {a.weekNumber}
                      </p>

                      <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                        <span className="inline-flex items-center gap-1 text-slate-500">
                          <Calendar className="w-3 h-3" />
                          {fmtDate(a.dueDate)}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 ${
                            state === "overdue"
                              ? "text-red-600 font-semibold"
                              : state === "due_soon"
                                ? "text-amber-600 font-semibold"
                                : "text-slate-500"
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          {dueLabel}
                        </span>
                        {state === "graded" &&
                          typeof a.studentSubmission?.score === "number" && (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                              <Award className="w-3 h-3" />
                              {a.studentSubmission.score}/{a.maxScore}
                            </span>
                          )}
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#691C33] shrink-0 mt-1 transition-colors" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {selected && (
          <AssignmentDetail
            assignment={selected}
            onClose={() => setSelected(null)}
            onSubmit={() => {
              setSubmitting(selected);
              setSelected(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {submitting && (
          <SubmitAssignmentModal
            assignment={submitting}
            onClose={() => setSubmitting(null)}
            onSuccess={handleSubmitSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
