// app/hooks/useStudent.ts
"use client";
import { useApi } from "./useApi";
import type { Student } from "@/app/type/database";

export function useStudent(id: string | null | undefined) {
  return useApi<Student>(id ? `/api/students/${id}` : null, { skip: !id });
}
