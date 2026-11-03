"use client";

import { useDashboard } from "./DashboardContext";
import Image from "next/image";
import {
  Home,
  Users,
  BookOpen,
  Calendar,
  BarChart,
  Settings,
  Award,
  ChevronRight,
  LogOut,
  CreditCard,
  MessageSquare,
  FileCheck,
  ClipboardList,
  Library,
  Bell,
  Search,
  X,
  Grid,
} from "lucide-react";
import { UserRole } from "../type/database";
import { gothamOffice } from "../utils/constants";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const cn = (...c: (string | false | undefined | null)[]) =>
  c.filter(Boolean).join(" ");

interface NavigationItem {
  name: string;
  icon: React.ElementType;
  href: string;
  panelId: string;
  roles: UserRole[];
  badge?: number;
}

const studentNavigation: NavigationItem[] = [
  {
    name: "Dashboard",
    icon: Home,
    href: "/student/dashboard",
    panelId: "dashboard",
    roles: [UserRole.STUDENT],
  },
  {
    name: "My Courses",
    icon: BookOpen,
    href: "/student/courses",
    panelId: "courses",
    roles: [UserRole.STUDENT],
  },
  {
    name: "Assignments",
    icon: FileCheck,
    href: "/student/assignments",
    panelId: "assignments",
    roles: [UserRole.STUDENT],
    badge: 3,
  },
  {
    name: "Schedule",
    icon: Calendar,
    href: "/student/schedule",
    panelId: "schedule",
    roles: [UserRole.STUDENT],
  },
  {
    name: "Grades",
    icon: Award,
    href: "/student/grades",
    panelId: "grades",
    roles: [UserRole.STUDENT],
  },
  {
    name: "Library",
    icon: Library,
    href: "/student/library",
    panelId: "library",
    roles: [UserRole.STUDENT],
  },
  {
    name: "Messages",
    icon: MessageSquare,
    href: "/student/messages",
    panelId: "messages",
    roles: [UserRole.STUDENT],
    badge: 5,
  },
];

// ═════════════════════════════════════════════════════════════
// ADMIN NAVIGATION — updated
// • Classes replaces Courses (AdminClassesPanel handles classes)
// • Assignments points to AdminClassesPanel (assignments tab)
// • Grades is new → AdminGradesPanel
// • Schedule removed (no admin panel; Classes shows dates/times)
// ═════════════════════════════════════════════════════════════
const adminNavigation: NavigationItem[] = [
  {
    name: "Dashboard",
    icon: Home,
    href: "/admin/dashboard",
    panelId: "dashboard",
    roles: [UserRole.ADMIN],
  },
  {
    name: "Students",
    icon: Users,
    href: "/admin/students",
    panelId: "students",
    roles: [UserRole.ADMIN],
  },
  {
    name: "Classes",
    icon: BookOpen,
    href: "/admin/classes",
    panelId: "classes",
    roles: [UserRole.ADMIN],
  },
  {
    name: "Assignments",
    icon: ClipboardList,
    href: "/admin/assignments",
    panelId: "assignments",
    roles: [UserRole.ADMIN],
  },
  {
    name: "Grades",
    icon: Award,
    href: "/admin/grades",
    panelId: "grades",
    roles: [UserRole.ADMIN],
  },
  {
    name: "Payments",
    icon: CreditCard,
    href: "/admin/payments",
    panelId: "payments",
    roles: [UserRole.ADMIN],
  },
  {
    name: "Reports",
    icon: BarChart,
    href: "/admin/reports",
    panelId: "reports",
    roles: [UserRole.ADMIN],
  },
  {
    name: "Messages",
    icon: MessageSquare,
    href: "/admin/messages",
    panelId: "messages",
    roles: [UserRole.ADMIN],
  },
  {
    name: "Settings",
    icon: Settings,
    href: "/admin/settings",
    panelId: "settings",
    roles: [UserRole.ADMIN],
  },
];

