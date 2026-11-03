// app/components/dashboard/admin/AdminOverview.tsx
"use client";

import { motion } from "framer-motion";
import {
  Users,
  BookOpen,
  DollarSign,
  TrendingUp,
  BarChart,
  Calendar,
  Award,
  Clock,
  ChevronRight,
} from "lucide-react";

export default function AdminOverview() {
  const stats = [
    {
      title: "Total Students",
      value: "247",
      change: "+12%",
      icon: Users,
      color: "bg-blue-500",
      trend: "up",
    },
    {
      title: "Active Courses",
      value: "18",
      change: "+2",
      icon: BookOpen,
      color: "bg-purple-500",
      trend: "up",
    },
    {
      title: "Revenue",
      value: "$45,280",
      change: "+18%",
      icon: DollarSign,
      color: "bg-green-500",
      trend: "up",
    },
    {
      title: "Completion Rate",
      value: "94%",
      change: "+3%",
      icon: TrendingUp,
      color: "bg-amber-500",
      trend: "up",
    },
  ];

  const recentActivities = [
    {
      id: 1,
      user: "Maria Rodriguez",
      action: "enrolled in Advanced Perfumery",
      time: "10 minutes ago",
      type: "enrollment",
    },
    {
      id: 2,
      user: "John Smith",
      action: "completed Fragrance Chemistry",
      time: "1 hour ago",
      type: "completion",
    },
    {
      id: 3,
      user: "Sarah Chen",
      action: "submitted final project",
      time: "2 hours ago",
      type: "submission",
    },
    {
      id: 4,
      user: "Alex Johnson",
      action: "made payment for Course Bundle",
      time: "4 hours ago",
      type: "payment",
    },
  ];

  const quickActions = [
    { title: "Add New Course", icon: BookOpen, color: "bg-purple-100" },
    { title: "Send Announcement", icon: Users, color: "bg-blue-100" },
    { title: "Generate Report", icon: BarChart, color: "bg-green-100" },
    { title: "View Analytics", icon: TrendingUp, color: "bg-amber-100" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, Admin
            </h1>
            <p className="text-gray-600 mt-2">
              Here's what's happening with your academy today.
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Today</div>
            <div className="text-lg font-semibold text-gray-900">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`p-3 rounded-xl ${stat.color.replace(
                  "bg-",
                  "bg-"
                )} bg-opacity-10`}
              >
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  stat.trend === "up"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {stat.change}
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
            <p className="text-gray-600 mt-1">{stat.title}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
              <button className="text-sm font-medium text-[#691C33] hover:text-[#8A2B4A]">
                View all
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <button
                  key={action.title}
                  className="p-4 rounded-xl border border-gray-200 hover:border-[#691C33] hover:shadow-sm transition-all text-left"
                >
                  <div className={`p-3 rounded-lg ${action.color} w-fit mb-3`}>
                    <action.icon className="w-5 h-5 text-gray-700" />
                  </div>
                  <h3 className="font-semibold text-gray-900">
                    {action.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Click to get started
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Recent Activities
              </h2>
              <button className="text-sm font-medium text-[#691C33] hover:text-[#8A2B4A]">
                See all
              </button>
            </div>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg"
                >
                  <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-semibold">{activity.user}</span>{" "}
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Upcoming Events</h2>
          <button className="text-sm font-medium text-[#691C33] hover:text-[#8A2B4A] flex items-center gap-1">
            View Calendar <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-4">
          {[
            {
              title: "Advanced Perfumery Workshop",
              date: "Tomorrow, 10:00 AM",
              participants: 24,
            },
            {
              title: "Student Progress Review",
              date: "Dec 20, 2:00 PM",
              participants: 18,
            },
            {
              title: "New Course Launch",
              date: "Dec 22, 11:00 AM",
              participants: "All Students",
            },
          ].map((event, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-[#691C33] transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-50">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{event.title}</h3>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {event.date}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Participants</div>
                <div className="font-semibold text-gray-900">
                  {event.participants}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
