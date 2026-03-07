"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/dashboard-shell";
import { useAuth } from "@/context/auth-context";
import { StatCard } from "@/components/stat-card";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy, limit, Timestamp } from "firebase/firestore";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from "recharts";
import { Activity, Users, Clock, AlertCircle, TrendingUp, Loader2 } from "lucide-react";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export default function DashboardPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    approvedToday: 0,
    pending: 0,
    flagged: 0
  });

  const [trendData, setTrendData] = useState<any[]>([]);
  const [yearData, setYearData] = useState<any[]>([]);
  const [recentRequests, setRecentRequests] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;

    // 1. Real-time Stats & Trends Listener
    const q = profile.role === "mentor" 
      ? query(collection(db, "od_requests"), where("mentor_id", "==", profile.username))
      : profile.role === "hod"
        ? query(collection(db, "od_requests"))
        : query(collection(db, "od_requests"), where("student_id", "==", profile.username));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => doc.data());
      
      // Calculate Stats
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      
      const total = docs.length;
      const approvedToday = docs.filter(d => d.hod_status === "approved" && d.updated_at?.toDate().toISOString().split("T")[0] === todayStr).length;
      const pending = docs.filter(d => (profile.role === "mentor" ? d.mentor_status === "pending" : d.hod_status === "pending")).length;
      const flagged = docs.filter(d => d.verification_status === "flagged").length;

      setStats({ total, approvedToday, pending, flagged });

      // Calculate Trend (Last 7 Days)
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const last7Days = Array.from({length: 7}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return { 
          name: days[d.getDay()], 
          date: d.toISOString().split("T")[0],
          count: 0 
        };
      });

      docs.forEach(doc => {
        const docDate = doc.created_at?.toDate().toISOString().split("T")[0];
        const dayMatch = last7Days.find(d => d.date === docDate);
        if (dayMatch) dayMatch.count++;
      });
      setTrendData(last7Days);

      // Calculate Year Distribution
      const years: Record<string, number> = { "1st Year": 0, "2nd Year": 0, "3rd Year": 0, "4th Year": 0 };
      docs.forEach(doc => {
        const year = doc.student_year || "Unknown";
        if (years[`${year}${year === "1" ? "st" : year === "2" ? "nd" : year === "3" ? "rd" : "th"} Year`] !== undefined) {
          years[`${year}${year === "1" ? "st" : year === "2" ? "nd" : year === "3" ? "rd" : "th"} Year`]++;
        }
      });
      setYearData(Object.entries(years).map(([name, value]) => ({ name, value })));

      // Recent Requests (Latest 5)
      const sorted = [...snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }))]
        .sort((a, b) => (b.created_at?.toMillis() || 0) - (a.created_at?.toMillis() || 0))
        .slice(0, 5);
      setRecentRequests(sorted);

      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

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
               {loading ? <Loader2 className="w-4 h-4 text-blue-600 animate-spin" /> : <TrendingUp className="w-4 h-4 text-blue-600" />}
               <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">{loading ? "Fetching..." : "Live Metrics"}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Applications" value={String(stats.total)} color="blue" icon={<Users size={20} />} />
          <StatCard title="Approved Today" value={String(stats.approvedToday)} color="green" icon={<TrendingUp size={20} />} />
          <StatCard title="Pending Action" value={String(stats.pending)} color="orange" icon={<Clock size={20} />} />
          <StatCard title="Flagged Proofs" value={String(stats.flagged)} color="red" icon={<AlertCircle size={20} />} />
        </div>

        {(profile.role === "hod" || profile.role === "mentor") && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Weekly Trend - PowerBI Style */}
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
               {loading && (
                 <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                    <Loader2 className="animate-spin text-blue-600" />
                 </div>
               )}
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-slate-800 text-lg">Daily Request Trend</h3>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Last 7 Days</span>
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
                      animationDuration={1500}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Year-wise Distribution */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                {loading && (
                 <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                    <Loader2 className="animate-spin text-blue-600" />
                 </div>
               )}
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
                     <span className="text-xs font-bold text-slate-800">{item.value}</span>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}

        {/* Recent Activity Table - PowerBI List Style */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden relative">
           {loading && (
             <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" />
             </div>
           )}
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
                {recentRequests.length > 0 ? recentRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 italic font-semibold text-slate-800">{req.student_id}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{req.event_name}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-bold">
                       {req.created_at?.toDate().toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                        req.hod_status === "approved" ? "bg-green-50 text-green-600 border-green-100" :
                        req.hod_status === "rejected" ? "bg-red-50 text-red-600 border-red-100" :
                        "bg-orange-50 text-orange-600 border-orange-100"
                      }`}>
                        {req.hod_status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No transactions found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

// Root level StatCard component removed, now imported.
