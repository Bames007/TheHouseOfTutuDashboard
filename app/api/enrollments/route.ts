// import { NextRequest, NextResponse } from "next/server";
// import { database } from "@/app/lib/firebase";
// import { ref, get } from "firebase/database";

// export async function GET(request: NextRequest) {
//   try {
//     console.log("GET /api/enrollments called");

//     const { searchParams } = new URL(request.url);
//     const status = searchParams.get("status") || "all";
//     const page = parseInt(searchParams.get("page") || "1");
//     const limit = parseInt(searchParams.get("limit") || "10");
//     const search = searchParams.get("search") || "";

//     console.log("Query params:", { status, page, limit, search });

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
//       console.log("No enrollment data found in Firebase");
//       return NextResponse.json({
//         success: true,
//         enrollments: [],
//         total: 0,
//         page: 1,
//         totalPages: 1,
//         limit: 10,
//       });
//     }

//     // Get all enrollments
//     let allEnrollments: any[] = [];
//     snapshot.forEach((childSnapshot) => {
//       const enrollment = childSnapshot.val();
//       // Ensure we have an id field
//       enrollment.id = childSnapshot.key;
//       enrollment.enrollmentId = enrollment.enrollmentId || childSnapshot.key;
//       allEnrollments.push(enrollment);
//     });

//     console.log(`Found ${allEnrollments.length} total enrollments`);

//     // Sort by submissionDate (newest first)
//     allEnrollments.sort((a, b) => {
//       const dateA = new Date(a.submissionDate || a.createdAt || 0);
//       const dateB = new Date(b.submissionDate || b.createdAt || 0);
//       return dateB.getTime() - dateA.getTime();
//     });

//     // Apply filters
//     let filteredEnrollments = allEnrollments;

//     // Filter by status
//     if (status && status !== "all") {
//       filteredEnrollments = filteredEnrollments.filter(
//         (e) => (e.status || "pending").toLowerCase() === status.toLowerCase()
//       );
//       console.log(
//         `After status filter (${status}): ${filteredEnrollments.length} enrollments`
//       );
//     }

//     // Apply search
//     if (search) {
//       const searchLower = search.toLowerCase();
//       filteredEnrollments = filteredEnrollments.filter(
//         (e) =>
//           e.fullName?.toLowerCase().includes(searchLower) ||
//           e.email?.toLowerCase().includes(searchLower) ||
//           e.receiptNumber?.toLowerCase().includes(searchLower) ||
//           e.program?.toLowerCase().includes(searchLower) ||
//           e.phoneNumber?.toLowerCase().includes(searchLower)
//       );
//       console.log(
//         `After search (${search}): ${filteredEnrollments.length} enrollments`
//       );
//     }

//     // Pagination
//     const startIndex = (page - 1) * limit;
//     const endIndex = startIndex + limit;
//     const paginatedEnrollments = filteredEnrollments.slice(
//       startIndex,
//       endIndex
//     );

//     const totalPages = Math.ceil(filteredEnrollments.length / limit);

//     console.log(
//       `Returning page ${page} of ${totalPages}, ${paginatedEnrollments.length} enrollments`
//     );

//     return NextResponse.json({
//       success: true,
//       enrollments: paginatedEnrollments,
//       total: filteredEnrollments.length,
//       page,
//       totalPages,
//       limit,
//     });
//   } catch (error: any) {
//     console.error("Error in GET /api/enrollments:", error);
//     return NextResponse.json(
//       {
//         success: false,
//         message: "Failed to fetch enrollments",
//         error: error.message,
//         stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
//       },
//       { status: 500 }
//     );
//   }
// }
// app/api/enrollments/route.ts
import { NextRequest } from "next/server";
import { database, ref, get } from "@/app/lib/firebase";
import { apiError, apiOk, requireAdmin } from "@/app/lib/apiHelpers";
import { EnrollmentRecord } from "@/app/type/database";

export const runtime = "nodejs";

/**
 * GET /api/enrollments
 * Admin only. List all enrollment records.
 */
export async function GET(request: NextRequest) {
  const admin = requireAdmin(request);
  if (!admin) return apiError("Unauthorized", 401);

  try {
    const snap = await get(ref(database, "tutu_academy/enrollments"));
    if (!snap.exists()) return apiOk<EnrollmentRecord[]>([]);

    let records = Object.values(snap.val() as Record<string, EnrollmentRecord>);

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const q = url.searchParams.get("q")?.toLowerCase().trim();

    if (status) records = records.filter((r) => r.status === status);
    if (q) {
      records = records.filter(
        (r) =>
          r.receiptNumber?.toLowerCase().includes(q) ||
          r.email?.toLowerCase().includes(q) ||
          r.fullName?.toLowerCase().includes(q),
      );
    }

    records.sort(
      (a, b) =>
        new Date(b.submittedAt || 0).getTime() -
        new Date(a.submittedAt || 0).getTime(),
    );

    return apiOk(records);
  } catch (err: any) {
    console.error("[enrollments] error:", err);
    return apiError(err?.message || "Failed to load enrollments", 500);
  }
}
