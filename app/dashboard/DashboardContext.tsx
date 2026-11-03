// app/dashboard/DashboardContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  UserRole,
  Student,
  Admin,
  Instructor,
  PaymentStatus,
  EnrollmentStatus,
  DeliveryFormat,
} from "../type/database";

// Use the real union — includes every field the dashboard needs
type SessionUser = Student | Admin | Instructor;

// ─────────────────────────────────────────────────────────────
// Course — a view of the student's enrolled program
// ─────────────────────────────────────────────────────────────
export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  progress: number;
  status: "active" | "completed" | "upcoming";
  startDate: string;
  endDate: string;
}

interface DashboardContextType {
  user: SessionUser | null;
  courses: Course[];
  coursesLoading: boolean;
  activePanel: string;
  isSessionValid: boolean;
  isLoading: boolean;
  setActivePanel: (panel: string) => void;
  logout: () => void;
  navigateToPanel: (panelId: string, pageName?: string) => void;
  refreshCourses: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined,
);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [activePanel, setActivePanel] = useState("dashboard");
  const [isSessionValid, setIsSessionValid] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // ── Session load ────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) {
        setIsSessionValid(false);
        return;
      }
      const parsed = JSON.parse(raw) as SessionUser;

      // Normalize role to lowercase to guard against legacy records
      const normalized: SessionUser = parsed.role
        ? {
            ...parsed,
            role: String(parsed.role).toLowerCase() as UserRole,
          }
        : (parsed as SessionUser);

      setUser(normalized);
      setIsSessionValid(true);
    } catch (err) {
      console.error("Failed to load session:", err);
      setIsSessionValid(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Courses — fetch real student record for enrolled program ─
  const refreshCourses = useCallback(async () => {
    if (!user || user.role !== UserRole.STUDENT) {
      setCourses([]);
      return;
    }

    const studentId = (user as Student).studentId ?? user.id;
    if (!studentId) {
      setCourses([]);
      return;
    }

    setCoursesLoading(true);
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        credentials: "same-origin",
      });
      const body = await res.json();
      if (!body.success) throw new Error(body.error || "Failed to load");

      const s = body.data as Student;

      // Map the enrollment into a Course-shaped view so the existing
      // StudentDashboard UI continues to work.
      const programTitle = s.program || s.deliveryFormat || "Perfumery Program";

      const status: Course["status"] =
        s.status === "active"
          ? "active"
          : s.status === "graduated"
            ? "completed"
            : "upcoming";

      const course: Course = {
        id: s.enrollmentReceipt || s.id,
        title: programTitle,
        description:
          s.deliveryFormat === "intensive-1day"
            ? "1-Day Intensive class"
            : s.deliveryFormat === "offline-3months"
              ? "3 Months Masterclass"
              : "6 Weeks Masterclass",
        instructor: "The House of Tutu Faculty",
        progress: status === "completed" ? 100 : status === "active" ? 35 : 0,
        status,
        startDate: s.createdAt?.slice(0, 10) || "",
        endDate: "",
      };

      setCourses([course]);
    } catch (err) {
      console.error("Failed to load courses:", err);
      setCourses([]);
    } finally {
      setCoursesLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) refreshCourses();
  }, [user, refreshCourses]);

  // ── Navigation ──────────────────────────────────────────────
  const navigateToPanel = (panelId: string, _pageName?: string) => {
    setActivePanel(panelId);
    // Optional: sync to URL so refresh keeps the panel
    // router.push(`/dashboard?panel=${panelId}`, { scroll: false });
  };

  // ── Logout ──────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    // Clear both cookies reliably
    document.cookie = "user=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    window.location.href = "/";
  };

  return (
    <DashboardContext.Provider
      value={{
        user,
        courses,
        coursesLoading,
        activePanel,
        isSessionValid,
        isLoading,
        setActivePanel,
        logout,
        navigateToPanel,
        refreshCourses,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }
  return context;
}
