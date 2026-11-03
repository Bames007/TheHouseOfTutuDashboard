// app/api/students/route.ts
import { NextRequest } from "next/server";
import { database, ref, get } from "@/app/lib/firebase";
import { apiError, apiOk, requireAdmin } from "@/app/lib/apiHelpers";
import { Student } from "@/app/type/database";

export const runtime = "nodejs";

/**
 * GET /api/students
 * Admin only. Returns all student records.
 * Query params:
 *   ?status=active|awaiting_payment|…    filter by status
 *   ?q=PERF001|email                     search by id, email, or fullName
 */
export async function GET(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) return apiError("Unauthorized", 401);

  try {
    const snap = await get(ref(database, "students"));
    if (!snap.exists()) return apiOk<Student[]>([]);

    const raw = snap.val() as Record<string, Student>;
    let students = Object.values(raw).map((s) => ({
      ...s,
      studentId: s.studentId ?? s.id,
    }));

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const q = url.searchParams.get("q")?.toLowerCase().trim();

    if (status) {
      students = students.filter((s) => s.status === status);
    }
    if (q) {
      students = students.filter(
        (s) =>
          s.id?.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          s.fullName?.toLowerCase().includes(q),
      );
    }

    students.sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime(),
    );

    return apiOk(students);
  } catch (err: any) {
    console.error("[students] list error:", err);
    return apiError(err?.message || "Failed to load students", 500);
  }
}
