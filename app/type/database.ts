// app/type/database.ts
// ─────────────────────────────────────────────────────────────
// UNIFIED types — used by BOTH the website and the dashboard.
// The website's enrollment API is the source of truth for shape.
// Dashboard-only fields are marked optional.
// ─────────────────────────────────────────────────────────────

/**
 * Runtime string values MUST match what the enrollment API writes.
 * `/api/enrollment/process` writes `role: "student"` / `role: "admin"`.
 * Uppercase values would silently break every `user.role === UserRole.ADMIN` check.
 */
export enum UserRole {
  ADMIN = "admin",
  STUDENT = "student",
  INSTRUCTOR = "instructor",
}

// ─────────────────────────────────────────────────────────────
// ATTENDANCE
// Written to `attendance/{id}` by `admin-api.ts → markAttendance`.
// Read by `student-api.ts → getAttendance`.
// ─────────────────────────────────────────────────────────────
export interface Attendance {
  id: string;
  classId: string;
  studentId: string;
  date: string; // ISO timestamp of the class
  status: "present" | "absent" | "late" | "excused";
  markedBy?: string; // admin id
  markedAt?: string; // ISO timestamp
  notes?: string | null;
}

export type DeliveryFormat =
  | "offline-6weeks"
  | "offline-3months"
  | "intensive-1day";

export type EnrollmentStatus =
  | "awaiting_payment"
  | "pending_verification"
  | "active"
  | "suspended"
  | "graduated";

export type PaymentStatus =
  | "unpaid"
  | "partial"
  | "paid"
  | "overdue"
  | "refunded";

export type OneDayDay = "Friday" | "Saturday" | "Sunday";
export type OneDaySlot = "12-2pm" | "4-6pm";

export type PaymentMethod =
  | "bank-transfer"
  | "pos-payment"
  | "online-payment"
  | "cash";

// ─────────────────────────────────────────────────────────────
// STUDENT
// ─────────────────────────────────────────────────────────────
export interface Student {
  // ── Identity ───────────────────────────────────────────────
  /** "PERF001", "PERF002", … — the Firebase key AND the login ID */
  id: string;
  /** Dashboard alias — always equals `id` */
  studentId?: string;

  fullName: string;
  email: string;
  /** Optional login username (same as email if absent) */
  username?: string;

  // ── Auth ───────────────────────────────────────────────────
  /** Legacy plaintext password (enrollment API writes this). */
  password: string;
  /** Future: set when we migrate to bcrypt. */
  passwordHash?: string;
  passwordUpdatedAt?: string;
  isFirstLogin?: boolean;

  // ── Profile ────────────────────────────────────────────────
  phoneNumber: string;
  /** Dashboard alias — always equals `phoneNumber` */
  phone?: string;
  dateOfBirth: string;
  city: string;
  country: string;
  address?: string;
  emergencyContact?: string;
  profileImage?: string;
  avatar?: string;

  // ── Program ────────────────────────────────────────────────
  program: string;
  deliveryFormat: DeliveryFormat;
  batch?: string;
  /** TUTU-YYMMDD-XXXXXX receipt that created this account */
  enrollmentReceipt: string;
  enrollmentDate?: string;

  // ── Academic (dashboard-only) ──────────────────────────────
  attendanceScore?: number;
  grades?: Record<string, number>;
  assignmentsCompleted?: number;
  totalAssignments?: number;
  certificateRequested?: boolean;
  certificateStatus?: "pending" | "approved" | "rejected" | "issued";
  subscription?: string;

  // ── Payment (dashboard-only) ───────────────────────────────
  paymentStatus?: PaymentStatus;
  totalPaid?: number;

  // ── Lifecycle ──────────────────────────────────────────────
  role: UserRole;
  status: EnrollmentStatus;
  createdAt: string;
  lastLogin?: string;

  // ── 1-Day Intensive (only when deliveryFormat === "intensive-1day") ──
  oneDayDay?: OneDayDay | null;
  oneDaySlot?: OneDaySlot | null;
  oneDaySlotLabel?: string | null;
}

// ─────────────────────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────────────────────
export interface Admin {
  /** Firebase key at `admins/{username}` — same as the login username */
  id: string;
  username: string;

  fullName: string;
  email?: string;

  /** Legacy plaintext. Hash with bcrypt before going live. */
  password: string;
  passwordHash?: string;
  passwordUpdatedAt?: string;

  role: UserRole;
  isFirstLogin?: boolean;

  profileImage?: string;
  subscription?: string;

  // Dashboard-only
  permissions?: string[];
  lastActivity?: string;
  status?: "active" | "inactive" | "suspended";
  createdAt?: string;
}

// ─────────────────────────────────────────────────────────────
// INSTRUCTOR (extends the shape of an admin but separate role)
// ─────────────────────────────────────────────────────────────
export interface Instructor {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  password: string;
  role: UserRole.INSTRUCTOR;
  profileImage?: string;
  bio?: string;
  specialties?: string[];
  createdAt?: string;
}

// ─────────────────────────────────────────────────────────────
// ENROLLMENT RECORD
// ─────────────────────────────────────────────────────────────
export interface EnrollmentRecord {
  receiptNumber: string;

  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  city: string;
  country: string;

