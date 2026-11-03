// app/api/enrollments/[id]/route.ts
import { NextRequest } from "next/server";
import { database, ref, get } from "@/app/lib/firebase";
import { apiError, apiOk, requireAdmin } from "@/app/lib/apiHelpers";
import { EnrollmentRecord } from "@/app/type/database";

export const runtime = "nodejs";

// Folder name is `[id]` (Next requires one slug name per level).
// The URL value is still the receipt number — we just alias it back.
type Params = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  const admin = requireAdmin(request);
  if (!admin) return apiError("Unauthorized", 401);

  const { id: receiptNumber } = await params;

  try {
    const snap = await get(
      ref(database, `tutu_academy/enrollments/${receiptNumber}`),
    );
    if (!snap.exists()) return apiError("Enrollment not found", 404);
    return apiOk(snap.val() as EnrollmentRecord);
  } catch (err: any) {
    return apiError(err?.message || "Failed to load enrollment", 500);
  }
}