export default function DashboardSidebar() {
  // sidebarCollapsed / toggleSidebar intentionally NOT used —
  // the desktop sidebar is always open by design.
  const { user, activePanel, logout, navigateToPanel } = useDashboard();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  if (!user) {
    return (
      <div className="hidden lg:block w-72 h-screen bg-white border-r border-rose-100 animate-pulse" />
    );
  }

  const navItems =
    user.role === UserRole.ADMIN ? adminNavigation : studentNavigation;
  const unreadCount =
    navItems.find((i) => i.panelId === "messages")?.badge || 0;
  const roleLabel = user.role === UserRole.ADMIN ? "Administrator" : "Student";

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

  // Primary = first 4. Overflow = the rest, minus settings (added manually below).
  // For admin: Dashboard · Students · Classes · Assignments
  // For student: Dashboard · My Courses · Assignments · Schedule
  const primaryMobileItems = navItems.slice(0, 4);
  const overflowItems = navItems
    .slice(4)
    .filter((i) => i.panelId !== "settings");

  const filteredSearchItems = searchQuery.trim()
    ? navItems.filter((i) =>
        i.name.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : navItems;

  const getMobileLabel = (name: string) => name.split(" ").pop() || name;

  return (
    <>
      {/* ══════════ DESKTOP SIDEBAR — always open ══════════ */}
      <aside className="hidden lg:flex flex-col h-screen w-72 bg-white border-r border-rose-100/80 sticky top-0 shadow-sm z-30 [color-scheme:light]">
        {/* Brand */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white border border-rose-100 flex items-center justify-center shadow-sm shrink-0">
              <Image
                src="/logo.png"
                alt="House of Tutu"
                width={24}
                height={24}
                className="object-contain"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-[#691C33] tracking-tight leading-none">
                HOUSE OF TUTU
              </h1>
              <p className="text-[8px] font-semibold text-[#691C33]/60 uppercase tracking-[0.18em] mt-1 leading-none">
                Perfumery Academy
              </p>
            </div>
          </div>
        </div>

        {/* User card */}
        <div className="px-4 pb-4">
          <div className="bg-white rounded-3xl p-4 border border-rose-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#691C33]/5 overflow-hidden flex items-center justify-center border border-[#691C33]/10 shrink-0">
                {user.profileImage ? (
                  <Image
                    src={user.profileImage}
                    alt={user.fullName}
                    width={40}
                    height={40}
                    className="object-cover"
                  />
                ) : (
                  <span className="font-bold text-[#691C33] text-xs">
                    {getUserInitials()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user.fullName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                    {roleLabel}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => navigateToPanel("profile", "My Profile")}
              className={`w-full py-2 rounded-xl text-[10px] font-semibold tracking-wide border transition-all flex items-center justify-center ${
                activePanel === "profile"
                  ? "bg-[#691C33] text-white border-[#691C33]"
                  : "bg-[#691C33]/5 hover:bg-[#691C33] text-[#691C33] hover:text-white border-[#691C33]/10"
              }`}
            >
              My Profile
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 overflow-y-auto custom-burgundy-scrollbar py-2">
          <p className="text-[9px] font-semibold text-[#691C33]/50 uppercase tracking-[0.2em] px-3 mb-2">
            Menu
          </p>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = activePanel === item.panelId;
              return (
                <li key={item.name}>
                  <button
                    onClick={() => navigateToPanel(item.panelId, item.name)}
                    className={cn(
                      "relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                      isActive
                        ? "bg-[#691C33] text-white shadow-lg shadow-[#691C33]/20 font-semibold"
                        : "text-slate-700 hover:bg-[#691C33]/5 hover:text-[#691C33] font-medium",
                    )}
                  >
                    <item.icon
                      className={cn(
                        "w-[18px] h-[18px] flex-shrink-0 transition-transform group-hover:scale-110",
                        isActive
                          ? "text-white"
                          : "text-[#691C33]/70 group-hover:text-[#691C33]",
                      )}
                    />
                    <span className="text-xs tracking-tight flex-1 text-left">
                      {item.name}
                    </span>
                    {item.badge && (
                      <span
                        className={cn(
                          "text-[10px] font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center",
                          isActive
                            ? "bg-white text-[#691C33]"
                            : "bg-[#691C33] text-white",
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-rose-100">
          <div className="bg-[#691C33] rounded-2xl p-1.5 flex items-center justify-between shadow-lg shadow-[#691C33]/20">
            <button
              onClick={() => setShowSearch(true)}
              className="p-2.5 rounded-xl text-white hover:bg-white/15 transition-all min-h-10 min-w-10 inline-flex items-center justify-center"
              title="Search"
            >
              <Search size={16} strokeWidth={2.2} />
            </button>
            <button
              onClick={() => navigateToPanel("messages", "Messages")}
              className="relative p-2.5 rounded-xl text-white hover:bg-white/15 transition-all min-h-10 min-w-10 inline-flex items-center justify-center"
              title="Notifications"
            >
              <Bell size={16} strokeWidth={2.2} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-300 rounded-full ring-2 ring-[#691C33]" />
              )}
            </button>
            <button
              onClick={() => navigateToPanel("settings", "Settings")}
              className="p-2.5 rounded-xl text-white hover:bg-white/15 transition-all min-h-10 min-w-10 inline-flex items-center justify-center"
              title="Settings"
            >
              <Settings size={16} strokeWidth={2.2} />
            </button>
            <button
              onClick={logout}
              className="p-2.5 rounded-xl text-white hover:bg-white/15 transition-all min-h-10 min-w-10 inline-flex items-center justify-center"
              title="Logout"
            >
              <LogOut size={16} strokeWidth={2.2} />
            </button>
          </div>
          <p className="text-[8px] text-center text-slate-400 mt-2 font-semibold tracking-wider uppercase">
            House of Tutu © 2026
          </p>
        </div>
      </aside>

      {/* ══════════ MOBILE BOTTOM NAV ══════════ */}
      <div className="lg:hidden">
        <nav
          className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-rose-100 shadow-[0_-4px_20px_-8px_rgba(105,28,51,0.15)]"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <div className="flex items-stretch justify-around px-1">
            {primaryMobileItems.map((item) => {
              const isActive = activePanel === item.panelId;
              return (
                <button
                  key={item.panelId}
                  onClick={() => navigateToPanel(item.panelId, item.name)}
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-16 relative transition-colors",
                    isActive ? "text-[#691C33]" : "text-slate-500",
                  )}
                  aria-label={item.name}
                >
                  <div
                    className={cn(
                      "p-1.5 rounded-xl transition-all",
                      isActive && "bg-[#691C33]/10",
                    )}
                  >
                    <item.icon size={20} strokeWidth={isActive ? 2.4 : 2} />
                  </div>
                  <span className="text-[10px] font-medium truncate max-w-full px-1">
                    {getMobileLabel(item.name)}
                  </span>
                </button>
              );
            })}
            <button
              onClick={() => setShowMoreMenu(true)}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 min-h-16 text-slate-500"
              aria-label="More"
            >
              <div className="p-1.5 rounded-xl">
                <Grid size={20} strokeWidth={2} />
              </div>
              <span className="text-[10px] font-medium">More</span>
            </button>
          </div>
        </nav>

        {/* More sheet */}
        <AnimatePresence>
          {showMoreMenu && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm"
              onClick={() => setShowMoreMenu(false)}
            >
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto [color-scheme:light]"
              >
                <div className="p-5 pb-8">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className="text-lg font-bold text-[#691C33]">More</h3>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {user.fullName}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowMoreMenu(false)}
                      className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center"
                      aria-label="Close"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {overflowItems.length > 0 && (
                    <div className="grid grid-cols-2 gap-2.5 mb-5">
                      {overflowItems.map((item) => {
                        const isActive = activePanel === item.panelId;
                        return (
                          <button
                            key={item.panelId}
                            onClick={() => {
                              navigateToPanel(item.panelId, item.name);
                              setShowMoreMenu(false);
                            }}
                            className={cn(
                              "flex flex-col items-start gap-2.5 p-4 rounded-2xl border-2 transition-all min-h-24",
                              isActive
                                ? "bg-[#691C33] text-white border-[#691C33]"
                                : "bg-white text-slate-800 border-slate-200 hover:border-[#691C33]/40",
                            )}
                          >
                            <div
                              className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center",
                                isActive ? "bg-white/20" : "bg-[#691C33]/10",
                              )}
                            >
                              <item.icon
                                size={20}
                                className={
                                  isActive ? "text-white" : "text-[#691C33]"
                                }
                              />
                            </div>
                            <div className="text-left flex-1 flex flex-col justify-end">
                              <p className="text-sm font-semibold leading-tight">
                                {item.name}
                              </p>
                              {item.badge && (
                                <p
                                  className={cn(
                                    "text-xs mt-0.5",
                                    isActive
                                      ? "text-white/70"
                                      : "text-slate-500",
                                  )}
                                >
                                  {item.badge} new
                                </p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <button
                      onClick={() => {
                        navigateToPanel("profile", "My Profile");
                        setShowMoreMenu(false);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#691C33]/5 text-left transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#691C33]/10 flex items-center justify-center">
                        <Users size={18} className="text-[#691C33]" />
                      </div>
                      <span className="text-sm font-medium text-slate-800 flex-1">
                        My Profile
                      </span>
                      <ChevronRight size={16} className="text-slate-400" />
                    </button>
                    <button
                      onClick={() => {
                        navigateToPanel("settings", "Settings");
                        setShowMoreMenu(false);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#691C33]/5 text-left transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#691C33]/10 flex items-center justify-center">
                        <Settings size={18} className="text-[#691C33]" />
                      </div>
                      <span className="text-sm font-medium text-slate-800 flex-1">
                        Settings
                      </span>
                      <ChevronRight size={16} className="text-slate-400" />
                    </button>
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 text-left transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                        <LogOut size={18} className="text-red-600" />
                      </div>
                      <span className="text-sm font-medium text-red-600 flex-1">
                        Logout
                      </span>
                      <ChevronRight size={16} className="text-red-300" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ══════════ SEARCH OVERLAY ══════════ */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-slate-950/50 backdrop-blur-sm"
            onClick={() => setShowSearch(false)}
          >
            <motion.div
              initial={{ y: -20, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", damping: 26, stiffness: 260 }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                "absolute top-20 left-4 right-4 bg-white rounded-2xl shadow-2xl border border-rose-100 p-4",
                "lg:left-1/2 lg:-translate-x-1/2 lg:w-full lg:max-w-md",
                gothamOffice.className,
              )}
              role="dialog"
              aria-label="Search"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-slate-900">
                  Search House of Tutu
                </p>
                <button
                  onClick={() => setShowSearch(false)}
                  className="min-h-9 min-w-9 inline-flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
                  aria-label="Close search"
                >
                  <X size={16} className="text-slate-500" />
                </button>
              </div>
              <div className="relative mb-3">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                />
                <input
                  autoFocus
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search menu..."
                  className="w-full min-h-11 pl-10 pr-3 bg-slate-50 rounded-xl border border-transparent focus:bg-white focus:border-[#691C33] focus:ring-4 focus:ring-[#691C33]/10 outline-none transition text-sm text-slate-900 placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-1 max-h-80 overflow-y-auto custom-burgundy-scrollbar">
                {filteredSearchItems.map((item) => (
                  <button
                    key={item.panelId}
                    onClick={() => {
                      navigateToPanel(item.panelId, item.name);
                      setShowSearch(false);
                      setSearchQuery("");
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[#691C33]/5 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#691C33]/10 flex items-center justify-center shrink-0">
                      <item.icon size={16} className="text-[#691C33]" />
                    </div>
                    <span className="text-sm font-medium text-slate-800">
                      {item.name}
                    </span>
                    <ChevronRight
                      size={14}
                      className="ml-auto text-slate-400"
                    />
                  </button>
                ))}
                {filteredSearchItems.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-6">
                    No results found
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-burgundy-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-burgundy-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-burgundy-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(105, 28, 51, 0.2);
          border-radius: 9999px;
        }
        .custom-burgundy-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(105, 28, 51, 0.4);
        }
      `}</style>
    </>
  );
}
