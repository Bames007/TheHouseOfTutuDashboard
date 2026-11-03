"use client";

import { useDashboard } from "@/app/dashboard/DashboardContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  BookOpen,
  TrendingUp,
  DollarSign,
  Calendar,
  Award as ScholarshipIcon,
  Download,
  MoreVertical,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Filter,
  ChevronDown,
  Eye,
  Edit,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  User,
  CreditCard,
  FileText,
  CheckSquare,
  XSquare,
  Save,
  Loader2,
  EyeOff,
  BarChart3,
  AlertCircle,
  UserPlus,
  RefreshCw,
  PieChart,
  Activity,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";

interface Enrollment {
  id: string;
  enrollmentId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  program: string;
  deliveryFormat: string;
  status:
    | "pending"
    | "approved"
    | "scholarship"
    | "payment_complete"
    | "rejected";
  totalAmount: number;
  submissionDate: string;
  receiptNumber: string;
  hasBusiness?: string;
  businessName?: string;
  scholarship?: boolean;
  paymentMethod?: string;
  city?: string;
  country?: string;
  notes?: string;
  expectations?: string;
  courseFee?: number;
  registrationFee?: number;
  dateOfBirth?: string;
  signature?: string;
  signatureDate?: string;
  agreedToTerms?: boolean;
  agreedToRefund?: boolean;
  paymentReceiptNumber?: string;
  emailSent?: boolean;
  createdAt?: number;
  updatedAt?: number;
}

interface Stats {
  total: number;
  byStatus: Record<string, number>;
  byProgram: Record<string, number>;
  recentGrowth: number;
  revenue: number;
  monthlyTrend: { month: string; count: number }[];
}

interface ApiResponse {
  success: boolean;
  enrollments?: Enrollment[];
  stats?: Stats;
  total?: number;
  totalPages?: number;
  message?: string;
  error?: string;
}

