// app/api/students/[id]/payments/[paymentId]/route.ts
import { NextRequest } from "next/server";
import { database, ref, get, update } from "@/app/lib/firebase";
import { apiError, apiOk, requireAdmin } from "@/app/lib/apiHelpers";
import { Payment, Student } from "@/app/type/database";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string; paymentId: string }> };

/** PATCH — admin updates payment status (verify / reject). */
export async function PATCH(request: NextRequest, { params }: Params) {
  const admin = requireAdmin(request);
  if (!admin) return apiError("Unauthorized", 401);

  const { id: studentId, paymentId } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return apiError("Invalid JSON body");

  const allowedStatuses = ["successful", "pending", "failed", "refunded"];
  if (!body.status || !allowedStatuses.includes(body.status)) {
    return apiError(`status must be one of: ${allowedStatuses.join(", ")}`);
  }

  const paymentRef = ref(
    database,
    `students/${studentId}/payments/${paymentId}`,
  );
  const snap = await get(paymentRef);
  if (!snap.exists()) return apiError("Payment not found", 404);

  const payment = snap.val() as Payment;
  const patch: Record<string, unknown> = {
    status: body.status,
    note: body.note ?? payment.note ?? "",
    verifiedAt:
      body.status === "successful" ? new Date().toISOString() : undefined,
    verifiedBy: body.status === "successful" ? admin.id : undefined,
  };
  if (patch.verifiedAt === undefined) delete patch.verifiedAt;
  if (patch.verifiedBy === undefined) delete patch.verifiedBy;

  await update(paymentRef, patch);

  // Recalculate totals and update student status
  const allSnap = await get(ref(database, `students/${studentId}/payments`));
  const allPayments: Payment[] = allSnap.exists()
    ? (Object.values(allSnap.val()) as Payment[])
    : [];

  const paidTotal = allPayments
    .filter((p) => p.status === "successful")
    .reduce((s, p) => s + (p.amount || 0), 0);

  const studentSnap = await get(ref(database, `students/${studentId}`));
  if (!studentSnap.exists()) return apiError("Student not found", 404);
  const student = studentSnap.val() as Student;

  const courseFee = (student as any).courseFee ?? 0;
  const paymentStatus =
    paidTotal <= 0 ? "unpaid" : paidTotal >= courseFee ? "paid" : "partial";
  const newEnrollmentStatus =
    paymentStatus === "paid" ? "active" : student.status;

  await update(ref(database, `students/${studentId}`), {
    totalPaid: paidTotal,
    paymentStatus,
    status: newEnrollmentStatus,
  });

  return apiOk({
    payment: { ...payment, ...patch },
    totals: { paidTotal, paymentStatus },
  });
}
