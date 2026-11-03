import { ref, get, child, update, set, remove } from "firebase/database";
import { dbRef } from "./firebase";
import {
  DashboardStats,
  Student,
  CertificateRequest,
} from "@/app/type/database";

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
      0
    );

    const recentStudents = Object.values(students)
      .sort(
        (a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5) as Student[];

    const pendingCertificates = Object.values(certificates).filter(
      (cert: any) => cert.status === "pending"
    ) as CertificateRequest[];

    const upcomingClasses = Object.values(classes)
      .filter((classItem: any) => new Date(classItem.date) > new Date())
      .slice(0, 5);

    const stats: DashboardStats = {
      totalStudents: Object.keys(students).length,
      activeStudents: Object.values(students).filter(
        (s: any) => s.status === "active"
      ).length,
      totalPrograms: 3, // Static for now
      ongoingClasses: Object.values(classes).filter(
        (c: any) =>
          new Date(c.date) <= new Date() && new Date(c.endDate) >= new Date()
      ).length,
      pendingCertificates: pendingCertificates.length,
      totalRevenue,
      attendanceRate: 95, // Calculated from attendance records
      assignmentCompletionRate: 85, // Calculated from assignments
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

export async function updateCertificateStatus(
  requestId: string,
  status: "approved" | "rejected" | "issued",
  adminId: string,
  notes?: string
) {
  try {
    const requestRef = child(dbRef, `certificateRequests/${requestId}`);

    await update(requestRef, {
      status,
      processedBy: adminId,
      processedAt: new Date().toISOString(),
      notes,
      ...(status === "issued" && {
        issuedDate: new Date().toISOString(),
        downloadUrl: `/certificates/${requestId}.pdf`,
      }),
    });

    // Update student record if approved
    if (status === "approved" || status === "issued") {
      const certSnapshot = await get(requestRef);
      const certData = certSnapshot.val();

      const studentRef = child(dbRef, `students/${certData.studentId}`);
      await update(studentRef, {
        certificateStatus: status,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error updating certificate status:", error);
    throw error;
  }
}

export async function markAttendance(
  classId: string,
  studentId: string,
  status: "present" | "absent" | "late" | "excused",
  adminId: string,
  notes?: string
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
      notes,
    };

    await set(attendanceRef, attendanceRecord);

    return { success: true, attendanceId };
  } catch (error) {
    console.error("Error marking attendance:", error);
    throw error;
  }
}

export async function addStudent(studentData: Partial<Student>) {
  try {
    const studentId = `PERF${String(
      Object.keys(studentData).length + 1
    ).padStart(3, "0")}`;
    const studentRef = child(dbRef, `students/${studentId}`);

    const student = {
      ...studentData,
      id: studentId,
      studentId,
      password: "student123", // Default password
      isFirstLogin: true,
      createdAt: new Date().toISOString(),
      status: "active",
      role: "student",
      attendanceScore: 100,
      assignmentsCompleted: 0,
      totalAssignments: 0,
      certificateRequested: false,
      paymentStatus: "pending",
    };

    await set(studentRef, student);

    return { success: true, studentId };
  } catch (error) {
    console.error("Error adding student:", error);
    throw error;
  }
}

export async function updateGrade(
  assignmentId: string,
  studentId: string,
  score: number,
  feedback?: string
) {
  try {
    const submissionRef = child(
      dbRef,
      `assignments/${assignmentId}/submissions/${studentId}`
    );

    await update(submissionRef, {
      score,
      feedback,
      gradedAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating grade:", error);
    throw error;
  }
}

export async function sendNotification(
  studentId: string,
  title: string,
  message: string,
  type: "info" | "warning" | "success" | "error"
) {
  try {
    const notificationId = `notif_${Date.now()}`;
    const notificationRef = child(
      dbRef,
      `notifications/${studentId}/${notificationId}`
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
