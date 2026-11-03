// app/hooks/useStudents.ts
"use client";
import { useApi } from "./useApi";
import type { Student } from "@/app/type/database";

export function useStudents(options: { q?: string; status?: string } = {}) {
  const params = new URLSearchParams();
  if (options.q) params.set("q", options.q);
  if (options.status) params.set("status", options.status);
  const qs = params.toString();
  return useApi<Student[]>(`/api/students${qs ? `?${qs}` : ""}`);
}
