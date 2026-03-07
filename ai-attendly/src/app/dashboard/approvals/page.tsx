"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/dashboard-shell";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Check, X, User, Calendar as CalendarIcon, MapPin, Loader2 } from "lucide-react";

export default function ApprovalsPage() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    // Mentor sees pending mentor_status
    // HOD sees approved mentor_status AND pending hod_status
    const statusField = profile.role === "mentor" ? "mentor_status" : "hod_status";
    const q = profile.role === "mentor" 
      ? query(collection(db, "od_requests"), where("mentor_id", "==", profile.username), where("mentor_status", "==", "pending"))
      : query(collection(db, "od_requests"), where("mentor_status", "==", "approved"), where("hod_status", "==", "pending"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequests(docs);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const handleAction = async (requestId: string, action: "approved" | "rejected") => {
    const statusField = profile?.role === "mentor" ? "mentor_status" : "hod_status";
    const updateData: any = {
      [statusField]: action,
      updated_at: serverTimestamp(),
    };

    // If HOD approves, generate the final OD ID
    if (profile?.role === "hod" && action === "approved") {
      // In a real app, this would use a counter. For demo, we'll generate one.
      const date = new Date();
      const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      const month = monthNames[date.getMonth()];
      const year = String(date.getFullYear()).slice(-2);
      // We'd ideally count existing approved for this month, but for simplified:
      updateData.od_id = `OD-${month}${year}-${Math.floor(Math.random() * 1000)}`;
    }

    try {
      await updateDoc(doc(db, "od_requests", requestId), updateData);
    } catch (error) {
      console.error("Error updating request:", error);
    }
  };

  return (
    <DashboardShell>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Pending Approvals</h1>
        <p className="text-slate-500 mb-8 italic">Review and approve On-Duty requests for your department.</p>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 italic">
            No pending requests for your review.
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div key={req.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                      <User size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{req.student_name}</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider italic">{req.student_id}</p>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <h4 className="font-bold text-slate-700">{req.event_name}</h4>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <MapPin size={14} /> {req.event_location}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-bold text-slate-500 italic">
                    <CalendarIcon size={14} />
                    {req.start_date} → {req.end_date}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleAction(req.id, "rejected")}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-all font-bold text-sm italic"
                  >
                    <X size={18} /> Reject
                  </button>
                  <button 
                    onClick={() => handleAction(req.id, "approved")}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-100 font-bold text-sm italic"
                  >
                    <Check size={18} /> Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
