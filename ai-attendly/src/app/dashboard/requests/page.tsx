"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/dashboard-shell";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { Clock, CheckCircle2, XCircle, FileText, MapPin, Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";

export default function MyRequestsPage() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const q = query(
      collection(db, "od_requests"),
      where("student_id", "==", profile.username),
      orderBy("created_at", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequests(docs);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  return (
    <DashboardShell>
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">My OD Requests</h1>
            <p className="text-slate-500">Track the status of your applications and provide attendance proof.</p>
          </div>
          <Link href="/dashboard/apply" className="btn-primary">
            Apply New OD
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <FileText size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-700">No requests found</h2>
            <p className="text-slate-400 max-w-xs mx-auto text-sm italic">You haven't submitted any OD applications yet. Click "Apply New OD" to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {requests.map((req) => (
              <RequestCard key={req.id} req={req} />
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}

function RequestCard({ req }: { req: any }) {
  const statusStyles: any = {
    pending: { bg: "bg-orange-50", text: "text-orange-600", icon: Clock },
    approved: { bg: "bg-green-50", text: "text-green-600", icon: CheckCircle2 },
    rejected: { bg: "bg-red-50", text: "text-red-600", icon: XCircle },
  };

  const mentorStyle = statusStyles[req.mentor_status];
  const hodStyle = statusStyles[req.hod_status];

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-200 transition-all flex flex-col md:flex-row gap-6">
      <div className="flex-1 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">{req.event_name}</h3>
          <p className="text-sm text-slate-500 flex items-center gap-1">
            <MapPin size={14} /> {req.event_location}
          </p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-wider">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg text-slate-600 italic">
            <CalendarIcon size={14} />
            {req.start_date} → {req.end_date}
          </div>
          {req.od_id && (
            <div className="bg-blue-50 text-blue-600 px-3 py-2 rounded-lg border border-blue-100 italic">
              ID: {req.od_id}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col md:items-end justify-center gap-3 min-w-[200px]">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-400 font-bold uppercase text-[10px] italic">Mentor:</span>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${mentorStyle.bg} ${mentorStyle.text} font-bold text-xs italic`}>
            <mentorStyle.icon size={12} />
            {req.mentor_status}
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-400 font-bold uppercase text-[10px] italic">HOD:</span>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${hodStyle.bg} ${hodStyle.text} font-bold text-xs italic`}>
            <hodStyle.icon size={12} />
            {req.hod_status}
          </div>
        </div>

        {req.hod_status === "approved" && req.verification_status === "not_started" && (
          <Link 
            href={`/dashboard/requests/${req.id}/attendance`}
            className="mt-2 text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 italic"
          >
            Provide Attendance Description →
          </Link>
        )}
      </div>
    </div>
  );
}
