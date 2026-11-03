// app/lib/auth.ts
import { get, update } from "firebase/database";
import { database, ref } from "./firebase";
import { Student, Admin, UserRole } from "@/app/type/database";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
function sanitizeEmailKey(email: string): string {
  return email.toLowerCase().replace(/[.#$/\[\]]/g, "_");
}

/** get() that returns null on PermissionDenied instead of throwing. */
async function safeGet(path: string) {
  try {
    return await get(ref(database, path));
  } catch (err) {
    console.warn(`[auth] read blocked at ${path}:`, err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// AUTHENTICATE
// ─────────────────────────────────────────────────────────────
export async function authenticateUser(
  usernameOrEmail: string,
  password: string,
): Promise<Student | Admin | null> {
  const input = usernameOrEmail.trim();
  if (!input || !password) return null;

  try {
    // ── 1. Email → student ─────────────────────────────────
    if (input.includes("@")) {
      const lookup = await safeGet(`studentEmails/${sanitizeEmailKey(input)}`);
      if (lookup?.exists()) {
        const studentId = lookup.val() as string;
        const snap = await safeGet(`students/${studentId}`);
        if (snap?.exists()) {
          const student = snap.val();
          if (student.password === password) {
            return {
              ...student,
              id: studentId,
              role: UserRole.STUDENT,
            } as Student;
          }
        }
      }
    } else {
      // ── 2. Student ID (e.g. PERF001) ─────────────────────
      const snap = await safeGet(`students/${input}`);
      if (snap?.exists()) {
        const student = snap.val();
        if (student.password === password) {
          return {
            ...student,
            id: input,
            role: UserRole.STUDENT,
          } as Student;
        }
      }
    }

    // ── 3. Admin — reads from admins/{username} ────────────
    // Path is PLURAL: "admins", not "admin"
    const adminSnap = await safeGet(`admins/${input}`);
    if (adminSnap?.exists()) {
      const admin = adminSnap.val();
      if (admin.password === password) {
        return {
          ...admin,
          id: input,
          username: admin.username || input,
          role: UserRole.ADMIN,
        } as Admin;
      }
    }

    return null;
  } catch (error) {
    console.error("[auth] authenticateUser error:", error);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// PASSWORD UPDATE (student only — used by settings panel later)
// ─────────────────────────────────────────────────────────────
export async function updatePassword(
  userId: string,
  newPassword: string,
): Promise<boolean> {
  try {
    await update(ref(database, `students/${userId}`), {
      password: newPassword,
      isFirstLogin: false,
      passwordUpdatedAt: new Date().toISOString(),
    });
    return true;
  } catch (error) {
    console.error("[auth] updatePassword error:", error);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────────────────────
export function logout(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  document.cookie = "user=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  window.location.href = "/login";
}

// ─────────────────────────────────────────────────────────────
// SESSION HELPERS
// ─────────────────────────────────────────────────────────────
export function getCurrentUser(): Student | Admin | null {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return !!getCurrentUser() && !!localStorage.getItem("token");
}

export function requireAuth(role?: UserRole): boolean {
  if (typeof window === "undefined") return false;
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "/login";
    return false;
  }
  if (role && user.role !== role) {
    window.location.href = "/unauthorized";
    return false;
  }
  return true;
}

// ─────────────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────────────
export function useAuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }
    try {
      const user = JSON.parse(userStr);
      const currentPath = window.location.pathname;
      const isAdmin = String(user.role || "").toLowerCase() === "admin";

      if (isAdmin && !currentPath.startsWith("/admin")) {
        router.push("/admin/dashboard");
      } else if (!isAdmin && !currentPath.startsWith("/student")) {
        router.push("/student/dashboard");
      }
    } catch {
      router.push("/login");
    }
  }, [router]);
}

export function useAuth() {
  const [user, setUser] = useState<Student | Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        setUser(JSON.parse(userStr));
      } catch {
        setUser(null);
      }
    }
    setLoading(false);
  }, []);

  return { user, loading };
}
