"use client";

import DashboardShell from "@/components/dashboard-shell";
import { useAuth } from "@/context/auth-context";
import { StatCard } from "@/components/stat-card"; // Moving StatCard to a separate component or defining it local

export default function DashboardPage() {
  const { profile } = useAuth();
  
  if (!profile) return null;

  const roleConfigs: Record<string, { welcome: string, desc: string }> = {
    student: { welcome: "Welcome back, Student!", desc: "Here's an overview of your OD applications." },
    mentor: { welcome: "Faculty Dashboard", desc: "Review and manage your mentee OD requests." },
    hod: { welcome: "Department Overview", desc: "Finalize approvals and monitor department OD limits." },
    admin: { welcome: "System Administration", desc: "Manage students, faculty, and system-wide settings." },
  };

  const config = roleConfigs[profile.role] || roleConfigs.student;

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{config.welcome}</h1>
            <p className="text-slate-500">{config.desc}</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-slate-600">System Online</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {profile.role === "student" ? (
            <>
              <StatCard title="Total Requests" value="0" color="blue" />
              <StatCard title="Approved" value="0" color="green" />
              <StatCard title="Pending" value="0" color="orange" />
              <StatCard title="Rejected" value="0" color="red" />
            </>
          ) : profile.role === "mentor" ? (
            <>
              <StatCard title="Pending Review" value="0" color="orange" />
              <StatCard title="Total Mentees" value="50" color="blue" />
              <StatCard title="Verified Today" value="0" color="green" />
              <StatCard title="Action Required" value="0" color="red" />
            </>
          ) : (
            <>
              <StatCard title="Pending Approvals" value="0" color="orange" />
              <StatCard title="Total OD Requests" value="120" color="blue" />
              <StatCard title="Verified Proofs" value="45" color="green" />
              <StatCard title="System Alerts" value="0" color="red" />
            </>
          )}
        </div>

        {/* Calendar logic will be added here next */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 min-h-[400px] flex items-center justify-center text-slate-400 italic">
          Calendar Component Loading...
        </div>
      </div>
    </DashboardShell>
  );
}

// Root level StatCard component removed, now imported.
