import { ref, get, child, update, set } from "firebase/database";
import { dbRef } from "./firebase";
import { Attendance, Payment } from "@/app/type/database";

export async function getStudentDashboardData(studentId: string) {
  try {
    const snapshot = await get(child(dbRef, `students/${studentId}`));

    if (!snapshot.exists()) {
      // Return default data if student not found
      return {
        stats: {
          attendanceScore: 0,
          assignmentsCompleted: 0,
          totalAssignments: 0,
          gradeAverage: 0,
          daysToNextClass: 0,
          pendingPayments: 0,
          certificateStatus: "none",
          programProgress: 0,
        },
        upcomingClasses: [],
        recentAssignments: [],
        certificate: null,
        payments: [],
      };
    }

    const studentData = snapshot.val();

    // Fetch additional data with error handling
    const [attendance, assignments, certificate] = await Promise.allSettled([
      getAttendance(studentId),
      getAssignments(studentId),
      getCertificateStatus(studentId),
    ]);

    return {
      stats: {
        attendanceScore: calculateAttendanceScore(
          attendance.status === "fulfilled" ? attendance.value : []
        ),
        assignmentsCompleted:
          assignments.status === "fulfilled"
            ? assignments.value.filter((a: any) => a.status === "graded").length
            : 0,
        totalAssignments:
          assignments.status === "fulfilled" ? assignments.value.length : 0,
        gradeAverage: calculateGradeAverage(
          assignments.status === "fulfilled" ? assignments.value : []
        ),
        daysToNextClass: 2,
        pendingPayments: 0,
        certificateStatus:
          certificate.status === "fulfilled"
            ? certificate.value?.status || "none"
            : "none",
        programProgress: calculateProgramProgress(
          studentData.enrollmentDate || new Date().toISOString()
        ),
      },
      upcomingClasses: await getUpcomingClasses(studentData.programId || ""),
      recentAssignments:
        assignments.status === "fulfilled" ? assignments.value.slice(0, 3) : [],
      certificate:
        certificate.status === "fulfilled" ? certificate.value : null,
      payments: await getPayments(studentId),
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    throw error;
  }
}

export async function submitAssignment(
  studentId: string,
  assignmentId: string,
  fileUrl: string
) {
  try {
    const assignmentRef = child(
      dbRef,
      `assignments/${assignmentId}/submissions/${studentId}`
    );

    await set(assignmentRef, {
      submittedAt: new Date().toISOString(),
      fileUrl,
      status: "submitted",
    });

    return { success: true };
  } catch (error) {
    console.error("Error submitting assignment:", error);
    throw error;
  }
}

export async function requestCertificate(studentId: string) {
  try {
    const requestId = `cert_${Date.now()}`;
    const requestRef = child(dbRef, `certificateRequests/${requestId}`);

    const studentSnapshot = await get(child(dbRef, `students/${studentId}`));
    const studentData = studentSnapshot.val();

    const certificateRequest = {
      id: requestId,
      studentId,
      studentName: `${studentData.firstName} ${studentData.lastName}`,
      program: studentData.program,
      requestDate: new Date().toISOString(),
      status: "pending",
      studentEmail: studentData.email,
      studentPhone: studentData.phone,
    };

    await set(requestRef, certificateRequest);

    // Update student record
    await update(child(dbRef, `students/${studentId}`), {
      certificateRequested: true,
      certificateStatus: "pending",
    });

    return { success: true, requestId };
  } catch (error) {
    console.error("Error requesting certificate:", error);
    throw error;
  }
}

export async function updateProfile(studentId: string, updates: any) {
  try {
    const studentRef = child(dbRef, `students/${studentId}`);
    await update(studentRef, {
      ...updates,
      lastUpdated: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
}

// Helper functions
async function getAttendance(studentId: string): Promise<Attendance[]> {
  const snapshot = await get(child(dbRef, `attendance`));
  const attendance = snapshot.val() || {};

  return Object.values(attendance).filter(
    (record: any) => record.studentId === studentId
  ) as Attendance[];
}

async function getAssignments(studentId: string): Promise<any[]> {
  const snapshot = await get(child(dbRef, `assignments`));
  const assignments = snapshot.val() || {};

  return Object.values(assignments).map((assignment: any) => ({
    ...assignment,
    submission: assignment.submissions?.[studentId] || null,
    status: assignment.submissions?.[studentId]?.score
      ? "graded"
      : assignment.submissions?.[studentId]
      ? "submitted"
      : "pending",
  }));
}

async function getCertificateStatus(studentId: string): Promise<any> {
  const snapshot = await get(child(dbRef, `certificateRequests`));
  const requests = snapshot.val() || {};

  return Object.values(requests).find(
    (req: any) => req.studentId === studentId
  );
}

async function getUpcomingClasses(programId: string): Promise<any[]> {
  const snapshot = await get(child(dbRef, `classes`));
  const classes = snapshot.val() || {};

  const now = new Date();
  return Object.values(classes)
    .filter(
      (classItem: any) =>
        classItem.programId === programId && new Date(classItem.date) > now
    )
    .slice(0, 5);
}

async function getPayments(studentId: string): Promise<Payment[]> {
  const snapshot = await get(child(dbRef, `payments`));
  const payments = snapshot.val() || {};

  return Object.values(payments).filter(
    (payment: any) => payment.studentId === studentId
  ) as Payment[];
}

function calculateAttendanceScore(attendance: Attendance[]): number {
  if (attendance.length === 0) return 100;

  const presentCount = attendance.filter((a) => a.status === "present").length;
  return Math.round((presentCount / attendance.length) * 100);
}

function calculateGradeAverage(assignments: any[]): number {
  const graded = assignments.filter((a) => a.submission?.score);
  if (graded.length === 0) return 0;

  const total = graded.reduce((sum, a) => sum + a.submission.score, 0);
  return Math.round(total / graded.length);
}

function calculateProgramProgress(enrollmentDate: string): number {
  const start = new Date(enrollmentDate);
  const now = new Date();
  const programDuration = 14 * 24 * 60 * 60 * 1000; // 14 days in milliseconds

  const elapsed = now.getTime() - start.getTime();
  return Math.min(Math.round((elapsed / programDuration) * 100), 100);
}
