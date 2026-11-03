// app/dashboard/Header.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search,
  Bell,
  ChevronDown,
  User as UserIcon,
  Settings,
  X,
  LogOut,
  GraduationCap,
  Shield,
  Mail,
  CreditCard,
} from "lucide-react";
import { useDashboard } from "./DashboardContext";
import Image from "next/image";
import { gothamOffice } from "../utils/constants";
import { UserRole } from "../type/database";
import { motion, AnimatePresence } from "framer-motion";

interface HeaderProps {
  onMenuClick?: () => void;
  isSidebarOpen?: boolean;
}

const PAGE_TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  profile: "My Profile",
  courses: "My Courses",
  assignments: "Assignments",
  schedule: "Schedule",
  grades: "Grades",
  library: "Library",
  messages: "Messages",
  students: "Students",
  payments: "Payments",
  reports: "Reports",
  settings: "Settings",
};

export default function Header(_props: HeaderProps) {
  const { user, activePanel, navigateToPanel, logout } = useDashboard();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const notifications = [
    { id: 1, title: "New student enrolled", time: "2 hours ago", unread: true },
    {
      id: 2,
      title: "Course material updated",
      time: "1 day ago",
      unread: false,
    },
  ];
  const unreadCount = notifications.filter((n) => n.unread).length;

  const getUserInitials = () => {
    if (user?.fullName) {
      return user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
    }
    return "HT";
  };

  const isAdmin = user?.role === UserRole.ADMIN;
  const roleLabel = isAdmin ? "Administrator" : "Student";
  const pageTitle = PAGE_TITLES[activePanel] || "Dashboard";
  const studentId = (user as any)?.studentId ?? user?.id ?? "—";

  const goToProfile = () => {
    navigateToPanel("profile", "My Profile");
    setIsProfileOpen(false);
    setIsMobileProfileOpen(false);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-30 bg-white/95 backdrop-blur-xl transition-all duration-200 border-b ${
          scrolled ? "border-rose-100 shadow-sm" : "border-rose-100/60"
        } [color-scheme:light]`}
      >
        <div className="px-4 sm:px-6 lg:px-8 h-14 md:h-16 flex items-center justify-between gap-3">
          {/* ── Left: page title ─────────────────────────── */}
          <div className="flex items-center gap-2.5 min-w-0">
            <Image
              src="/logo.png"
              alt="House of Tutu"
              width={24}
              height={24}
              className="object-contain shrink-0 hidden lg:block"
            />
            <div className="h-5 w-px bg-rose-100 hidden lg:block" />
            <h1
              className={`text-sm md:text-base font-semibold text-[#691C33] truncate ${gothamOffice.className}`}
            >
              {pageTitle}
            </h1>
          </div>

          {/* ── Center: desktop search ───────────────────── */}
          <div className="hidden lg:block flex-1 max-w-xl mx-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Search students, courses, reports..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-transparent rounded-xl focus:bg-white focus:border-[#691C33]/30 focus:ring-2 focus:ring-[#691C33]/10 outline-none transition-all text-sm text-slate-900 placeholder:text-slate-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* ── Right: actions ───────────────────────────── */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => navigateToPanel("messages", "Messages")}
              className="relative w-9 h-9 lg:w-10 lg:h-10 flex items-center justify-center rounded-xl hover:bg-[#691C33]/5 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-[18px] h-[18px] lg:w-5 lg:h-5 text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#691C33] rounded-full ring-2 ring-white" />
              )}
            </button>

            {/* Desktop profile dropdown */}
            <div className="hidden lg:block relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 p-1 pr-1.5 rounded-xl hover:bg-[#691C33]/5 transition-colors"
                aria-label="Open profile menu"
              >
                <div className="w-8 h-8 rounded-full bg-[#691C33] flex items-center justify-center shrink-0">
                  <span className="font-semibold text-white text-xs">
                    {getUserInitials()}
                  </span>
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[120px]">
                    {user?.fullName || "User"}
                  </p>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    {roleLabel}
                  </p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-slate-500 transition-transform ${
                    isProfileOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-rose-100 py-2 z-50"
                  >
                    {/* Header — clicking the avatar/name row also opens profile */}
                    <button
                      onClick={goToProfile}
                      className="w-full px-4 py-3 border-b border-rose-100 text-left hover:bg-[#691C33]/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#691C33] flex items-center justify-center shrink-0">
                          <span className="font-semibold text-white text-sm">
                            {getUserInitials()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-sm truncate">
                            {user?.fullName || "User"}
                          </p>
                          <p className="text-xs text-slate-500 truncate">
                            {user?.email || "user@example.com"}
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Identity block */}
                    <div className="px-4 py-3 border-b border-rose-100 space-y-2">
                      <div className="flex items-center gap-2">
                        {isAdmin ? (
                          <Shield className="w-3.5 h-3.5 text-[#691C33] shrink-0" />
                        ) : (
                          <GraduationCap className="w-3.5 h-3.5 text-[#691C33] shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                            {isAdmin ? "Admin ID" : "Student ID"}
                          </p>
                          <p className="text-xs font-mono font-semibold text-slate-900 truncate">
                            {studentId}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-[#691C33] shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                            Role
                          </p>
                          <p className="text-xs font-semibold text-slate-900 truncate">
                            {roleLabel}
                          </p>
                        </div>
                      </div>
                      {!isAdmin &&
                        (user as any)?.paymentStatus === "unpaid" && (
                          <div className="flex items-center gap-2 pt-2 border-t border-rose-100">
                            <CreditCard className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <p className="text-xs font-medium text-amber-800">
                              Payment pending
                            </p>
                          </div>
                        )}
                    </div>

                    {/* Menu items */}
                    <div className="py-2">
                      <button
                        onClick={goToProfile}
                        className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 transition-colors ${
                          activePanel === "profile"
                            ? "bg-[#691C33]/5 text-[#691C33] font-semibold"
                            : "text-slate-700 hover:bg-[#691C33]/5"
                        }`}
                      >
                        <UserIcon className="w-4 h-4 text-slate-500" />
                        <span>My Profile</span>
                      </button>
                      <button
                        onClick={() => {
                          navigateToPanel("settings", "Settings");
                          setIsProfileOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-[#691C33]/5 flex items-center gap-3 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-slate-500" />
                        <span>Account Settings</span>
                      </button>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-rose-100 pt-2">
                      <button
                        onClick={logout}
                        className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span className="font-medium">Logout</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile profile avatar — tapping opens the bottom sheet */}
            <button
              onClick={() => setIsMobileProfileOpen(true)}
              className="lg:hidden w-9 h-9 rounded-full bg-[#691C33] flex items-center justify-center shrink-0 active:scale-95 transition-transform"
              aria-label="Open profile menu"
            >
              <span className="font-semibold text-white text-xs">
                {getUserInitials()}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* ══════════ MOBILE PROFILE SHEET ══════════ */}
      <AnimatePresence>
        {isMobileProfileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-[60] bg-slate-950/50 backdrop-blur-sm"
            onClick={() => setIsMobileProfileOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-5 pb-8 [color-scheme:light]"
              style={{
                paddingBottom: "max(2rem, env(safe-area-inset-bottom) + 1rem)",
              }}
            >
              {/* Header row — tapping the avatar/name also opens profile */}
              <div className="flex items-center justify-between mb-5">
                <button
                  onClick={goToProfile}
                  className="flex items-center gap-3 min-w-0 text-left"
                >
                  <div className="w-12 h-12 rounded-full bg-[#691C33] flex items-center justify-center shrink-0">
                    <span className="font-semibold text-white text-base">
                      {getUserInitials()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">
                      {user?.fullName || "User"}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {user?.email || roleLabel}
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => setIsMobileProfileOpen(false)}
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center shrink-0"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Identity block */}
              <div className="bg-[#691C33]/5 rounded-xl p-3 mb-4 space-y-2">
                <div className="flex items-center gap-2">
                  {isAdmin ? (
                    <Shield className="w-4 h-4 text-[#691C33]" />
                  ) : (
                    <GraduationCap className="w-4 h-4 text-[#691C33]" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                      {isAdmin ? "Admin ID" : "Student ID"}
                    </p>
                    <p className="text-sm font-mono font-semibold text-slate-900 truncate">
                      {studentId}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-[#691C33]/10">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                    Role
                  </p>
                  <p className="text-xs font-semibold text-slate-900 ml-auto">
                    {roleLabel}
                  </p>
                </div>
                {!isAdmin && (user as any)?.paymentStatus === "unpaid" && (
                  <div className="flex items-center gap-2 pt-2 border-t border-[#691C33]/10">
                    <CreditCard className="w-4 h-4 text-amber-600" />
                    <p className="text-xs font-medium text-amber-800">
                      Payment pending
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-1.5">
                <button
                  onClick={goToProfile}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                    activePanel === "profile"
                      ? "bg-[#691C33]/10"
                      : "hover:bg-[#691C33]/5"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#691C33]/10 flex items-center justify-center">
                    <UserIcon size={18} className="text-[#691C33]" />
                  </div>
                  <span
                    className={`text-sm font-medium flex-1 ${
                      activePanel === "profile"
                        ? "text-[#691C33]"
                        : "text-slate-800"
                    }`}
                  >
                    My Profile
                  </span>
                  {activePanel === "profile" && (
                    <span className="text-[10px] uppercase tracking-wider font-bold text-[#691C33] bg-[#691C33]/10 px-2 py-0.5 rounded-full">
                      Now
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    navigateToPanel("settings", "Settings");
                    setIsMobileProfileOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#691C33]/5 text-left transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#691C33]/10 flex items-center justify-center">
                    <Settings size={18} className="text-[#691C33]" />
                  </div>
                  <span className="text-sm font-medium text-slate-800 flex-1">
                    Account Settings
                  </span>
                </button>

                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 text-left transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                    <LogOut size={18} className="text-red-600" />
                  </div>
                  <span className="text-sm font-medium text-red-600 flex-1">
                    Logout
                  </span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
