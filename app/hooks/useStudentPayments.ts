// app/hooks/useStudentPayments.ts
"use client";
import { useApi } from "./useApi";
import type { Payment } from "@/app/type/database";

export function useStudentPayments(studentId: string | null | undefined) {
  return useApi<Payment[]>(
    studentId ? `/api/students/${studentId}/payments` : null,
    { skip: !studentId },
  );
}
