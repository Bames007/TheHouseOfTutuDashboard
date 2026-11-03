// app/api/students/[id]/payments/route.ts
import { NextRequest } from "next/server";
import { database, ref, get, set } from "@/app/lib/firebase";
import {
  apiError,
  apiOk,
  requireAdmin,
  getSessionUser,
} from "@/app/lib/apiHelpers";
import { Payment, Student } from "@/app/type/database";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/students/:id/payments
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = getSessionUser(request);
  if (!session) return apiError("Unauthorized", 401);

  const isAdmin = session.role === "admin";
  const isSelf = session.id === id;
  if (!isAdmin && !isSelf) return apiError("Forbidden", 403);

  try {
    const snap = await get(ref(database, `students/${id}/payments`));
    if (!snap.exists()) return apiOk<Payment[]>([]);
    const payments = Object.values(snap.val() as Record<string, Payment>);
    payments.sort(
      (a, b) =>
        new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
    );
    return apiOk(payments);
  } catch (err: any) {
    return apiError(err?.message || "Failed to load payments", 500);
  }
}

/**
 * POST /api/students/:id/payments
 * Admins can record any payment. Students can record their own submission
 * with status "pending" (admin verifies later).
 */
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const session = getSessionUser(request);
  if (!session) return apiError("Unauthorized", 401);

  const isAdmin = session.role === "admin";
  const isSelf = session.id === id;
  if (!isAdmin && !isSelf) return apiError("Forbidden", 403);

  const body = await request.json().catch(() => null);
  if (!body) return apiError("Invalid JSON body");

  const required = ["amount", "method", "reference"] as const;
  for (const key of required) {
    if (!body[key]) return apiError(`${key} is required`);
  }

  // Students can only submit pending payments; admins can set any status.
  const status = isAdmin && body.status ? body.status : "pending";

  try {
    const studentSnap = await get(ref(database, `students/${id}`));
    if (!studentSnap.exists()) return apiError("Student not found", 404);
    const student = studentSnap.val() as Student;

    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const payment: Payment = {
      id: paymentId,
      studentId: id,
      studentName: student.fullName,
      amount: Number(body.amount),
      currency: "NGN",
      method: body.method,
      reference: String(body.reference),
      status,
      enrollmentReceipt: student.enrollmentReceipt || "",
      note: body.note || "",
      recordedBy: isAdmin ? session.id : "self",
      recordedAt: new Date().toISOString(),
      verifiedAt:
        isAdmin && status === "successful"
          ? new Date().toISOString()
          : undefined,
      verifiedBy: isAdmin && status === "successful" ? session.id : undefined,
    };

    await set(ref(database, `students/${id}/payments/${paymentId}`), payment);

    // If admin marks successful, recalc totalPaid + paymentStatus.
    if (isAdmin && status === "successful") {
      const sumSnap = await get(ref(database, `students/${id}/payments`));
      const all = sumSnap.exists()
        ? (Object.values(sumSnap.val()) as Payment[])
        : [];
      const paidTotal = all
        .filter((p) => p.status === "successful")
        .reduce((s, p) => s + p.amount, 0);

      const courseFee = (student as any).courseFee ?? 0;
      const paymentStatus =
        paidTotal <= 0 ? "unpaid" : paidTotal >= courseFee ? "paid" : "partial";

      await set(ref(database, `students/${id}/totalPaid`), paidTotal);
      await set(ref(database, `students/${id}/paymentStatus`), paymentStatus);
      if (paymentStatus === "paid") {
        await set(ref(database, `students/${id}/status`), "active");
      }
    }

    return apiOk(payment);
  } catch (err: any) {
    console.error("[payments] POST error:", err);
    return apiError(err?.message || "Failed to record payment", 500);
  }
}