export default function AdminDashboard() {
  const { courses } = useDashboard();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [editingStudent, setEditingStudent] = useState<Enrollment | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [savingChanges, setSavingChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchEnrollments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await fetch(`/api/enrollments?${params}`);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      if (data.success && data.enrollments) {
        setEnrollments(data.enrollments);
        setTotalPages(data.totalPages || 1);
        setTotalStudents(data.total || 0);
      } else {
        throw new Error(data.message || "Failed to fetch enrollments");
      }
    } catch (error: any) {
      console.error("Error fetching enrollments:", error);
      setError(`Failed to load students: ${error.message}`);
      setEnrollments([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [currentPage, statusFilter, searchTerm]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch("/api/enrollments/stats");

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      if (data.success && data.stats) {
        setStats(data.stats);
      } else {
        console.warn("Stats API returned unsuccessful response");
      }
    } catch (error: any) {
      console.error("Error fetching stats:", error);
      setStats({
        total: 0,
        byStatus: {},
        byProgram: {},
        recentGrowth: 0,
        revenue: 0,
        monthlyTrend: [],
      });
    }
  }, []);

  const refreshData = useCallback(() => {
    setIsRefreshing(true);
    fetchEnrollments();
    fetchStats();
  }, [fetchEnrollments, fetchStats]);

  useEffect(() => {
    fetchEnrollments();
    fetchStats();
  }, [fetchEnrollments, fetchStats]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchEnrollments();
  };

  const updateEnrollmentStatus = async (
    enrollmentId: string,
    newStatus: string,
    sendNotification: boolean = false,
  ) => {
    setUpdatingStatus(enrollmentId);
    setError(null);
    try {
      const response = await fetch(`/api/enrollments/${enrollmentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          updatedAt: Date.now(),
          ...(newStatus === "scholarship" && { scholarship: true }),
          sendNotification,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      if (data.success) {
        refreshData();
      } else {
        throw new Error(data.message || "Failed to update status");
      }
    } catch (error: any) {
      console.error("Error updating status:", error);
      setError(`Failed to update status: ${error.message}`);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const openEditModal = (student: Enrollment) => {
    setEditingStudent({ ...student });
    setShowEditModal(true);
  };

  const saveStudentChanges = async () => {
    if (!editingStudent) return;

    setSavingChanges(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/enrollments/${editingStudent.enrollmentId || editingStudent.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...editingStudent,
            updatedAt: Date.now(),
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to save changes: ${response.status}`);
      }

      const data: ApiResponse = await response.json();

      if (data.success) {
        setShowEditModal(false);
        setEditingStudent(null);
        refreshData();
      } else {
        throw new Error(data.message || "Failed to save changes");
      }
    } catch (error: any) {
      console.error("Error saving changes:", error);
      setError(`Failed to save changes: ${error.message}`);
    } finally {
      setSavingChanges(false);
    }
  };

  const toggleStudentDetails = (studentId: string) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case "scholarship":
        return <ScholarshipIcon className="w-4 h-4 text-amber-600" />;
      case "payment_complete":
        return <DollarSign className="w-4 h-4 text-blue-600" />;
      case "pending":
        return <Clock className="w-4 h-4 text-gray-500" />;
      case "rejected":
        return <XCircle className="w-4 h-4 text-rose-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "scholarship":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "payment_complete":
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "pending":
        return "bg-gray-50 text-gray-800 border-gray-200";
      case "rejected":
        return "bg-rose-50 text-rose-800 border-rose-200";
      default:
        return "bg-gray-50 text-gray-800 border-gray-200";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Invalid date";
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    try {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }
      return age;
    } catch {
      return "N/A";
    }
  };

  const statsData = [
    {
      label: "Total Students",
      value: stats?.total?.toString() || totalStudents.toString() || "0",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: `${stats?.recentGrowth || 0} this week`,
      // trend: stats?.recentGrowth > 0 ? "up" : "down",
    },
    {
      label: "Active Programs",
      value: stats?.byProgram
        ? Object.keys(stats.byProgram).length.toString()
        : enrollments
            .reduce((acc, e) => {
              if (!acc.includes(e.program)) acc.push(e.program);
              return acc;
            }, [] as string[])
            .length.toString() || "0",
      icon: BookOpen,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      change: "Currently active",
      trend: "stable",
    },
    {
      label: "Total Revenue",
      value: formatCurrency(
        stats?.revenue ||
          enrollments.reduce((sum, e) => sum + (e.totalAmount || 0), 0),
      ),
      icon: DollarSign,
      color: "text-violet-600",
      bgColor: "bg-violet-50",
      change: "Updated today",
      trend: "up",
    },
    {
      label: "Scholarships",
      value: (
        stats?.byStatus?.scholarship ||
        enrollments.filter((e) => e.scholarship).length
      ).toString(),
      icon: ScholarshipIcon,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      change: "Awarded",
      trend: "up",
    },
  ];

  const upcomingEvents = [
    {
      id: 1,
      title: "Faculty Meeting",
      time: "10:00 AM",
      date: "Today",
      type: "internal",
    },
    {
      id: 2,
      title: "New Batch Orientation",
      time: "2:00 PM",
      date: "Tomorrow",
      type: "student",
    },
    {
      id: 3,
      title: "Guest Lecture",
      time: "11:00 AM",
      date: "Mar 15",
      type: "guest",
    },
  ];

  const exportOptions = [
    { label: "Students List", icon: Users, format: "CSV" },
    { label: "Course Analytics", icon: BookOpen, format: "PDF" },
    { label: "Payment Reports", icon: CreditCard, format: "Excel" },
    { label: "Scholarship Report", icon: ScholarshipIcon, format: "PDF" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Student Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage enrollments, update status, and review student details
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg border border-gray-200 transition-colors"
              title="Refresh data"
            >
              <RefreshCw
                className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>
            <button className="px-4 py-2.5 bg-white text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2">
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button className="px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Student</span>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statsData.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-5 border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 ${stat.bgColor} rounded-lg`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    stat.trend === "up"
                      ? "bg-emerald-50 text-emerald-700"
                      : stat.trend === "down"
                        ? "bg-rose-50 text-rose-700"
                        : "bg-blue-50 text-blue-700"
                  }`}
                >
                  {stat.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">
                {stat.value}
              </p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Student Management */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200">
            {/* Toolbar */}
            <div className="p-4 md:p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Enrollments
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {totalStudents} total students
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Search */}
                  <form
                    onSubmit={handleSearch}
                    className="flex-1 min-w-[200px]"
                  >
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search students..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300"
                      />
                    </div>
                  </form>

                  {/* Filter */}
                  <div className="flex gap-3">
                    <div className="relative">
                      <select
                        value={statusFilter}
                        onChange={(e) => {
                          setStatusFilter(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-300 bg-white min-w-[140px]"
                      >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="scholarship">Scholarship</option>
                        <option value="payment_complete">Paid</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Student List */}
            <div className="divide-y divide-gray-200">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading students...</p>
                </div>
              ) : enrollments.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-900 font-medium">No students found</p>
                  <p className="text-gray-600 text-sm mt-1">
                    Try adjusting your search or filter
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider hidden md:table-cell">
                          Program
                        </th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                          Amount
                        </th>
                        <th className="py-3 px-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.map((enrollment) => (
                        <>
                          <tr
                            key={enrollment.enrollmentId || enrollment.id}
                            className="hover:bg-gray-50"
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                  <User className="w-4 h-4 text-gray-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {enrollment.fullName}
                                  </p>
                                  <p className="text-sm text-gray-600 truncate max-w-[150px]">
                                    {enrollment.email}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-gray-900 hidden md:table-cell">
                              <div className="max-w-[200px] truncate">
                                {enrollment.program}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                  enrollment.status,
                                )}`}
                              >
                                {getStatusIcon(enrollment.status)}
                                {enrollment.status
                                  .replace("_", " ")
                                  .charAt(0)
                                  .toUpperCase() +
                                  enrollment.status.replace("_", " ").slice(1)}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-gray-900 font-medium hidden lg:table-cell">
                              {formatCurrency(enrollment.totalAmount || 0)}
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    toggleStudentDetails(
                                      enrollment.enrollmentId || enrollment.id,
                                    )
                                  }
                                  className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                  title="View Details"
                                >
                                  {expandedStudent ===
                                  enrollment.enrollmentId ? (
                                    <EyeOff className="w-4 h-4" />
                                  ) : (
                                    <Eye className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => openEditModal(enrollment)}
                                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Details */}
                          <AnimatePresence>
                            {expandedStudent === enrollment.enrollmentId && (
                              <motion.tr
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-gray-50"
                              >
                                <td colSpan={5} className="p-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                      <div>
                                        <p className="text-sm font-medium text-gray-700 mb-2">
                                          Personal Information
                                        </p>
                                        <div className="space-y-1">
                                          <p className="text-sm text-gray-600 flex items-center gap-2">
                                            <Phone className="w-4 h-4" />
                                            {enrollment.phoneNumber}
                                          </p>
                                          <p className="text-sm text-gray-600 flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            {enrollment.city || "N/A"},{" "}
                                            {enrollment.country || "N/A"}
                                          </p>
                                          {enrollment.dateOfBirth && (
                                            <p className="text-sm text-gray-600">
                                              Age:{" "}
                                              {calculateAge(
                                                enrollment.dateOfBirth,
                                              )}{" "}
                                              years
                                            </p>
                                          )}
                                        </div>
                                      </div>

                                      <div>
                                        <p className="text-sm font-medium text-gray-700 mb-2">
                                          Business Information
                                        </p>
                                        <div className="space-y-1">
                                          <p className="text-sm text-gray-600">
                                            Has Business:{" "}
                                            {enrollment.hasBusiness === "yes"
                                              ? "Yes"
                                              : "No"}
                                          </p>
                                          {enrollment.businessName && (
                                            <p className="text-sm text-gray-600">
                                              Business:{" "}
                                              {enrollment.businessName}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="space-y-3">
                                      <div>
                                        <p className="text-sm font-medium text-gray-700 mb-2">
                                          Payment Information
                                        </p>
                                        <div className="space-y-1">
                                          <p className="text-sm text-gray-600">
                                            Method:{" "}
                                            {enrollment.paymentMethod ||
                                              "Not specified"}
                                          </p>
                                          <p className="text-sm text-gray-600">
                                            Registration:{" "}
                                            {formatCurrency(
                                              enrollment.registrationFee || 0,
                                            )}
                                          </p>
                                          <p className="text-sm text-gray-600">
                                            Course:{" "}
                                            {formatCurrency(
                                              enrollment.courseFee || 0,
                                            )}
                                          </p>
                                          <p className="text-sm font-medium text-gray-900">
                                            Total:{" "}
                                            {formatCurrency(
                                              enrollment.totalAmount || 0,
                                            )}
                                          </p>
                                        </div>
                                      </div>

                                      <div>
                                        <p className="text-sm font-medium text-gray-700 mb-2">
                                          Quick Actions
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                          <button
                                            onClick={() =>
                                              updateEnrollmentStatus(
                                                enrollment.enrollmentId ||
                                                  enrollment.id,
                                                "approved",
                                                true,
                                              )
                                            }
                                            disabled={
                                              updatingStatus ===
                                              enrollment.enrollmentId
                                            }
                                            className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                          >
                                            Approve
                                          </button>
                                          <button
                                            onClick={() =>
                                              updateEnrollmentStatus(
                                                enrollment.enrollmentId ||
                                                  enrollment.id,
                                                "scholarship",
                                                true,
                                              )
                                            }
                                            disabled={
                                              updatingStatus ===
                                              enrollment.enrollmentId
                                            }
                                            className="px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                          >
                                            Scholarship
                                          </button>
                                          <button
                                            onClick={() =>
                                              updateEnrollmentStatus(
                                                enrollment.enrollmentId ||
                                                  enrollment.id,
                                                "payment_complete",
                                                true,
                                              )
                                            }
                                            disabled={
                                              updatingStatus ===
                                              enrollment.enrollmentId
                                            }
                                            className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                          >
                                            Mark Paid
                                          </button>
                                          <button
                                            onClick={() =>
                                              updateEnrollmentStatus(
                                                enrollment.enrollmentId ||
                                                  enrollment.id,
                                                "rejected",
                                                true,
                                              )
                                            }
                                            disabled={
                                              updatingStatus ===
                                              enrollment.enrollmentId
                                            }
                                            className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                          >
                                            Reject
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </motion.tr>
                            )}
                          </AnimatePresence>
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination */}
            {!loading && enrollments.length > 0 && (
              <div className="p-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <p className="text-sm text-gray-600">
                    Showing {enrollments.length} of {totalStudents} students
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={currentPage === 1}
                      className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-2 text-sm font-medium text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      }
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Statistics */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Enrollment Stats</h3>
              <PieChart className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              {stats?.byStatus ? (
                Object.entries(stats.byStatus).map(([status, count]) => (
                  <div
                    key={status}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          getStatusColor(status).split(" ")[0]
                        }`}
                      >
                        {getStatusIcon(status)}
                      </div>
                      <span className="text-sm text-gray-900 capitalize">
                        {status.replace("_", " ")}
                      </span>
                    </div>
                    <span className="font-medium text-gray-900">{count}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  No stats available
                </p>
              )}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Upcoming Events</h3>
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {upcomingEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {event.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-600">
                        <Calendar className="w-3 h-3" />
                        <span>{event.date}</span>
                        <span>•</span>
                        <span>{event.time}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium">
              View All Events
            </button>
          </div>

          {/* Export Options */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Export Data</h3>
            <div className="grid grid-cols-2 gap-3">
              {exportOptions.map((option) => (
                <button
                  key={option.label}
                  className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors flex flex-col items-center"
                >
                  <option.icon className="w-4 h-4 text-gray-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">
                    {option.label}
                  </span>
                  <span className="text-xs text-gray-500 mt-1">
                    {option.format}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editingStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Edit Student
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Update student information
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingStudent(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-4">
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={editingStudent.fullName}
                        onChange={(e) =>
                          setEditingStudent({
                            ...editingStudent,
                            fullName: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={editingStudent.email}
                        onChange={(e) =>
                          setEditingStudent({
                            ...editingStudent,
                            email: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={editingStudent.phoneNumber}
                        onChange={(e) =>
                          setEditingStudent({
                            ...editingStudent,
                            phoneNumber: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        value={editingStudent.status}
                        onChange={(e) =>
                          setEditingStudent({
                            ...editingStudent,
                            status: e.target.value as any,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="scholarship">Scholarship</option>
                        <option value="payment_complete">
                          Payment Complete
                        </option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 mb-4">
                    Program Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Program
                      </label>
                      <input
                        type="text"
                        value={editingStudent.program}
                        onChange={(e) =>
                          setEditingStudent({
                            ...editingStudent,
                            program: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Delivery Format
                      </label>
                      <select
                        value={editingStudent.deliveryFormat}
                        onChange={(e) =>
                          setEditingStudent({
                            ...editingStudent,
                            deliveryFormat: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
                      >
                        <option value="in-class">In-Class</option>
                        <option value="online">Online</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <input
                      type="checkbox"
                      id="scholarship"
                      checked={editingStudent.scholarship || false}
                      onChange={(e) =>
                        setEditingStudent({
                          ...editingStudent,
                          scholarship: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-gray-900 rounded focus:ring-gray-200"
                    />
                    <label
                      htmlFor="scholarship"
                      className="text-sm font-medium text-gray-900"
                    >
                      Award Scholarship
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Admin Notes
                    </label>
                    <textarea
                      value={editingStudent.notes || ""}
                      onChange={(e) =>
                        setEditingStudent({
                          ...editingStudent,
                          notes: e.target.value,
                        })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200"
                      placeholder="Add any notes about this student..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingStudent(null);
                    setError(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  disabled={savingChanges}
                >
                  Cancel
                </button>
                <button
                  onClick={saveStudentChanges}
                  disabled={savingChanges}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center gap-2"
                >
                  {savingChanges ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
