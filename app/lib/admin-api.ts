// app/lib/admin-api.ts
import { ref, get, child, update, set, remove } from "firebase/database";
import { dbRef } from "./firebase";
import {
  DashboardStats,
  Student,
  CertificateRequest,
} from "@/app/type/database";

// ─────────────────────────────────────────────────────────────
// DASHBOARD AGGREGATE
// ─────────────────────────────────────────────────────────────
export async function getAdminDashboardData(): Promise<{
  stats: DashboardStats;
  recentStudents: Student[];
  pendingCertificates: CertificateRequest[];
  upcomingClasses: any[];
}> {
  try {
    const [
      studentsSnapshot,
      certificateSnapshot,
      classesSnapshot,
      paymentsSnapshot,
    ] = await Promise.all([
      get(child(dbRef, "students")),
      get(child(dbRef, "certificateRequests")),
      get(child(dbRef, "classes")),
      get(child(dbRef, "payments")),
    ]);

    const students = studentsSnapshot.val() || {};
    const certificates = certificateSnapshot.val() || {};
    const classes = classesSnapshot.val() || {};
    const payments = paymentsSnapshot.val() || {};

    const totalRevenue = Object.values(payments).reduce(
      (sum: number, payment: any) =>
        sum + (payment.status === "successful" ? payment.amount : 0),
      0,
    );

    // Fill dashboard-only defaults so the UI never renders `undefined`.
    const recentStudents = Object.values(students)
      .sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 5)
      .map((s: any) => ({
        ...s,
        studentId: s.studentId ?? s.id,
        phone: s.phone ?? s.phoneNumber,
        subscription: s.subscription ?? "Standard",
        totalPaid: s.totalPaid ?? 0,
        attendanceScore: s.attendanceScore ?? 0,
        assignmentsCompleted: s.assignmentsCompleted ?? 0,
        totalAssignments: s.totalAssignments ?? 0,
      })) as Student[];

    const pendingCertificates = Object.values(certificates).filter(
      (cert: any) => cert.status === "pending",
    ) as CertificateRequest[];

    const now = new Date();
    const upcomingClasses = Object.values(classes)
      .filter((classItem: any) => new Date(classItem.date) > now)
      .slice(0, 5);

    const stats: DashboardStats = {
      totalStudents: Object.keys(students).length,
      activeStudents: Object.values(students).filter(
        (s: any) => s.status === "active",
      ).length,
      awaitingPaymentStudents: Object.values(students).filter(
        (s: any) =>
          s.status === "awaiting_payment" ||
          s.paymentStatus === "unpaid" ||
          s.paymentStatus === "partial",
      ).length,
      totalPrograms: 3, // Static for now
      ongoingClasses: Object.values(classes).filter((c: any) => {
        const start = c.date ? new Date(c.date) : null;
        const end = c.endDate ? new Date(c.endDate) : start;
        if (!start || !end) return false;
        return start <= now && end >= now;
      }).length,
      pendingCertificates: pendingCertificates.length,
      totalRevenue,
      attendanceRate: 95, // TODO: derive from attendance records
      assignmentCompletionRate: 85, // TODO: derive from assignments
    };

    return {
      stats,
      recentStudents,
      pendingCertificates,
      upcomingClasses,
    };
  } catch (error) {
    console.error("Error fetching admin dashboard data:", error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────
// CERTIFICATES
// ─────────────────────────────────────────────────────────────
export async function updateCertificateStatus(
  requestId: string,
  status: "approved" | "rejected" | "issued",
  adminId: string,
  notes?: string,
) {
  try {
    const requestRef = child(dbRef, `certificateRequests/${requestId}`);

    await update(requestRef, {
      status,
      processedBy: adminId,
      processedAt: new Date().toISOString(),
      notes: notes ?? null,
      ...(status === "issued" && {
        issuedDate: new Date().toISOString(),
        downloadUrl: `/certificates/${requestId}.pdf`,
      }),
    });

    // Mirror the status on the student record so listings stay in sync.
    if (status === "approved" || status === "issued") {
      const certSnapshot = await get(requestRef);
      const certData = certSnapshot.val();

      if (certData?.studentId) {
        const studentRef = child(dbRef, `students/${certData.studentId}`);
        await update(studentRef, {
          certificateStatus: status,
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating certificate status:", error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────
// ATTENDANCE
// ─────────────────────────────────────────────────────────────
export async function markAttendance(
  classId: string,
  studentId: string,
  status: "present" | "absent" | "late" | "excused",
  adminId: string,
  notes?: string,
) {
  try {
    const attendanceId = `att_${Date.now()}`;
    const attendanceRef = child(dbRef, `attendance/${attendanceId}`);

    const attendanceRecord = {
      id: attendanceId,
      classId,
      studentId,
      date: new Date().toISOString(),
      status,
      markedBy: adminId,
      markedAt: new Date().toISOString(),
      notes: notes ?? null,
    };

    await set(attendanceRef, attendanceRecord);

    return { success: true, attendanceId };
  } catch (error) {
    console.error("Error marking attendance:", error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────
// STUDENTS
// ─────────────────────────────────────────────────────────────
export async function addStudent(studentData: Partial<Student>) {
  try {
    // Read existing students so the ID is unique. The previous
    // implementation used Object.keys(studentData).length, which
    // counted the fields in the partial, not the number of students.
    const studentsSnapshot = await get(child(dbRef, "students"));
    const existingStudents = studentsSnapshot.val() || {};
    const nextNumber = Object.keys(existingStudents).length + 1;
    const studentId = `PERF${String(nextNumber).padStart(3, "0")}`;

    const studentRef = child(dbRef, `students/${studentId}`);

    const student = {
      ...studentData,
      id: studentId,
      studentId,
      password: studentData.password ?? "student123",
      isFirstLogin: true,
      createdAt: new Date().toISOString(),
      status: studentData.status ?? "active",
      role: studentData.role ?? "student",
      attendanceScore: studentData.attendanceScore ?? 100,
      assignmentsCompleted: 0,
      totalAssignments: 0,
      certificateRequested: false,
      paymentStatus: studentData.paymentStatus ?? "pending",
    };

    await set(studentRef, student);

    return { success: true, studentId };
  } catch (error) {
    console.error("Error adding student:", error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────
// GRADING
// ─────────────────────────────────────────────────────────────
export async function updateGrade(
  assignmentId: string,
  studentId: string,
  score: number,
  feedback?: string,
) {
  try {
    const submissionRef = child(
      dbRef,
      `assignments/${assignmentId}/submissions/${studentId}`,
    );

    await update(submissionRef, {
      score,
      feedback: feedback ?? null,
      gradedAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating grade:", error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────
export async function sendNotification(
  studentId: string,
  title: string,
  message: string,
  type: "info" | "warning" | "success" | "error",
) {
  try {
    const notificationId = `notif_${Date.now()}`;
    const notificationRef = child(
      dbRef,
      `notifications/${studentId}/${notificationId}`,
    );

    await set(notificationRef, {
      id: notificationId,
      title,
      message,
      type,
      read: false,
      createdAt: new Date().toISOString(),
    });

    return { success: true, notificationId };
  } catch (error) {
    console.error("Error sending notification:", error);
    throw error;
  }
}
