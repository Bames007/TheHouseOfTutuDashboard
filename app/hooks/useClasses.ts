// app/hooks/useClasses.ts
"use client";
import { useApi } from "./useApi";
import type { ClassRecord } from "@/app/type/database";

export function useClasses() {
  return useApi<ClassRecord[]>("/api/classes");
}
