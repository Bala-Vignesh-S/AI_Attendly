"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/dashboard-shell";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Loader2, Info, X, Calendar as CalendarIcon, Users, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CalendarPage() {
  const { profile } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [limits, setLimits] = useState<any>({});
  const [selectedDate, setSelectedDate] = useState<any>(null);
  const [dailyCounts, setDailyCounts] = useState<any[]>([]);

  useEffect(() => {
    // 1. Fetch Year Limits
    const unsubLimits = onSnapshot(collection(db, "year_limits"), (snap) => {
      const l: any = {};
      snap.docs.forEach(doc => l[doc.id] = doc.data().limit);
      setLimits(l);
    });

    // 2. Fetch Daily Counts for Heatmap
    const unsubCounts = onSnapshot(collection(db, "od_daily_counts"), (snap) => {
      setDailyCounts(snap.docs.map(doc => ({ date: doc.id, ...doc.data() })));
    });

    // 3. Fetch approved ODs for calendar
    const q = query(collection(db, "od_requests"), where("hod_status", "==", "approved"));
    const unsubODs = onSnapshot(q, (snap) => {
      const mappedEvents = snap.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          title: `${d.student_id} - ${d.event_name}`,
          start: d.start_date,
          end: d.end_date,
          backgroundColor: profile?.role === "student" && d.student_id === profile.username ? "#10b981" : "#3b82f6",
          borderColor: "transparent",
          extendedProps: d
        };
      });
      setEvents(mappedEvents);
      setIsLoading(false);
    });

    return () => { unsubLimits(); unsubCounts(); unsubODs(); };
  }, [profile]);

  const handleDateClick = (info: any) => {
    const dateStr = info.dateStr;
    const countData = dailyCounts.find(c => c.date === dateStr) || {};
    const dateEvents = events.filter(e => e.start === dateStr || (e.start <= dateStr && e.end >= dateStr));
    
    setSelectedDate({
      date: dateStr,
      counts: countData,
      events: dateEvents
    });
  };

  return (
    <DashboardShell>
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Interactive Calendar</h1>
            <p className="text-slate-500 italic">Click any date to view slot details and conflicts.</p>
          </div>
          
          <div className="flex flex-wrap gap-4 bg-white p-3 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
              <span className="w-3 h-3 bg-blue-500 rounded-full" /> Dept ODs
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
              <span className="w-3 h-3 bg-green-500 rounded-full" /> Your ODs
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600 w-12 h-12" /></div>
        ) : (
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-100 relative overflow-hidden">
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              events={events}
              dateClick={handleDateClick}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: ""
              }}
              height="auto"
              dayMaxEvents={2}
              eventClassNames="rounded-lg px-2 py-0.5 text-[10px] font-bold italic shadow-sm"
              dayCellClassNames={(arg) => {
                 const dateStr = arg.date.toISOString().split("T")[0];
                 const count = dailyCounts.find(c => c.date === dateStr)?.total || 0;
                 if (count > 20) return "bg-red-50/50";
                 if (count > 10) return "bg-orange-50/50";
                 return "";
              }}
            />
          </div>
        )}

        <AnimatePresence>
          {selectedDate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200"
              >
                <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                   <div className="flex items-center gap-3">
                     <CalendarIcon className="text-blue-400" />
                     <h2 className="text-xl font-bold">{new Date(selectedDate.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</h2>
                   </div>
                   <button onClick={() => setSelectedDate(null)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                     <X size={20} />
                   </button>
                </div>

                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(y => (
                      <div key={y} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Year {y} Slots</p>
                        <div className="flex items-end justify-between">
                          <span className="text-2xl font-bold text-slate-800">{selectedDate.counts[y] || 0}</span>
                          <span className="text-[10px] font-bold text-slate-400 mb-1">/ {limits[y] || 25} Limit</span>
                        </div>
                        <div className="mt-2 w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                            style={{ width: `${((selectedDate.counts[y] || 0) / (limits[y] || 25)) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                       <Users size={14} /> Approved Students ({selectedDate.events.length})
                    </h3>
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {selectedDate.events.length > 0 ? selectedDate.events.map((e: any) => (
                        <div key={e.id} className="flex items-center justify-between p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-800">{e.extendedProps.student_name}</span>
                            <span className="text-[10px] text-slate-500 italic font-medium">{e.extendedProps.student_id}</span>
                          </div>
                          <span className="text-[10px] bg-white text-blue-600 px-2 py-1 rounded-lg border border-blue-200 font-bold italic truncate max-w-[120px]">
                            {e.extendedProps.event_name}
                          </span>
                        </div>
                      )) : (
                        <p className="text-sm text-slate-400 italic text-center py-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">No ODs scheduled for this date.</p>
                      )}
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setSelectedDate(null)}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={18} /> Done
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="bg-blue-600 p-8 rounded-[2.5rem] text-white flex items-start gap-6 shadow-xl shadow-blue-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
          <Info className="text-blue-100 shrink-0 mt-1" size={24} />
          <div className="space-y-2 relative">
            <h3 className="font-bold text-lg">Department Slot Policy</h3>
            <p className="text-sm text-blue-100 italic leading-relaxed">
              OD limits are enforcing strictly at the department level. Daily caps help maintain academic attendance balance. 
              Colored cells indicate high-load dates where new applications might be waitlisted.
            </p>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
