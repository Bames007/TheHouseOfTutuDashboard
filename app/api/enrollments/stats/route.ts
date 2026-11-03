// import { NextRequest, NextResponse } from "next/server";
// import { database } from "@/app/lib/firebase";
// import { ref, get } from "firebase/database";

// export async function GET(request: NextRequest) {
//   try {
//     console.log("GET /api/enrollments/stats called");

//     if (!database) {
//       console.error("Firebase database is not initialized");
//       return NextResponse.json(
//         {
//           success: false,
//           message: "Database not configured",
//           error: "Firebase database is not initialized",
//         },
//         { status: 500 }
//       );
//     }

//     const enrollmentsRef = ref(database, "enrollments");
//     const snapshot = await get(enrollmentsRef);

//     if (!snapshot.exists()) {
//       console.log("No data found for statistics");
//       return NextResponse.json({
//         success: true,
//         stats: {
//           total: 0,
//           byStatus: {},
//           byProgram: {},
//           recentGrowth: 0,
//           revenue: 0,
//           monthlyTrend: [],
//         },
//       });
//     }

//     const enrollments: any[] = [];
//     snapshot.forEach((childSnapshot) => {
//       const enrollment = childSnapshot.val();
//       enrollments.push(enrollment);
//     });

//     console.log(`Calculating stats for ${enrollments.length} enrollments`);

//     // Calculate statistics
//     const total = enrollments.length;

//     // Group by status
//     const byStatus: Record<string, number> = {};
//     enrollments.forEach((enrollment) => {
//       const status = enrollment.status || "pending";
//       byStatus[status] = (byStatus[status] || 0) + 1;
//     });

//     // Group by program
//     const byProgram: Record<string, number> = {};
//     enrollments.forEach((enrollment) => {
//       const program = enrollment.program || "Unknown";
//       byProgram[program] = (byProgram[program] || 0) + 1;
//     });

//     // Calculate recent growth (last 7 days)
//     const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
//     const recentEnrollments = enrollments.filter((e) => {
//       try {
//         const date = new Date(e.submissionDate || e.createdAt || 0);
//         return date.getTime() > sevenDaysAgo;
//       } catch {
//         return false;
//       }
//     });
//     const recentGrowth = recentEnrollments.length;

//     // Calculate total revenue
//     const revenue = enrollments.reduce((sum, enrollment) => {
//       return sum + (parseFloat(enrollment.totalAmount) || 0);
//     }, 0);

//     // Calculate monthly trend (last 6 months)
//     const monthlyTrend = calculateMonthlyTrend(enrollments);

//     return NextResponse.json({
//       success: true,
//       stats: {
//         total,
//         byStatus,
//         byProgram,
//         recentGrowth,
//         revenue,
//         monthlyTrend,
//       },
//     });
//   } catch (error: any) {
//     console.error("Error fetching stats:", error);
//     return NextResponse.json(
//       {
//         success: false,
//         message: "Failed to fetch statistics",
//         error: error.message,
//         stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
//       },
//       { status: 500 }
//     );
//   }
// }

// function calculateMonthlyTrend(
//   enrollments: any[]
// ): { month: string; count: number }[] {
//   const months: Record<string, number> = {};

//   enrollments.forEach((enrollment) => {
//     try {
//       if (enrollment.submissionDate || enrollment.createdAt) {
//         const date = new Date(
//           enrollment.submissionDate || enrollment.createdAt
//         );
//         const monthYear = `${date.getFullYear()}-${String(
//           date.getMonth() + 1
//         ).padStart(2, "0")}`;
//         months[monthYear] = (months[monthYear] || 0) + 1;
//       }
//     } catch {
//       // Skip invalid dates
//     }
//   });

//   // Get last 6 months
//   const result = [];
//   const today = new Date();

//   for (let i = 5; i >= 0; i--) {
//     const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
//     const monthYear = `${date.getFullYear()}-${String(
//       date.getMonth() + 1
//     ).padStart(2, "0")}`;
//     result.push({
//       month: date.toLocaleString("default", { month: "short" }),
//       count: months[monthYear] || 0,
//     });
//   }

//   return result;
// }

// app/api/stats/route.ts
import { NextRequest } from "next/server";
import { database, ref, get } from "@/app/lib/firebase";
import { apiError, apiOk, requireAdmin } from "@/app/lib/apiHelpers";
import {
  Student,
  EnrollmentRecord,
  Payment,
  DashboardStats,
} from "@/app/type/database";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) return apiError("Unauthorized", 401);

  try {
    const [studentsSnap, enrollmentsSnap] = await Promise.all([
      get(ref(database, "students")),
      get(ref(database, "tutu_academy/enrollments")),
    ]);

    const students: Student[] = studentsSnap.exists()
      ? (Object.values(studentsSnap.val()) as Student[])
      : [];
    const enrollments: EnrollmentRecord[] = enrollmentsSnap.exists()
      ? (Object.values(enrollmentsSnap.val()) as EnrollmentRecord[])
      : [];

    // Aggregate per-student payments
    let totalRevenue = 0;
    let pendingCertificates = 0;
    for (const s of students) {
      const paymentsSnap = await get(
        ref(database, `students/${s.id}/payments`),
      );
      if (paymentsSnap.exists()) {
        const ps = Object.values(paymentsSnap.val()) as Payment[];
        totalRevenue += ps
          .filter((p) => p.status === "successful")
          .reduce((sum, p) => sum + p.amount, 0);
      }
      if (s.certificateRequested && s.certificateStatus === "pending") {
        pendingCertificates++;
      }
    }

    const stats: DashboardStats = {
      totalStudents: students.length,
      activeStudents: students.filter((s) => s.status === "active").length,
      awaitingPaymentStudents: students.filter(
        (s) => s.status === "awaiting_payment",
      ).length,
      totalPrograms: new Set(students.map((s) => s.program)).size,
      ongoingClasses: 0, // wire to `classes/` once you track them
      pendingCertificates,
      totalRevenue,
      attendanceRate:
        students.length > 0
          ? Math.round(
              (students.reduce((a, s) => a + (s.attendanceScore ?? 0), 0) /
                (students.length * 100)) *
                100,
            )
          : 0,
      assignmentCompletionRate:
        students.length > 0
          ? Math.round(
              (students.reduce(
                (a, s) =>
                  a +
                  (s.totalAssignments
                    ? (s.assignmentsCompleted ?? 0) / s.totalAssignments
                    : 0),
                0,
              ) /
                students.length) *
                100,
            )
          : 0,
    };

    return apiOk(stats);
  } catch (err: any) {
    console.error("[stats] error:", err);
    return apiError(err?.message || "Failed to load stats", 500);
  }
}
