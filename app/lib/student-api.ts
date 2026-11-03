// app/lib/student-api.ts
import { get, child, update, set } from "firebase/database";
import { dbRef } from "./firebase";
import {
  Attendance,
  Payment,
  CertificateRequest,
  Student,
} from "@/app/type/database";

// ─────────────────────────────────────────────────────────────
// LOCAL TYPES
// ─────────────────────────────────────────────────────────────
interface AssignmentWithSubmission {
  id: string;
  classId?: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  submissions?: Record<string, any>;
  submission: {
    submittedAt?: string;
    score?: number;
    feedback?: string;
    fileUrl?: string;
    status?: string;
  } | null;
  status: "graded" | "submitted" | "pending";
}

interface StudentStats {
  attendanceScore: number;
  assignmentsCompleted: number;
  totalAssignments: number;
  gradeAverage: number;
  daysToNextClass: number;
  pendingPayments: number;
  certificateStatus: "none" | "pending" | "approved" | "rejected" | "issued";
  programProgress: number;
}

// ─────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────
export async function getStudentDashboardData(studentId: string): Promise<{
  stats: StudentStats;
  upcomingClasses: any[];
  recentAssignments: AssignmentWithSubmission[];
  certificate: CertificateRequest | null;
  payments: Payment[];
}> {
  try {
    const snapshot = await get(child(dbRef, `students/${studentId}`));

    if (!snapshot.exists()) {
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

    const studentData: Student = snapshot.val();
    const studentProgram = studentData.program || "";

    const [
      attendanceRes,
      assignmentsRes,
      certificateRes,
      classesRes,
      paymentsRes,
    ] = await Promise.allSettled([
      getAttendance(studentId),
      getAssignments(studentId, studentProgram),
      getCertificateStatus(studentId),
      getUpcomingClasses(studentProgram),
      getPayments(studentId),
    ]);

    const attendance =
      attendanceRes.status === "fulfilled" ? attendanceRes.value : [];
    const assignments =
      assignmentsRes.status === "fulfilled" ? assignmentsRes.value : [];
    const certificate =
      certificateRes.status === "fulfilled" ? certificateRes.value : null;
    const upcomingClasses =
      classesRes.status === "fulfilled" ? classesRes.value : [];
    const payments =
      paymentsRes.status === "fulfilled" ? paymentsRes.value : [];

    const gradedCount = assignments.filter((a) => a.status === "graded").length;

    const pendingPayments = payments.filter(
      (p) => p.status !== "successful" && p.status !== "refunded",
    ).length;

    const daysToNextClass =
      upcomingClasses.length > 0
        ? Math.max(
            0,
            Math.ceil(
              (new Date(upcomingClasses[0].date).getTime() - Date.now()) /
                86_400_000,
            ),
          )
        : 0;

    return {
      stats: {
        attendanceScore: calculateAttendanceScore(attendance),
        assignmentsCompleted: gradedCount,
        totalAssignments: assignments.length,
        gradeAverage: calculateGradeAverage(assignments),
        daysToNextClass,
        pendingPayments,
        certificateStatus: (certificate?.status ??
          "none") as StudentStats["certificateStatus"],
        programProgress: calculateProgramProgress(
          studentData.enrollmentDate || new Date().toISOString(),
          studentData.deliveryFormat,
        ),
      },
      upcomingClasses,
      recentAssignments: assignments.slice(0, 3),
      certificate,
      payments,
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────
// ASSIGNMENTS
// ─────────────────────────────────────────────────────────────
export async function submitAssignment(
  studentId: string,
  assignmentId: string,
  fileUrl: string,
) {
  try {
    if (!fileUrl) throw new Error("fileUrl is required");

    const submissionRef = child(
      dbRef,
      `assignments/${assignmentId}/submissions/${studentId}`,
    );

    // Merge (update) instead of replace (set) so a resubmit does not
    // wipe out a score or feedback the admin already entered.
    await update(submissionRef, {
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

// ─────────────────────────────────────────────────────────────
// CERTIFICATE
// ─────────────────────────────────────────────────────────────
export async function requestCertificate(studentId: string) {
  try {
    const studentSnapshot = await get(child(dbRef, `students/${studentId}`));
    const studentData: Student | null = studentSnapshot.val();

    if (!studentData) {
      throw new Error(`Student ${studentId} not found`);
    }

    if (studentData.certificateStatus === "pending") {
      return {
        success: false,
        error: "A certificate request is already pending.",
      };
    }
    if (studentData.certificateStatus === "issued") {
      return {
        success: false,
        error: "Certificate has already been issued.",
      };
    }

    const requestId = `cert_${Date.now()}`;
    const requestRef = child(dbRef, `certificateRequests/${requestId}`);
    const now = new Date().toISOString();

    const certificateRequest: CertificateRequest = {
      id: requestId,
      studentId,
      studentName: studentData.fullName ?? "",
      program: studentData.program ?? "",
      requestedAt: now,
      status: "pending",
    };

    await set(requestRef, certificateRequest);

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

// ─────────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────────
const ALLOWED_PROFILE_FIELDS = [
  "fullName",
  "email",
  "phoneNumber",
  "dateOfBirth",
  "city",
  "country",
  "address",
  "emergencyContact",
  "profileImage",
  "avatar",
] as const;

export async function updateProfile(
  studentId: string,
  updates: Record<string, any>,
) {
  try {
    // Whitelist so callers cannot overwrite `role`, `password`, `id`,
    // `certificateStatus`, etc. from the profile screen.
    const safe: Record<string, any> = {};
    for (const key of ALLOWED_PROFILE_FIELDS) {
      if (key in updates && updates[key] !== undefined) {
        safe[key] = updates[key];
      }
    }

    if (Object.keys(safe).length === 0) {
      return { success: false, error: "No valid fields to update." };
    }

    await update(child(dbRef, `students/${studentId}`), {
      ...safe,
      lastUpdated: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
async function getAttendance(studentId: string): Promise<Attendance[]> {
  const snapshot = await get(child(dbRef, `attendance`));
  const attendance = snapshot.val() || {};

  return Object.values(attendance).filter(
    (record: any) => record?.studentId === studentId,
  ) as Attendance[];
}

async function getAssignments(
  studentId: string,
  studentProgram: string,
): Promise<AssignmentWithSubmission[]> {
  const snapshot = await get(child(dbRef, `assignments`));
  const assignments = snapshot.val() || {};

  return Object.values(assignments)
    .filter((a: any) => {
      // If the assignment is scoped to a program, only return it to
      // students in that program. Legacy assignments with no program
      // field are shown to everyone.
      if (a?.program && studentProgram && a.program !== studentProgram) {
        return false;
      }
      return true;
    })
    .map((assignment: any) => {
      const sub = assignment.submissions?.[studentId] || null;
      const status: AssignmentWithSubmission["status"] =
        typeof sub?.score === "number"
          ? "graded"
          : sub
            ? "submitted"
            : "pending";
      return {
        ...assignment,
        submission: sub,
        status,
      };
    });
}

async function getCertificateStatus(
  studentId: string,
): Promise<CertificateRequest | null> {
  const snapshot = await get(child(dbRef, `certificateRequests`));
  const requests = snapshot.val() || {};

  const matches = (Object.values(requests) as CertificateRequest[]).filter(
    (req) => req?.studentId === studentId,
  );

  if (matches.length === 0) return null;

  // Latest first, in case the student submitted more than once.
  matches.sort((a, b) => {
    const ta = new Date(
      (a as any).requestedAt || (a as any).requestDate || 0,
    ).getTime();
    const tb = new Date(
      (b as any).requestedAt || (b as any).requestDate || 0,
    ).getTime();
    return tb - ta;
  });

  return matches[0];
}

async function getUpcomingClasses(studentProgram: string): Promise<any[]> {
  const snapshot = await get(child(dbRef, `classes`));
  const classes = snapshot.val() || {};
  const now = Date.now();

  const allUpcoming = (Object.values(classes) as any[])
    .filter((c) => {
      const t = c?.date ? new Date(c.date).getTime() : NaN;
      return !Number.isNaN(t) && t > now;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (!studentProgram) return allUpcoming.slice(0, 5);

  // Class records in this schema have `programId` (older) or `program`
  // (newer, admin-entered string). Match on either so the student sees
  // their own program's upcoming classes.
  const matching = allUpcoming.filter(
    (c) => c.program === studentProgram || c.programId === studentProgram,
  );

  return (matching.length > 0 ? matching : allUpcoming).slice(0, 5);
}

async function getPayments(studentId: string): Promise<Payment[]> {
  const snapshot = await get(child(dbRef, `payments`));
  const payments = snapshot.val() || {};

  return Object.values(payments).filter(
    (p: any) => p?.studentId === studentId,
  ) as Payment[];
}

function calculateAttendanceScore(attendance: Attendance[]): number {
  if (attendance.length === 0) return 100;
  const presentCount = attendance.filter((a) => a.status === "present").length;
  return Math.round((presentCount / attendance.length) * 100);
}

function calculateGradeAverage(
  assignments: AssignmentWithSubmission[],
): number {
  // Use `typeof === "number"` instead of a truthy check: a legitimately
  // scored 0 (failing grade) was being skipped by the old code.
  const graded = assignments.filter(
    (a) => typeof a.submission?.score === "number",
  );
  if (graded.length === 0) return 0;
  const total = graded.reduce(
    (sum, a) => sum + (a.submission!.score as number),
    0,
  );
  return Math.round(total / graded.length);
}

function programDurationMs(deliveryFormat?: string): number {
  const DAY = 24 * 60 * 60 * 1000;
  switch (deliveryFormat) {
    case "intensive-1day":
      return 1 * DAY;
    case "offline-3months":
      return 90 * DAY;
    case "offline-6weeks":
    default:
      return 42 * DAY;
  }
}

function calculateProgramProgress(
  enrollmentDate: string,
  deliveryFormat?: string,
): number {
  const start = new Date(enrollmentDate).getTime();
  if (Number.isNaN(start)) return 0;
  const duration = programDurationMs(deliveryFormat);
  const elapsed = Date.now() - start;
  return Math.max(0, Math.min(100, Math.round((elapsed / duration) * 100)));
}
