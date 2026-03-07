"use client";

import { useEffect, useState } from "react";
import DashboardShell from "@/components/dashboard-shell";
import { useAuth } from "@/context/auth-context";
import { StatCard } from "@/components/stat-card";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy, limit, getDocs } from "firebase/firestore";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from "recharts";
import { 
  Activity, Users, Clock, AlertCircle, TrendingUp, Loader2, 
  Calendar as CalendarIcon, Trophy, Award, Medal, ChevronRight,
  Filter
} from "lucide-react";
import { motion } from "framer-motion";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export default function DashboardPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0]
  });

  const [stats, setStats] = useState({
    total: 0,
    approvedToday: 0,
    wins: 0,
    participation: 0
  });

  const [multiTrendData, setMultiTrendData] = useState<any[]>([]);
  const [gaugeData, setGaugeData] = useState<any[]>([]);
  const [wallOfHonour, setWallOfHonour] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    if (!profile) return;

    // 1. Fetch Leaderboard (Department-wide for HOD, or global)
    const unsubLeaderboard = onSnapshot(
      query(collection(db, "users"), where("role", "==", "student"), orderBy("wins", "desc"), limit(5)),
      (snap) => {
        setLeaderboard(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    );

    // 2. Fetch Wall of Honour (Recent Wins)
    const unsubWall = onSnapshot(
      query(collection(db, "od_requests"), where("outcome", "==", "win"), orderBy("verified_at", "desc"), limit(8)),
      (snap) => {
        setWallOfHonour(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    );

    // 3. Main Dashboard Data Listener
    const q = profile.role === "mentor" 
      ? query(collection(db, "od_requests"), where("mentor_id", "==", profile.username))
      : profile.role === "hod" || profile.role === "admin"
        ? query(collection(db, "od_requests"))
        : query(collection(db, "od_requests"), where("student_id", "==", profile.username));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => doc.data());
      
      // Calculate Stats (Filtered by Date Range if needed, or overall for certain stats)
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      
      setStats({
        total: docs.length,
        approvedToday: docs.filter(d => d.hod_status === "approved" && d.updated_at?.toDate().toISOString().split("T")[0] === todayStr).length,
        wins: profile.role === "student" ? (profile.wins || 0) : docs.filter(d => d.outcome === "win").length,
        participation: profile.role === "student" ? (profile.losses || 0) : docs.filter(d => d.outcome === "participation").length
      });

      // 4. Calculate Multi-Line Trend (Years 2, 3, 4)
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const chartPoints = Array.from({length: 7}, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dateStr = d.toISOString().split("T")[0];
        return { 
          name: days[d.getDay()], 
          date: dateStr,
          year2: docs.filter(doc => (doc.student_year === "2" || doc.student_year === 2) && (doc.start_date <= dateStr && doc.end_date >= dateStr)).length,
          year3: docs.filter(doc => (doc.student_year === "3" || doc.student_year === 3) && (doc.start_date <= dateStr && doc.end_date >= dateStr)).length,
          year4: docs.filter(doc => (doc.student_year === "4" || doc.student_year === 4) && (doc.start_date <= dateStr && doc.end_date >= dateStr)).length,
        };
      });
      setMultiTrendData(chartPoints);

      // 5. Gauge Data (Slot Saturation) - Using Year Limits
      async function fetchGauges() {
         const limitsSnap = await getDocs(collection(db, "year_limits"));
         const limits: any = {};
         limitsSnap.docs.forEach(d => limits[d.id] = d.data().limit);
         
         const gauges = [2, 3, 4].map(y => {
            const used = docs.filter(d => (d.student_year == y) && (d.start_date <= todayStr && d.end_date >= todayStr)).length;
            const limitVal = limits[y] || 25;
            return {
               year: `Year ${y}`,
               value: used,
               limit: limitVal,
               percent: Math.min(100, (used / limitVal) * 100)
            };
         });
         setGaugeData(gauges);
      }
      fetchGauges();

      setLoading(false);
    });

    return () => { unsubscribe(); unsubWall(); unsubLeaderboard(); };
  }, [profile]);

  if (!profile) return null;

  return (
    <DashboardShell>
      <div className="space-y-8 pb-12">
        {/* Header with Date Filter */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Department IQ</h1>
            <p className="text-slate-500 font-bold italic mt-1 flex items-center gap-2">
              <Activity size={16} className="text-blue-600" /> Advanced PowerBI Analytics Dashboard
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl">
                <CalendarIcon size={14} className="text-slate-400" />
                <input 
                  type="date" 
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                  className="bg-transparent border-none text-[10px] font-bold text-slate-600 focus:ring-0 w-24"
                />
             </div>
             <ChevronRight size={14} className="text-slate-300" />
             <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl">
                <CalendarIcon size={14} className="text-slate-400" />
                <input 
                  type="date" 
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                  className="bg-transparent border-none text-[10px] font-bold text-slate-600 focus:ring-0 w-24"
                />
             </div>
             <button className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all">
                <Filter size={16} />
             </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Dept. Workload" value={String(stats.total)} color="blue" icon={<Users size={20} />} />
          <StatCard title="Approved Today" value={String(stats.approvedToday)} color="green" icon={<TrendingUp size={20} />} />
          <StatCard title="Wall of Fame" value={String(stats.wins)} color="orange" icon={<Trophy size={20} />} />
          <StatCard title="Active Participants" value={String(stats.participation)} color="red" icon={<Award size={20} />} />
        </div>

        {/* Charts Row */}
        {(profile.role === "hod" || profile.role === "mentor" || profile.role === "admin") && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Multi-Line Trend Chart */}
            <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100 relative overflow-hidden">
               <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-bold text-slate-800">Cross-Year OD Comparison</h3>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-blue-500" />
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Year 2</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-emerald-500" />
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Year 3</span>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-orange-500" />
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Year 4</span>
                    </div>
                  </div>
               </div>
               <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={multiTrendData}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: "#94a3b8", fontSize: 11, fontWeight: 700}} dy={10} />
                       <YAxis axisLine={false} tickLine={false} tick={{fill: "#94a3b8", fontSize: 11, fontWeight: 700}} />
                       <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                       <Line type="monotone" dataKey="year2" stroke="#3b82f6" strokeWidth={4} dot={{r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff'}} />
                       <Line type="monotone" dataKey="year3" stroke="#10b981" strokeWidth={4} dot={{r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} />
                       <Line type="monotone" dataKey="year4" stroke="#f59e0b" strokeWidth={4} dot={{r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#fff'}} />
                    </LineChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* Gauge Rings / Saturation */}
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-blue-50 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/20 rounded-full blur-3xl -mr-20 -mt-20" />
               <h3 className="text-xl font-bold mb-8 relative">Slot Saturation</h3>
               <div className="space-y-8 relative">
                  {gaugeData.map((g, i) => (
                    <div key={g.year} className="space-y-2">
                       <div className="flex justify-between items-end">
                          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{g.year}</span>
                          <span className="text-lg font-black">{g.value}<span className="text-[10px] text-slate-500 font-bold ml-1">/ {g.limit}</span></span>
                       </div>
                       <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${g.percent}%` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className={`h-full rounded-full ${g.percent > 90 ? 'bg-red-500' : g.percent > 60 ? 'bg-orange-500' : 'bg-blue-500'}`}
                          />
                       </div>
                    </div>
                  ))}
               </div>
               <div className="mt-12 p-4 bg-white/5 rounded-2xl border border-white/10 italic text-[10px] font-bold text-slate-400 leading-relaxed">
                  Real-time data synchronization ensures zero double-booking across years.
               </div>
            </div>
          </div>
        )}

        {/* Gamified Section: Wall of Honour & Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {/* Wall of Honour */}
           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100">
              <div className="flex items-center gap-3 mb-8">
                 <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500">
                    <Medal size={24} />
                 </div>
                 <h3 className="text-2xl font-black text-slate-900 tracking-tight">Wall of Honour</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 {wallOfHonour.map((win) => (
                    <motion.div 
                      key={win.id}
                      whileHover={{ y: -4 }}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center text-center gap-2 hover:bg-blue-50/50 hover:border-blue-100 transition-all"
                    >
                       <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-700 font-bold text-xs border border-slate-200 shadow-sm">
                          {win.student_name.charAt(0)}
                       </div>
                       <span className="text-xs font-bold text-slate-800 truncate w-full">{win.student_name}</span>
                       <span className="text-[10px] text-slate-400 italic font-medium truncate w-full">"{win.event_name}"</span>
                       <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle2 size={12} />
                          <span className="text-[8px] font-black uppercase tracking-widest">SUCCESS</span>
                       </div>
                    </motion.div>
                 ))}
                 {wallOfHonour.length === 0 && (
                    <div className="col-span-2 py-12 text-center text-slate-400 italic">No victories recorded in this period yet.</div>
                 )}
              </div>
           </div>

           {/* Top Performers Leaderboard */}
           <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden">
              <div className="flex items-center gap-3 mb-8">
                 <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
                    <Trophy size={24} />
                 </div>
                 <h3 className="text-2xl font-black tracking-tight">Dept. Leaderboard</h3>
              </div>

              <div className="space-y-4">
                 {leaderboard.map((student, i) => (
                    <div key={student.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group">
                       <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm ${i === 0 ? 'bg-yellow-500 text-slate-900' : 'bg-slate-800 text-white'}`}>
                             {i + 1}
                          </div>
                          <div className="flex flex-col">
                             <span className="text-sm font-bold group-hover:text-blue-400 transition-colors uppercase tracking-tight">{student.name}</span>
                             <span className="text-[10px] text-slate-500 italic font-bold">Year {student.year} • Sec {student.section}</span>
                          </div>
                       </div>
                       <div className="flex flex-col items-end">
                          <span className="text-lg font-black text-blue-500">{student.wins || 0}</span>
                          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">WINS</span>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function CheckCircle2({ size }: { size: number }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
