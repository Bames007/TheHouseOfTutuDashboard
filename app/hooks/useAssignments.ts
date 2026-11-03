// app/hooks/useAssignments.ts
"use client";
import { useApi } from "./useApi";
import type { AssignmentRecord } from "@/app/type/database";

export function useAssignments() {
  return useApi<AssignmentRecord[]>("/api/assignments");
}