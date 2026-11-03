// app/hooks/useDashboardStats.ts
"use client";
import { useApi } from "./useApi";
import type { DashboardStats } from "@/app/type/database";

export function useDashboardStats() {
  return useApi<DashboardStats>("/api/stats");
}
