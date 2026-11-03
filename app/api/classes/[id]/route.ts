// app/api/classes/[id]/route.ts
import { NextRequest } from "next/server";
import { database, ref, get, update, remove } from "@/app/lib/firebase";
import { apiError, apiOk, getSessionUser } from "@/app/lib/apiHelpers";
import { ClassRecord } from "@/app/type/database";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

function isAdmin(role?: string) {
  return String(role || "").toLowerCase() === "admin";
}

export async function GET(request: NextRequest, { params }: Params) {
  const session = getSessionUser(request);
  if (!session) return apiError("Unauthorized", 401);

  const { id } = await params;
  const snap = await get(ref(database, `classes/${id}`));
  if (!snap.exists()) return apiError("Class not found", 404);
  return apiOk(snap.val() as ClassRecord);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = getSessionUser(request);
  if (!session || !isAdmin(session.role)) return apiError("Unauthorized", 401);

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return apiError("Invalid JSON body");

  const allowed = [
    "title",
    "description",
    "program",
    "date",
    "startTime",
    "endTime",
    "instructor",
    "location",
    "materials",
    "recordingUrl",
  ];
  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) patch[key] = body[key];
  }
  if (Object.keys(patch).length === 0) return apiError("No fields to update");

  const clsRef = ref(database, `classes/${id}`);
  const snap = await get(clsRef);
  if (!snap.exists()) return apiError("Class not found", 404);

  await update(clsRef, patch);
  return apiOk({ updated: Object.keys(patch) });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const session = getSessionUser(request);
  if (!session || !isAdmin(session.role)) return apiError("Unauthorized", 401);

  const { id } = await params;
  const clsRef = ref(database, `classes/${id}`);
  const snap = await get(clsRef);
  if (!snap.exists()) return apiError("Class not found", 404);

  await remove(clsRef);
  return apiOk({ deleted: id });
}
