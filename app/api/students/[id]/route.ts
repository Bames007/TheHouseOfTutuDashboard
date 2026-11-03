// app/api/students/[id]/route.ts
import { NextRequest } from "next/server";
import { database, ref, get, update } from "@/app/lib/firebase";
import { apiError, apiOk, getSessionUser } from "@/app/lib/apiHelpers";
import { Student } from "@/app/type/database";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

// ── Field whitelists ──────────────────────────────────────
// A student may only edit these on their own record.
const SELF_EDITABLE = [
  "phoneNumber",
  "city",
  "country",
  "address",
  "emergencyContact",
  "profileImage",
] as const;

// Only an admin may change these, on any record.
const ADMIN_ONLY = [
  "fullName",
  "status",
  "paymentStatus",
  "batch",
  "program",
  "attendanceScore",
  "assignmentsCompleted",
  "totalAssignments",
  "grades",
  "certificateRequested",
  "certificateStatus",
  "subscription",
] as const;

function isAdminRole(role?: string): boolean {
  return String(role || "").toLowerCase() === "admin";
}

// ─────────────────────────────────────────────────────────────
// GET — student can read themselves; admin can read any
// ─────────────────────────────────────────────────────────────
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = getSessionUser(request);
  if (!session) return apiError("Unauthorized", 401);

  const admin = isAdminRole(session.role);
  const isSelf = session.id === id;
  if (!admin && !isSelf) return apiError("Forbidden", 403);

  try {
    const snap = await get(ref(database, `students/${id}`));
    if (!snap.exists()) return apiError("Student not found", 404);

    const student = snap.val() as Student;
    // Strip credentials before returning
    const safe: Record<string, any> = { ...student };
    delete safe.password;
    delete safe.passwordHash;

    return apiOk({ ...safe, studentId: safe.studentId ?? safe.id });
  } catch (err: any) {
    console.error("[students/:id] GET error:", err);
    return apiError(err?.message || "Failed to load student", 500);
  }
}

// ─────────────────────────────────────────────────────────────
// PATCH — student edits limited fields on self; admin edits any
// ─────────────────────────────────────────────────────────────
export async function PATCH(request: NextRequest, { params }: Params) {
  const session = getSessionUser(request);
  if (!session) return apiError("Unauthorized", 401);

  const { id } = await params;
  const admin = isAdminRole(session.role);
  const isSelf = session.id === id;
  if (!admin && !isSelf) return apiError("Forbidden", 403);

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return apiError("Invalid JSON body");
  }

  const allowed: readonly string[] = admin
    ? [...SELF_EDITABLE, ...ADMIN_ONLY]
    : SELF_EDITABLE;

  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) patch[key] = (body as Record<string, unknown>)[key];
  }

  // Guard against an empty or malicious payload
  if (Object.keys(patch).length === 0) {
    return apiError(
      admin
        ? "No valid fields to update"
        : `Students can only update: ${SELF_EDITABLE.join(", ")}`,
    );
  }

  // Reject credentials even if a client tries to sneak them in
  if ("password" in body || "passwordHash" in body || "role" in body) {
    return apiError("This field cannot be updated through this endpoint", 403);
  }

  patch.updatedAt = new Date().toISOString();

  try {
    const ref_ = ref(database, `students/${id}`);
    const snap = await get(ref_);
    if (!snap.exists()) return apiError("Student not found", 404);

    await update(ref_, patch);

    return apiOk({
      updated: Object.keys(patch).filter((k) => k !== "updatedAt"),
      by: admin ? "admin" : "self",
    });
  } catch (err: any) {
    console.error("[students/:id] PATCH error:", err);
    return apiError(err?.message || "Failed to update student", 500);
  }
}
