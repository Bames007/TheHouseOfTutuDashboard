// app/api/assignments/route.ts
import { NextRequest } from "next/server";
import { database, ref, get, set } from "@/app/lib/firebase";
import { apiError, apiOk, getSessionUser } from "@/app/lib/apiHelpers";
import { AssignmentRecord } from "@/app/type/database";

export const runtime = "nodejs";

function isAdmin(role?: string) {
  return String(role || "").toLowerCase() === "admin";
}

export async function GET(request: NextRequest) {
  const session = getSessionUser(request);
  if (!session) return apiError("Unauthorized", 401);

  try {
    const snap = await get(ref(database, "assignments"));
    if (!snap.exists()) return apiOk<AssignmentRecord[]>([]);

    const list = Object.values(snap.val() as Record<string, AssignmentRecord>);
    list.sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
    );
    return apiOk(list);
  } catch (err: any) {
    console.error("[assignments] GET error:", err);
    return apiError(err?.message || "Failed to load assignments", 500);
  }
}

export async function POST(request: NextRequest) {
  const session = getSessionUser(request);
  if (!session || !isAdmin(session.role)) return apiError("Unauthorized", 401);

  const body = await request.json().catch(() => null);
  if (!body) return apiError("Invalid JSON body");

  const required = ["title", "course", "dueDate", "maxScore"];
  for (const key of required) {
    if (body[key] === undefined || body[key] === null || body[key] === "") {
      return apiError(`${key} is required`);
    }
  }

  try {
    const id = `asg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const assignment: AssignmentRecord = {
      id,
      title: body.title,
      description: body.description || "",
      course: body.course,
      program: body.program || "",
      dueDate: body.dueDate,
      maxScore: Number(body.maxScore) || 100,
      createdAt: new Date().toISOString(),
      createdBy: session.id,
      submissions: {},
    };
    await set(ref(database, `assignments/${id}`), assignment);
    return apiOk(assignment);
  } catch (err: any) {
    console.error("[assignments] POST error:", err);
    return apiError(err?.message || "Failed to create assignment", 500);
  }
}
