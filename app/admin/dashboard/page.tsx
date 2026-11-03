"use client";

import DashboardLayout from "@/app/dashboard/DashboardLayout";
import PanelRenderer from "@/app/dashboard/PanelRenderer";

export default function AdminDashboardPage() {
  return (
    <DashboardLayout>
      <PanelRenderer />
    </DashboardLayout>
  );
}
