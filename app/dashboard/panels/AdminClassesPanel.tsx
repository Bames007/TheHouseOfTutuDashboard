// app/dashboard/panels/AdminClassesPanel.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  ClipboardList,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  Clock,
  MapPin,
  User as UserIcon,
  Loader2,
  AlertCircle,
  X,
  Save,
  FileText,
  Award,
} from "lucide-react";
import { useDashboard } from "../DashboardContext";
import { ClassRecord, AssignmentRecord } from "@/app/type/database";

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function fmtDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-NG", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function isAdminRole(role?: string) {
  return String(role || "").toLowerCase() === "admin";
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  rows,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {rows ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#691C33]/20 focus:border-[#691C33] outline-none transition-all resize-none placeholder:text-slate-400"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#691C33]/20 focus:border-[#691C33] outline-none transition-all placeholder:text-slate-400"
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// CLASS FORM MODAL
// ─────────────────────────────────────────────────────────────
function ClassFormModal({
  initial,
  onClose,
  onSaved,
}: {
  initial?: ClassRecord | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: initial?.title || "",
    description: initial?.description || "",
    program: initial?.program || "",
    date: initial?.date || "",
    startTime: initial?.startTime || "10:00",
    endTime: initial?.endTime || "13:00",
    instructor: initial?.instructor || "",
    location: initial?.location || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!form.title.trim() || !form.date || !form.instructor.trim()) {
      setError("Title, date, and instructor are required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const url = initial ? `/api/classes/${initial.id}` : "/api/classes";
      const method = initial ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(form),
      });
      const body = await res.json();
      if (!body.success) throw new Error(body.error || "Save failed");
      onSaved();
    } catch (err: any) {
      setError(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={() => !saving && onClose()}
    >
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl max-h-[92vh] overflow-y-auto [color-scheme:light]"
      >
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-slate-200 z-10">
          <h2 className="text-base font-bold text-slate-900">
            {initial ? "Edit Class" : "New Class"}
          </h2>
          <button
            onClick={() => !saving && onClose()}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-3.5">
          <Field
            label="Title"
            value={form.title}
            onChange={(v) => setForm({ ...form, title: v })}
            placeholder="e.g. Foundations of Perfumery — Session 1"
            required
          />
          <Field
            label="Program"
            value={form.program}
            onChange={(v) => setForm({ ...form, program: v })}
            placeholder="Art of Perfumery — 6 weeks"
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Date"
              type="date"
              value={form.date}
              onChange={(v) => setForm({ ...form, date: v })}
              required
            />
            <Field
              label="Instructor"
              value={form.instructor}
              onChange={(v) => setForm({ ...form, instructor: v })}
              placeholder="Instructor name"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Start Time"
              type="time"
              value={form.startTime}
              onChange={(v) => setForm({ ...form, startTime: v })}
            />
            <Field
              label="End Time"
              type="time"
              value={form.endTime}
              onChange={(v) => setForm({ ...form, endTime: v })}
            />
          </div>
          <Field
            label="Location"
            value={form.location}
            onChange={(v) => setForm({ ...form, location: v })}
            placeholder="Abuja Studio / Zoom"
          />
          <Field
            label="Description"
            value={form.description}
            onChange={(v) => setForm({ ...form, description: v })}
            placeholder="What will be covered…"
            rows={3}
          />

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-2.5 text-sm text-red-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => !saving && onClose()}
              disabled={saving}
              className="flex-1 border border-slate-300 text-slate-700 py-3 rounded-xl font-semibold text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-[#691C33] hover:bg-[#8A2B4A] text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// ASSIGNMENT FORM MODAL
// ─────────────────────────────────────────────────────────────
function AssignmentFormModal({
  initial,
  onClose,
  onSaved,
}: {
  initial?: AssignmentRecord | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: initial?.title || "",
    description: initial?.description || "",
    course: initial?.course || "",
    program: initial?.program || "",
    dueDate: initial?.dueDate || "",
    maxScore: initial?.maxScore || 100,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!form.title.trim() || !form.course.trim() || !form.dueDate) {
      setError("Title, course, and due date are required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const url = initial
        ? `/api/assignments/${initial.id}`
        : "/api/assignments";
      const method = initial ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(form),
      });
      const body = await res.json();
      if (!body.success) throw new Error(body.error || "Save failed");
      onSaved();
    } catch (err: any) {
      setError(err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={() => !saving && onClose()}
    >
      <motion.div
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-2xl max-h-[92vh] overflow-y-auto [color-scheme:light]"
      >
        <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-slate-200 z-10">
          <h2 className="text-base font-bold text-slate-900">
            {initial ? "Edit Assignment" : "New Assignment"}
          </h2>
          <button
            onClick={() => !saving && onClose()}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-3.5">
          <Field
            label="Title"
            value={form.title}
            onChange={(v) => setForm({ ...form, title: v })}
            placeholder="e.g. Scent Composition Project"
            required
          />
          <Field
            label="Course (module title)"
            value={form.course}
            onChange={(v) => setForm({ ...form, course: v })}
            placeholder="e.g. Foundations of Perfumery"
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Due Date"
              type="date"
              value={form.dueDate}
              onChange={(v) => setForm({ ...form, dueDate: v })}
              required
            />
            <Field
              label="Max Score"
              type="number"
              value={String(form.maxScore)}
              onChange={(v) => setForm({ ...form, maxScore: Number(v) || 100 })}
            />
          </div>
          <Field
            label="Description"
            value={form.description}
            onChange={(v) => setForm({ ...form, description: v })}
            placeholder="What students should submit…"
            rows={3}
          />

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-2.5 text-sm text-red-800">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => !saving && onClose()}
              disabled={saving}
              className="flex-1 border border-slate-300 text-slate-700 py-3 rounded-xl font-semibold text-sm hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-[#691C33] hover:bg-[#8A2B4A] text-white py-3 rounded-xl font-semibold text-sm disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PANEL
// ─────────────────────────────────────────────────────────────
type Tab = "classes" | "assignments";

export default function AdminClassesPanel() {
  const { user } = useDashboard();
  const isAdmin = isAdminRole(user?.role);

  const [tab, setTab] = useState<Tab>("classes");
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [classForm, setClassForm] = useState<ClassRecord | null | undefined>(
    undefined,
  );
  const [asgForm, setAsgForm] = useState<AssignmentRecord | null | undefined>(
    undefined,
  );

  const load = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch("/api/classes", { credentials: "same-origin" }).then((r) =>
        r.json(),
      ),
      fetch("/api/assignments", { credentials: "same-origin" }).then((r) =>
        r.json(),
      ),
    ])
      .then(([c, a]) => {
        if (c.success) setClasses(c.data || []);
        if (a.success) setAssignments(a.data || []);
      })
      .catch((e) => setError(e?.message || "Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  const deleteClass = async (id: string) => {
    if (!confirm("Delete this class?")) return;
    const res = await fetch(`/api/classes/${id}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    const body = await res.json();
    if (body.success) load();
  };

  const deleteAssignment = async (id: string) => {
    if (!confirm("Delete this assignment?")) return;
    const res = await fetch(`/api/assignments/${id}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    const body = await res.json();
    if (body.success) load();
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-600">Admin access required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-1.5 flex gap-1">
        {[
          {
            id: "classes" as Tab,
            label: "Classes",
            icon: BookOpen,
            count: classes.length,
          },
          {
            id: "assignments" as Tab,
            label: "Assignments",
            icon: ClipboardList,
            count: assignments.length,
          },
        ].map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs md:text-sm font-semibold transition-all ${
                active
                  ? "bg-[#691C33] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
              <span
                className={`text-[10px] font-bold rounded-full min-w-[18px] h-4 px-1 flex items-center justify-center ${
                  active
                    ? "bg-white text-[#691C33]"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Add button */}
      <button
        onClick={() =>
          tab === "classes" ? setClassForm(null) : setAsgForm(null)
        }
        className="w-full bg-[#691C33] hover:bg-[#8A2B4A] text-white py-3 rounded-xl font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors"
      >
        <Plus className="w-4 h-4" />
        New {tab === "classes" ? "Class" : "Assignment"}
      </button>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-[#691C33] animate-spin" />
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl border border-rose-100 p-6 text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-700">{error}</p>
          <button
            onClick={load}
            className="mt-3 bg-[#691C33] text-white px-4 py-2 rounded-lg text-sm font-semibold"
          >
            Retry
          </button>
        </div>
      ) : tab === "classes" ? (
        <div className="space-y-2">
          {classes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-rose-100 p-12 text-center">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">
                No classes yet
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Create your first class to get started.
              </p>
            </div>
          ) : (
            classes.map((c) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-rose-100 shadow-sm p-4"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#691C33]/10 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-[#691C33]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 text-sm">
                      {c.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {c.program || "General"}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => setClassForm(c)}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                      aria-label="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteClass(c.id)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {fmtDate(c.date)}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {c.startTime}–{c.endTime}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                    {c.instructor}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {c.location || "—"}
                  </div>
                </div>
                {c.description && (
                  <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 line-clamp-2">
                    {c.description}
                  </p>
                )}
              </motion.div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {assignments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-rose-100 p-12 text-center">
              <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">
                No assignments yet
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Create your first assignment to get started.
              </p>
            </div>
          ) : (
            assignments.map((a) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-rose-100 shadow-sm p-4"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#691C33]/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-[#691C33]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 text-sm">
                      {a.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {a.course}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => setAsgForm(a)}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
                      aria-label="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteAssignment(a.id)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {fmtDate(a.dueDate)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-slate-400" />
                    {a.maxScore} pts
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    {Object.keys(a.submissions || {}).length} submissions
                  </span>
                </div>
                {a.description && (
                  <p className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 line-clamp-2">
                    {a.description}
                  </p>
                )}
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {classForm !== undefined && (
          <ClassFormModal
            initial={classForm}
            onClose={() => setClassForm(undefined)}
            onSaved={() => {
              setClassForm(undefined);
              load();
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {asgForm !== undefined && (
          <AssignmentFormModal
            initial={asgForm}
            onClose={() => setAsgForm(undefined)}
            onSaved={() => {
              setAsgForm(undefined);
              load();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Local Users icon import (avoid unused warning)
import { Users } from "lucide-react";
