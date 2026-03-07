"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/dashboard-shell";
import { useAuth } from "@/context/auth-context";
import { StatCard } from "@/components/stat-card";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from "recharts";
import { Activity, Users, Clock, AlertCircle, TrendingUp } from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export default function DashboardPage() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0
  });

  // Mock data for charts
  const trendData = [
    { name: "Mon", count: 12 },
    { name: "Tue", count: 25 },
    { name: "Wed", count: 40 },
    { name: "Thu", count: 18 },
    { name: "Fri", count: 32 },
  ];

  const yearData = [
    { name: "1st Year", value: 40 },
    { name: "2nd Year", value: 30 },
    { name: "3rd Year", value: 20 },
    { name: "4th Year", value: 10 },
  ];

  if (!profile) return null;

  return (
    <DashboardShell>
      <div className="space-y-6 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Analytics Hub</h1>
            <p className="text-slate-500 italic">Real-time department insights & OD tracking.</p>
          </div>
          <div className="flex gap-2">
            <div className="bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 flex items-center gap-2">
               <Activity className="w-4 h-4 text-blue-600" />
               <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Live Metrics</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Applications" value="154" color="blue" icon={<Users size={20} />} />
          <StatCard title="Approved Today" value="12" color="green" icon={<TrendingUp size={20} />} />
          <StatCard title="Pending Action" value="8" color="orange" icon={<Clock size={20} />} />
          <StatCard title="Flagged Proofs" value="3" color="red" icon={<AlertCircle size={20} />} />
        </div>

        {(profile.role === "hod" || profile.role === "mentor") && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Weekly Trend - PowerBI Style */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 text-lg">OD Frequency Trend</h3>
                <select className="bg-slate-50 border-none text-[10px] font-bold uppercase tracking-widest text-slate-500 rounded-lg px-2 py-1">
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                </select>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 600 }}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#3b82f6" 
                      strokeWidth={4} 
                      dot={{ r: 6, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Year-wise Distribution */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
               <h3 className="font-bold text-slate-800 text-lg mb-6">Yearly Distribution</h3>
               <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={yearData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {yearData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
               </div>
               <div className="space-y-2 mt-4">
                 {yearData.map((item, i) => (
                   <div key={item.name} className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                       <span className="text-xs font-semibold text-slate-600">{item.name}</span>
                     </div>
                     <span className="text-xs font-bold text-slate-800">{item.value}%</span>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}

        {/* Recent Activity Table - PowerBI List Style */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Recent Transactions</h3>
            <button className="text-blue-600 text-xs font-bold hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Event</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[1, 2, 3].map((i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 italic font-semibold text-slate-800">SEC23AD17{i}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">Tech Symposium 2026</td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-bold">Mar 1{i}, 2026</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-bold border border-green-100 uppercase tracking-wider">Approved</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

// Root level StatCard component removed, now imported.
