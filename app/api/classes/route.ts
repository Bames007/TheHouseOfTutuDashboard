// app/api/classes/route.ts
import { NextRequest } from "next/server";
import { database, ref, get, set } from "@/app/lib/firebase";
import { apiError, apiOk, getSessionUser } from "@/app/lib/apiHelpers";
import { ClassRecord } from "@/app/type/database";

export const runtime = "nodejs";

function isAdmin(role?: string) {
  return String(role || "").toLowerCase() === "admin";
}

/** GET /api/classes — any signed-in user can read; admin only creates */
export async function GET(request: NextRequest) {
  const session = getSessionUser(request);
  if (!session) return apiError("Unauthorized", 401);

  try {
    const snap = await get(ref(database, "classes"));
    if (!snap.exists()) return apiOk<ClassRecord[]>([]);

    const classes = Object.values(snap.val() as Record<string, ClassRecord>);
    classes.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    return apiOk(classes);
  } catch (err: any) {
    console.error("[classes] GET error:", err);
    return apiError(err?.message || "Failed to load classes", 500);
  }
}

/** POST /api/classes — admin only */
export async function POST(request: NextRequest) {
  const session = getSessionUser(request);
  if (!session || !isAdmin(session.role)) return apiError("Unauthorized", 401);

  const body = await request.json().catch(() => null);
  if (!body) return apiError("Invalid JSON body");

  const required = ["title", "date", "startTime", "endTime", "instructor"];
  for (const key of required) {
    if (!body[key] || typeof body[key] !== "string") {
      return apiError(`${key} is required`);
    }
  }

  try {
    const id = `cls_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const cls: ClassRecord = {
      id,
      title: body.title,
      description: body.description || "",
      program: body.program || "",
      date: body.date,
      startTime: body.startTime,
      endTime: body.endTime,
      instructor: body.instructor,
      location: body.location || "",
      materials: Array.isArray(body.materials) ? body.materials : [],
      recordingUrl: body.recordingUrl || "",
      createdAt: new Date().toISOString(),
      createdBy: session.id,
    };
    await set(ref(database, `classes/${id}`), cls);
    return apiOk(cls);
  } catch (err: any) {
    console.error("[classes] POST error:", err);
    return apiError(err?.message || "Failed to create class", 500);
  }
}
