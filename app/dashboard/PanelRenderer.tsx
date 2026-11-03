// app/dashboard/PanelRenderer.tsx
"use client";

import { useDashboard } from "./DashboardContext";
import { motion } from "framer-motion";
import { UserRole } from "../type/database";
import StudentDashboard from "./panels/StudentDashboard";
import AdminDashboard from "./panels/AdminDashboard";
import CoursesPanel from "./panels/CoursesPanel";
import ProfilePanel from "./panels/ProfilePanel";
import PaymentsPanel from "./panels/PaymentPanel";
import AssignmentsPanel from "./panels/AssignmentPanel";
import GradesPanel from "./panels/GradesPanel";

export default function PanelRenderer() {
  const { activePanel, user } = useDashboard();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#691C33] mx-auto" />
          <p className="mt-4 text-gray-600 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  const isStudent = user.role === UserRole.STUDENT;

  const renderPanel = () => {
    switch (activePanel) {
      case "dashboard":
        return isStudent ? <StudentDashboard /> : <AdminDashboard />;
      case "courses":
        return <CoursesPanel />;
      case "profile":
        return <ProfilePanel />;
      case "payments":
        return <PaymentsPanel />;
      case "assignments":
        return <AssignmentsPanel />;
      case "grades":
        return <GradesPanel />;
      // case "schedule":
      //   return <SchedulePanel />;

      // case "messages":
      //   return <MessagesPanel />;
      // case "payments":
      //   return <PaymentsPanel />;
      // case "settings":
      //   return <SettingsPanel />;
      // case "students":
      //   return <StudentsPanel />;
      // case "reports":
      //   return <ReportsPanel />;
      default:
        return isStudent ? <StudentDashboard /> : <AdminDashboard />;
    }
  };

  return (
    <motion.div
      key={activePanel}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="w-full"
    >
      {renderPanel()}
    </motion.div>
  );
}