  program: string;
  deliveryFormat: DeliveryFormat;
  deliveryFormatLabel: string;
  duration: string;

  oneDayDay: OneDayDay | null;
  oneDaySlot: OneDaySlot | null;
  oneDaySlotLabel: string | null;

  hasBusiness: "yes" | "no";
  businessName: string;
  expectations: string;

  paymentMethod: string;
  paymentReceiptNumber: string;

  registrationFee: number;
  courseFee: number;
  totalAmount: number;

  agreedToTerms: boolean;
  agreedToRefund: boolean;
  signature: string;
  signatureDate: string;

  status: EnrollmentStatus;
  submittedAt: string;
  ip?: string;

  /** Set by the API after the student account is created */
  studentId?: string;

  confirmationEmailSentAt?: string;
  resendMessageId?: string;
}

// ─────────────────────────────────────────────────────────────
// PAYMENT
// ─────────────────────────────────────────────────────────────
export interface Payment {
  id: string;
  studentId: string;
  studentName: string;

  amount: number;
  currency: "NGN";

  method: PaymentMethod;
  reference: string;

  status: "successful" | "pending" | "failed" | "refunded";

  /** The enrollment receipt this payment is toward */
  enrollmentReceipt: string;

  /** Free-form note from admin or the payment processor */
  note?: string;

  recordedBy?: string; // admin id, or "self" for student-submitted
  recordedAt: string;

  invoiceUrl?: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

// ─────────────────────────────────────────────────────────────
// PROGRAM (curriculum — separate from student.program string)
// ─────────────────────────────────────────────────────────────
export interface Program {
  id: string;
  name: string;
  description: string;
  duration: string;
  fee: number;
  startDate: string;
  endDate: string;
  instructorId: string;
  maxStudents: number;
  enrolledStudents: number;
  status: "upcoming" | "ongoing" | "completed";
  schedule: string[];
  materials: string[];
}

export interface Class {
  id: string;
  programId: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  instructor: string;
  location: string;
  materials: string[];
  recordingUrl?: string;
  assignments: string[];
}

export interface Assignment {
  id: string;
  classId: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  submissions: Record<
    string,
    {
      submittedAt: string;
      score?: number;
      feedback?: string;
      fileUrl?: string;
    }
  >;
}

// ─────────────────────────────────────────────────────────────
// DASHBOARD STATS
// ─────────────────────────────────────────────────────────────
export interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  awaitingPaymentStudents: number;
  totalPrograms: number;
  ongoingClasses: number;
  pendingCertificates: number;
  totalRevenue: number;
  attendanceRate: number;
  assignmentCompletionRate: number;
}

// ─────────────────────────────────────────────────────────────
// AUTH HELPER
// ─────────────────────────────────────────────────────────────
export type AuthUser =
  | (Student & { role: UserRole.STUDENT })
  | (Admin & { role: UserRole.ADMIN })
  | (Instructor & { role: UserRole.INSTRUCTOR });

// ─────────────────────────────────────────────────────────────
// CLASSES (admin-managed)
// ─────────────────────────────────────────────────────────────
export interface ClassRecord {
  id: string;
  title: string;
  description: string;
  program: string; // free-form, e.g. "Art of Perfumery — 6 weeks"
  date: string; // "2026-11-15"
  startTime: string; // "10:00"
  endTime: string; // "13:00"
  instructor: string;
  location: string; // "Abuja Studio", "Online — Zoom", …
  materials: string[];
  recordingUrl?: string;
  createdAt: string;
  createdBy: string;
}

// ─────────────────────────────────────────────────────────────
// ASSIGNMENTS (admin-managed)
// ─────────────────────────────────────────────────────────────
export interface AssignmentRecord {
  id: string;
  title: string;
  description: string;
  course: string; // matches module title on the student record
  program?: string;
  dueDate: string; // ISO
  maxScore: number;
  createdAt: string;
  createdBy: string;
  submissions?: Record<
    string,
    {
      studentId: string;
      studentName: string;
      submittedAt: string;
      fileName?: string;
      notes?: string;
      score?: number;
      feedback?: string;
    }
  >;
}

// ─────────────────────────────────────────────────────────────
// CERTIFICATE REQUEST
// Written to `certificateRequests/{id}` by the student portal.
// Read + processed by `admin-api.ts`.
// ─────────────────────────────────────────────────────────────
export interface CertificateRequest {
  id: string;
  studentId: string;

  /**
   * "pending"   → just submitted, admin has not looked at it
   * "approved"  → admin approved, certificate not yet generated
   * "rejected"  → admin rejected
   * "issued"    → PDF generated + downloadUrl set
   *
   * Must match `Student.certificateStatus`.
   */
  status: "pending" | "approved" | "rejected" | "issued";

  // Snapshot at request time (safe to omit if only ID is stored)
  studentName?: string;
  program?: string;
  certificateType?: string;
  reason?: string;
  requestedAt?: string;

  // Processing metadata (written by updateCertificateStatus)
  processedBy?: string;
  processedAt?: string;
  notes?: string;

  // Issuance metadata (written when status becomes "issued")
  issuedDate?: string;
  downloadUrl?: string;
}
