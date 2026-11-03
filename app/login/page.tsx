// app/login/page.tsx
"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  LogIn,
  User,
  Lock,
  GraduationCap,
  AlertCircle,
  ChevronRight,
  Shield,
  BookOpen,
  Award,
  Users,
} from "lucide-react";
import { italiana, gothamOffice } from "../utils/constants";
import { authenticateUser } from "../lib/auth";
import { Student, Admin, UserRole } from "@/app/type/database";

const DEMO_ADMIN_USERNAME = "ramatushehu";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasMounted, setHasMounted] = useState(false);

  const isDemoMode = process.env.NODE_ENV !== "production";

  /**
   * Persist a session (localStorage + cookies) so middleware can read it.
   * For a production hardening pass, move the cookie write to a server
   * Route Handler that sets HttpOnly; Secure; SameSite=Lax cookies.
   */
  const setSession = (user: Student | Admin) => {
    const token = `token_${Date.now()}`;
    const serialized = JSON.stringify(user);
    localStorage.setItem("user", serialized);
    localStorage.setItem("token", token);
    document.cookie = `user=${serialized}; path=/; SameSite=Lax`;
    document.cookie = `token=${token}; path=/; SameSite=Lax`;
  };

  const redirectToDashboard = (role: UserRole) => {
    // Hard navigation guarantees middleware sees the freshly-set cookies.
    window.location.href =
      role === UserRole.ADMIN ? "/admin/dashboard" : "/student/dashboard";
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // authenticateUser accepts email OR student ID (e.g. PERF001)
      const user = await authenticateUser(username.trim(), password);

      if (!user) {
        setError(
          "Invalid credentials. Please check your email / Student ID and password.",
        );
        return;
      }

      setSession(user);
      redirectToDashboard(user.role);
    } catch (err) {
      console.error("Login failed:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[#691C33] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-6xl bg-white rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden border border-gray-200 [color-scheme:light]">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* ── LEFT SIDE — Branding ─────────────────────────── */}
          <div className="relative bg-gradient-to-br from-[#691C33] to-[#8A2B4A] p-8 md:p-12 hidden lg:flex flex-col justify-between">
            <div className="absolute inset-0 opacity-10">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="relative w-12 h-12">
                  <Image
                    src="/logo.png"
                    alt="The House of Tutu Academy"
                    fill
                    className="object-contain"
                  />
                </div>
                <div>
                  <h1
                    className={`text-2xl font-bold text-white ${italiana.className}`}
                  >
                    The House of Tutu
                  </h1>
                  <p className="text-white/85 text-sm font-light">
                    Perfumery Academy
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                  Welcome to Your{" "}
                  <span className="text-white/95">Fragrance Journey</span>
                </h2>
                <p className="text-white/85 text-lg">
                  Master the art of luxury perfumery and transform your passion
                  into a thriving business.
                </p>
              </div>
            </div>

            <div className="relative z-10 grid grid-cols-2 gap-4 mt-12">
              {[
                {
                  icon: GraduationCap,
                  label: "Industry Certificate",
                },
                { icon: Users, label: "Expert Mentors" },
                { icon: BookOpen, label: "Practical Training" },
                { icon: Award, label: "Award-Winning" },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-2"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <feature.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white/95 text-sm">{feature.label}</span>
                </motion.div>
              ))}
            </div>

            <div className="relative z-10 mt-12 pt-8 border-t border-white/20">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: "98%", label: "Success Rate" },
                  { value: "500+", label: "Graduates" },
                  { value: "4.9★", label: "Rating" },
                ].map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {stat.value}
                    </div>
                    <div className="text-white/80 text-xs">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT SIDE — Login Form ──────────────────────── */}
          <div className="p-6 sm:p-8 md:p-12 lg:p-16">
            <div className="max-w-md mx-auto">
              {/* Mobile Logo */}
              <div className="flex items-center gap-3 mb-8 lg:hidden">
                <div className="relative w-10 h-10">
                  <Image
                    src="/logo.png"
                    alt="The House of Tutu Academy"
                    fill
                    className="object-contain"
                  />
                </div>
                <div>
                  <h1
                    className={`text-xl font-bold text-[#691C33] ${italiana.className}`}
                  >
                    The House of Tutu
                  </h1>
                  <p className="text-gray-700 text-sm">Perfumery Academy</p>
                </div>
              </div>

              {/* Form Header */}
              <div className="mb-8">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between mb-4 gap-3"
                >
                  <div className="min-w-0">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                      Welcome Back
                    </h2>
                    <p className="text-gray-700 mt-2">
                      Sign in with your email or Student ID
                    </p>
                  </div>
                  <div
                    className={`p-3 rounded-xl bg-[#691C33]/10 shrink-0 ${gothamOffice.className}`}
                  >
                    <div className="text-xs font-semibold text-[#691C33]">
                      DASHBOARD
                    </div>
                  </div>
                </motion.div>

                {/* Dev-only admin hint — hidden in production builds */}
                {isDemoMode && username.trim() === DEMO_ADMIN_USERNAME && (
                  <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4"
                  >
                    <Shield className="w-5 h-5 text-blue-700" />
                    <div>
                      <p className="text-sm font-medium text-blue-950">
                        Admin Access Detected
                      </p>
                      <p className="text-xs text-blue-800">
                        You are logging in as an administrator
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Error Message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-4"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-800">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-6">
                {/* Email / Student ID */}
                <div>
                  <label
                    htmlFor="login-identifier"
                    className="block text-sm font-medium text-gray-800 mb-2"
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Email or Student ID
                    </div>
                  </label>
                  <div className="relative">
                    <User
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#691C33]/60 z-10"
                      aria-hidden="true"
                    />
                    <input
                      id="login-identifier"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      autoComplete="username"
                      className="w-full pl-12 pr-4 py-3.5 text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#691C33]/20 focus:border-[#691C33] outline-none transition-all placeholder:text-gray-500"
                      placeholder="you@example.com or PERF001"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="login-password"
                    className="block text-sm font-medium text-gray-800 mb-2"
                  >
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Password
                    </div>
                  </label>
                  <div className="relative">
                    <Lock
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#691C33]/60 z-10"
                      aria-hidden="true"
                    />
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      className="w-full pl-12 pr-12 py-3.5 text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#691C33]/20 focus:border-[#691C33] outline-none transition-all placeholder:text-gray-500"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg text-[#691C33]/70 hover:text-[#691C33] hover:bg-[#691C33]/5 transition-colors min-h-9 min-w-9 inline-flex items-center justify-center"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  className="w-full min-h-12 bg-gradient-to-r from-[#691C33] to-[#8A2B4A] text-white py-3.5 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-[#691C33]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      Sign In
                    </>
                  )}
                </motion.button>

                {/* Dev-only demo credentials */}
                {isDemoMode && (
                  <div className="text-center space-y-3 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-700">Demo Credentials:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="bg-gray-50 p-3 rounded-lg text-left">
                        <p className="text-xs font-medium text-gray-900">
                          Admin
                        </p>
                        <p className="text-xs text-gray-700 break-all">
                          {DEMO_ADMIN_USERNAME}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg text-left">
                        <p className="text-xs font-medium text-gray-900">
                          Student
                        </p>
                        <p className="text-xs text-gray-700 break-all">
                          PERF001 / student123
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </form>

              {/* Links */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <Link
                    href="https://www.thehouseoftutuacademy.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[#691C33] hover:text-[#8A2B4A] font-medium transition-colors group"
                  >
                    <span>Go to Academy's Main Website</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>

                <div className="text-center mt-4">
                  <p className="text-sm text-gray-700">
                    Need help?{" "}
                    <Link
                      href="mailto:support@thehouseoftutuacademy.com"
                      className="text-[#691C33] font-medium hover:underline"
                    >
                      Contact Support
                    </Link>
                  </p>
                </div>
              </div>

              {/* Security Badge */}
              <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-600">
                <Shield className="w-4 h-4" />
                <span>Secure Login • Encrypted Connection</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
