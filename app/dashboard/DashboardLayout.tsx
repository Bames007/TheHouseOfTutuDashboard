// app/dashboard/layout.tsx
"use client";

import { DashboardProvider, useDashboard } from "./DashboardContext";
import DashboardSidebar from "./SideBar";
import Header from "./Header";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { gothamOffice } from "../utils/constants";

// ─────────────────────────────────────────────────────────────
// Loading
// ─────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center [color-scheme:light]">
      <div className="text-center max-w-md p-8">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="w-20 h-20 border-4 border-[#691C33]/20 border-t-[#691C33] rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="House of Tutu"
              width={32}
              height={32}
              className="animate-pulse"
            />
          </div>
        </div>
        <h2
          className={`text-2xl font-bold text-gray-800 mb-3 ${gothamOffice.className}`}
        >
          Loading Dashboard
        </h2>
        <p className="text-gray-600 mb-6">Preparing your workspace…</p>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div className="bg-[#691C33] h-2 rounded-full animate-pulse w-3/4" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Session expired
// ─────────────────────────────────────────────────────────────
function SessionExpiredScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => router.push("/"), 2000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center [color-scheme:light]">
      <div className="text-center max-w-md p-8">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h2
          className={`text-2xl font-bold text-gray-800 mb-3 ${gothamOffice.className}`}
        >
          Session Expired
        </h2>
        <p className="text-gray-600 mb-6">
          Your session has ended. Redirecting to login…
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Root layout
// ─────────────────────────────────────────────────────────────
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <LoadingScreen />;

  return (
    <DashboardProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </DashboardProvider>
  );
}

// ─────────────────────────────────────────────────────────────
// Content shell
// ─────────────────────────────────────────────────────────────
function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { user } = useDashboard();

  if (user === null) return <SessionExpiredScreen />;

  return (
    <div className="min-h-screen bg-gray-50 [color-scheme:light]">
      {/* Desktop sidebar — fixed w-72 */}
      <div className="hidden lg:block fixed inset-y-0 left-0 z-30">
        <DashboardSidebar />
      </div>

      {/* Mobile bottom nav — rendered by DashboardSidebar's own <nav> */}
      <div className="lg:hidden">
        <DashboardSidebar />
      </div>

      {/* Main content — offset by sidebar width, fills everything else */}
      <div className="lg:ml-72 flex flex-col min-h-screen">
        <Header />

        {/* ─────────────────────────────────────────────────
           NO max-w-*. NO mx-auto on the inner wrapper.
           Content spans the full remaining width.
        ───────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-100/50">
          <div className="flex-1 px-4 sm:px-6 lg:px-8 py-4 lg:py-6 pb-24 lg:pb-6">
            {children}
          </div>

          <footer className="border-t border-gray-200">
            <div className="px-4 sm:px-6 lg:px-8 py-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 relative shrink-0">
                    <Image
                      src="/logo.png"
                      alt="House of Tutu"
                      width={24}
                      height={24}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <p
                      className={`text-sm font-medium text-gray-700 leading-tight ${gothamOffice.className}`}
                    >
                      House of Tutu
                    </p>
                    <p className="text-[11px] text-gray-500 leading-tight">
                      Perfumery Academy Management System
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-500 md:text-right">
                  <p>
                    © {new Date().getFullYear()} House of Tutu. All rights
                    reserved.
                  </p>
                  <p className="text-[11px] mt-0.5">v2.1.4</p>
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
