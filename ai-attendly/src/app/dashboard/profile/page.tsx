"use client";

import DashboardShell from "@/components/dashboard-shell";
import { useAuth } from "@/context/auth-context";
import { User, BadgeCheck, BookOpen, UserCheck, Calendar as CalendarIcon, Mail } from "lucide-react";
import { StatCard } from "@/components/stat-card";

export default function ProfilePage() {
  const { profile } = useAuth();

  if (!profile) return null;

  // Mock data for demo if needed
  const studentData = {
    register_number: "2023010179",
    year: 2,
    section: "B",
    mentor_name: "Jeena Mentor",
    total_applied: 15,
    approved: 12,
    rejected: 3
  };

  return (
    <DashboardShell>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="w-24 h-24 bg-blue-100 rounded-3xl flex items-center justify-center text-blue-600 font-bold text-3xl shadow-inner">
            {profile.name.charAt(0)}
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold text-slate-800">{profile.name}</h1>
              <BadgeCheck className="text-blue-500 fill-blue-50" size={24} />
            </div>
            <p className="text-slate-500 font-medium flex items-center gap-2">
              <User size={16} /> {profile.username} • Student ID
            </p>
            <div className="flex flex-wrap gap-4 mt-2">
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider">
                Year {studentData.year}
              </span>
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider">
                Section {studentData.section}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="Total applied" value={String(studentData.total_applied)} color="blue" />
          <StatCard title="Approved OD" value={String(studentData.approved)} color="green" />
          <StatCard title="Rejected OD" value={String(studentData.rejected)} color="red" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4">
              <BookOpen size={20} className="text-blue-600" />
              Academic Information
            </h2>
            <div className="space-y-4">
              <InfoRow label="Register Number" value={studentData.register_number} />
              <InfoRow label="Department" value="Artificial Intelligence & Data Science" />
              <InfoRow label="Year / Section" value={`${studentData.year} / ${studentData.section}`} />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-4">
              <UserCheck size={20} className="text-blue-600" />
              Mentorship Info
            </h2>
            <div className="space-y-4">
              <InfoRow label="Mentor Name" value={studentData.mentor_name} />
              <InfoRow label="Mentor ID" value="jeena.ai" />
              <div className="pt-2">
                <button className="flex items-center gap-2 text-blue-600 font-semibold text-sm hover:underline">
                  <Mail size={14} /> Contact Mentor
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function InfoRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center py-2">
      <span className="text-slate-500 text-sm">{label}</span>
      <span className="text-slate-800 font-semibold">{value}</span>
    </div>
  );
}
