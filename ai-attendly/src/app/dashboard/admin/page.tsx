"use client";

import { useState } from "react";
import DashboardShell from "@/components/dashboard-shell";
import { Users, UserPlus, Settings, Shield, Search } from "lucide-react";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("students");

  return (
    <DashboardShell>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Admin Control Center</h1>
            <p className="text-slate-500">Manage users, department configuration, and OD limits.</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
              <UserPlus size={18} /> Add User
            </button>
          </div>
        </div>

        <div className="flex border-b border-slate-200">
          <TabButton active={activeTab === "students"} onClick={() => setActiveTab("students")} label="Students" icon={<Users size={16}/>} />
          <TabButton active={activeTab === "faculty"} onClick={() => setActiveTab("faculty")} label="Faculty" icon={<Shield size={16}/>} />
          <TabButton active={activeTab === "limits"} onClick={() => setActiveTab("limits")} label="OD Limits" icon={<Settings size={16}/>} />
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[400px]">
          {activeTab === "students" && (
            <div className="space-y-6">
              <div className="relative">
                <input type="text" placeholder="Search by name or ID..." className="input-field pl-10" />
                <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
              </div>
              <div className="text-center py-20 text-slate-400 italic">Student database is currently empty.</div>
            </div>
          )}
          
          {activeTab === "faculty" && (
            <div className="text-center py-20 text-slate-400 italic font-bold">Faculty management module loading...</div>
          )}

          {activeTab === "limits" && (
            <div className="max-w-md mx-auto space-y-6 pt-10">
              <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2 italic uppercase text-sm tracking-widest">Year-wise Daily OD Limits</h3>
              {[1, 2, 3, 4].map(year => (
                <div key={year} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-700">Year {year}</span>
                  <div className="flex items-center gap-4">
                    <input type="number" defaultValue={20 + (year * 5)} className="w-20 px-3 py-1.5 border border-slate-200 rounded-lg text-center font-bold text-slate-800 focus:ring-2 focus:ring-blue-500" />
                    <span className="text-xs text-slate-400 italic">slots/day</span>
                  </div>
                </div>
              ))}
              <button className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all uppercase tracking-widest text-xs italic">Save Configuration</button>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

function TabButton({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: any }) {
  return (
    <button 
      onClick={onClick}
      className={`px-8 py-4 flex items-center gap-2 font-bold text-sm italic transition-all border-b-2 ${active ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
    >
      {icon}
      {label}
    </button>
  );
}
