"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/dashboard-shell";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { Loader2, Info } from "lucide-react";

export default function CalendarPage() {
  const { profile } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [limits, setLimits] = useState<any>({});

  useEffect(() => {
    // 1. Fetch Year Limits
    const unsubLimits = onSnapshot(collection(db, "year_limits"), (snap) => {
      const l: any = {};
      snap.docs.forEach(doc => l[doc.id] = doc.data().limit);
      setLimits(l);
    });

    // 2. Fetch approved ODs for calendar
    const q = query(collection(db, "od_requests"), where("hod_status", "==", "approved"));
    const unsubODs = onSnapshot(q, (snap) => {
      const colorLogic = (req: any) => {
        if (profile?.role === "student") return "green";
        if (profile?.role === "mentor" && req.mentor_id === profile.username) return "blue";
        return "orange";
      };

      const mappedEvents = snap.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          title: d.event_name,
          start: d.start_date,
          end: d.end_date,
          backgroundColor: colorLogic(d),
          borderColor: "transparent",
          extendedProps: d
        };
      });
      setEvents(mappedEvents);
      setIsLoading(false);
    });

    return () => { unsubLimits(); unsubODs(); };
  }, [profile]);

  return (
    <DashboardShell>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">OD Calendar</h1>
            <p className="text-slate-500">Year-wise limits and scheduled On-Duty dates.</p>
          </div>
          
          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 italic">
              <span className="w-3 h-3 bg-green-500 rounded-full" /> Slot Available
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 italic">
              <span className="w-3 h-3 bg-orange-500 rounded-full" /> Partial Full
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 italic">
              <span className="w-3 h-3 bg-red-500 rounded-full" /> Limit Reached
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600 w-12 h-12" /></div>
        ) : (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              events={events}
              headerToolbar={{
                left: "prev,next today",
                center: "title",
                right: ""
              }}
              height="auto"
              eventClick={(info) => {
                alert(`Event: ${info.event.title}\nBy: ${info.event.extendedProps.student_name}`);
              }}
            />
          </div>
        )}

        <div className="bg-slate-900 p-6 rounded-2xl text-white flex items-start gap-4">
          <Info className="text-blue-400 shrink-0 mt-1" />
          <div className="space-y-1">
            <h3 className="font-bold text-sm">System Policy</h3>
            <p className="text-xs text-slate-400 italic">
              OD limits are calculated daily. If your year's limit is reached for a specific date, you will be unable to apply for OD on that day. 
              Current Year 2 Limit: <span className="text-blue-400 font-bold">{limits["2"] || 25} slots</span>.
            </p>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
