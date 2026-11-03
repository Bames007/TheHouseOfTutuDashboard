// app/dashboard/panels/AdminGradesPanel.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Award,
  Users,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  X,
  BookOpen,
} from "lucide-react";
import { useDashboard } from "../DashboardContext";
import { Student, DeliveryFormat } from "@/app/type/database";

// Mirror of the curriculum used in the Courses / Grades student panels
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

function modulesFor(format?: DeliveryFormat): string[] {
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

function initials(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function isAdminRole(role?: string) {
  return String(role || "").toLowerCase() === "admin";
}

export default function AdminGradesPanel() {
  const { user } = useDashboard();
  const isAdmin = isAdminRole(user?.role);

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Student | null>(null);

  // Edit state
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [attendance, setAttendance] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saveErr, setSaveErr] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;
    setLoading(true);
    fetch("/api/students", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((body) => {
        if (body.success) setStudents(body.data || []);
      })
      .finally(() => setLoading(false));
  }, [isAdmin]);

  useEffect(() => {
    if (!selected) return;
    const grades = (selected.grades || {}) as Record<string, number>;
    const mods = modulesFor(selected.deliveryFormat);
    const initial: Record<string, string> = {};
    for (const m of mods) {
      initial[m] = grades[m] !== undefined ? String(grades[m]) : "";
    }
    setEdited(initial);
    setAttendance(
      typeof selected.attendanceScore === "number"
        ? String(selected.attendanceScore)
        : "",
    );
    setSaveMsg(null);
    setSaveErr(null);
  }, [selected]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return students;
    return students.filter(
      (s) =>
        s.fullName?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.id?.toLowerCase().includes(q),
    );
  }, [students, search]);

  const handleSave = async () => {
    if (!selected) return;
    const studentId = selected.studentId ?? selected.id;

    // Build grades map with only valid numeric values
    const grades: Record<string, number> = {};
    for (const [title, raw] of Object.entries(edited)) {
      if (raw === "" || raw === undefined) continue;
      const n = Number(raw);
      if (!isNaN(n) && n >= 0 && n <= 100) {
        grades[title] = Math.round(n);
      }
    }

    const payload: Record<string, any> = { grades };
    if (attendance !== "") {
      const n = Number(attendance);
      if (!isNaN(n) && n >= 0 && n <= 100) {
        payload.attendanceScore = Math.round(n);
      }
    }

    setSaving(true);
    setSaveMsg(null);
    setSaveErr(null);
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!body.success) throw new Error(body.error || "Save failed");
      setSaveMsg("Grades saved successfully");
      // Update the local list and selected snapshot
      const updated: Student = {
        ...selected,
        grades,
        attendanceScore:
          payload.attendanceScore !== undefined
            ? payload.attendanceScore
            : selected.attendanceScore,
      };
      setSelected(updated);
      setStudents((prev) =>
        prev.map((s) => ((s.studentId ?? s.id) === studentId ? updated : s)),
      );
    } catch (err: any) {
      setSaveErr(err?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <Award className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-600">Admin access required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pb-4">
      {/* Student picker */}
      <div className="lg:col-span-1 bg-white rounded-2xl border border-rose-100 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-[#691C33]" />
          <h2 className="text-sm font-bold text-slate-900">Students</h2>
          <span className="ml-auto text-xs text-slate-500 font-medium">
            {filtered.length}
          </span>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-[#691C33]/30 outline-none text-sm text-slate-900 placeholder:text-slate-500"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-[#691C33] animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">
            No students found
          </p>
        ) : (
          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
            {filtered.map((s) => {
              const sid = s.studentId ?? s.id;
              const selId = selected?.studentId ?? selected?.id;
              const active = sid === selId;
              return (
                <button
                  key={sid}
                  onClick={() => setSelected(s)}
                  className={`w-full text-left p-2.5 rounded-xl transition-colors ${
                    active
                      ? "bg-[#691C33] text-white"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-[#691C33]/10 text-[#691C33]"
                      }`}
                    >
                      {initials(s.fullName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate">
                        {s.fullName}
                      </p>
                      <p
                        className={`text-[10px] truncate ${
                          active ? "text-white/70" : "text-slate-500"
                        }`}
                      >
                        {s.id}
                      </p>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 ${
                        active ? "text-white/70" : "text-slate-300"
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Grade editor */}
      <div className="lg:col-span-2">
        {!selected ? (
          <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-12 text-center">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">
              Select a student to edit grades
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Their modules will appear here.
            </p>
          </div>
        ) : (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-rose-100 shadow-sm p-5"
          >
            <div className="flex items-start justify-between gap-3 mb-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-[#691C33]/10 flex items-center justify-center shrink-0 text-xs font-bold text-[#691C33]">
                  {initials(selected.fullName)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {selected.fullName}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {selected.program}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center shrink-0"
                aria-label="Close"
              >
                <X size={16} className="text-slate-500" />
              </button>
            </div>

            {saveMsg && (
              <div className="mb-3 rounded-xl p-2.5 bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {saveMsg}
              </div>
            )}
            {saveErr && (
              <div className="mb-3 rounded-xl p-2.5 bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {saveErr}
              </div>
            )}

            <div className="space-y-3 mb-4">
              {Object.entries(edited).map(([title, value]) => (
                <div key={title}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 truncate flex-1 pr-2">
                      {title}
                    </label>
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={value}
                        onChange={(e) =>
                          setEdited({ ...edited, [title]: e.target.value })
                        }
                        placeholder="—"
                        className="w-16 px-2 py-1 text-xs text-right border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#691C33]/20 focus:border-[#691C33] outline-none"
                      />
                      <span className="text-xs text-slate-500 font-medium">
                        %
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#691C33] rounded-full transition-all"
                      style={{
                        width: `${
                          value === ""
                            ? 0
                            : Math.min(100, Math.max(0, Number(value) || 0))
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Attendance (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={attendance}
                onChange={(e) => setAttendance(e.target.value)}
                placeholder="—"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#691C33]/20 focus:border-[#691C33] outline-none"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-[#691C33] hover:bg-[#8A2B4A] text-white py-3 rounded-xl font-semibold text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Grades
                </>
              )}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
