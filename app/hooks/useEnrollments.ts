// app/hooks/useEnrollments.ts
"use client";
import { useApi } from "./useApi";
import type { EnrollmentRecord } from "@/app/type/database";

export function useEnrollments(options: { q?: string; status?: string } = {}) {
  const params = new URLSearchParams();
  if (options.q) params.set("q", options.q);
  if (options.status) params.set("status", options.status);
  const qs = params.toString();
  return useApi<EnrollmentRecord[]>(`/api/enrollments${qs ? `?${qs}` : ""}`);
}
