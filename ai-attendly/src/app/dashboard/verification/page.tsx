"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/dashboard-shell";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { CheckCircle, AlertTriangle, User, Calendar as CalendarIcon, FileText, Loader2 } from "lucide-react";

export default function VerificationPage() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    // Show requests that have attendance proof submitted but not yet verified
    const q = query(
      collection(db, "od_requests"),
      where("verification_status", "==", "pending")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Logic: Mentors see their mentees. HOD sees everyone or just department.
      let docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      
      if (profile.role === "mentor") {
        docs = docs.filter(d => d.mentor_id === profile.username);
      }

      setRequests(docs);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  const [outcomes, setOutcomes] = useState<Record<string, "win" | "participation">>( {});

  const handleVerify = async (requestId: string, studentUsername: string, status: "verified" | "flagged") => {
    const outcome = outcomes[requestId] || "participation";
    try {
      // 1. Update Request
      await updateDoc(doc(db, "od_requests", requestId), {
        verification_status: status,
        verified_by: profile?.username,
        verified_at: serverTimestamp(),
        outcome: status === "verified" ? outcome : null
      });

      // 2. Update Student Profile Stats if verified
      if (status === "verified") {
        const studentSnap = await getDocs(query(collection(db, "users"), where("username", "==", studentUsername)));
        if (!studentSnap.empty) {
          const studentDoc = studentSnap.docs[0];
          const currentWins = studentDoc.data().wins || 0;
          const currentLosses = studentDoc.data().losses || 0;
          
          await updateDoc(doc(db, "users", studentDoc.id), {
            wins: outcome === "win" ? currentWins + 1 : currentWins,
            losses: outcome === "participation" ? currentLosses + 1 : currentLosses
          });
        }
      }
    } catch (error) {
      console.error("Error verifying attendance:", error);
    }
  };

  return (
    <DashboardShell>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Event Verification</h1>
        <p className="text-slate-500 mb-8 italic">Review students' event descriptions to finalize their OD records.</p>

        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" /></div>
        ) : requests.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 italic">
            No attendance proofs pending verification.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {requests.map((req) => (
              <div key={req.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full hover:border-blue-200 transition-all">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold uppercase text-xs italic">
                    {req.student_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{req.student_name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider italic">{req.student_id}</p>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div className="pt-2 border-t border-slate-50">
                    <div className="flex justify-between items-start mb-2">
                       <h4 className="font-bold text-slate-700 italic">{req.event_name}</h4>
                       <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-lg border border-blue-100 font-bold italic">{req.od_id}</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-600 italic border border-slate-100 leading-relaxed min-h-[100px]">
                      "{req.event_description}"
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-4 pt-4 border-t border-slate-50">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Event Outcome</label>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setOutcomes({...outcomes, [req.id]: "win"})}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase transition-all border ${outcomes[req.id] === "win" ? "bg-green-600 text-white border-green-600 shadow-lg shadow-green-100" : "bg-white text-slate-400 border-slate-100 hover:border-green-200"}`}
                      >
                        Won / Success
                      </button>
                      <button 
                        onClick={() => setOutcomes({...outcomes, [req.id]: "participation"})}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase transition-all border ${outcomes[req.id] === "participation" || !outcomes[req.id] ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100" : "bg-white text-slate-400 border-slate-100 hover:border-blue-200"}`}
                      >
                        Participated
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4">
                    {!profile ? null : profile.role === "mentor" ? (
                      <>
                        <button 
                          onClick={() => handleVerify(req.id, req.student_id, "flagged")}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-orange-200 text-orange-600 rounded-xl hover:bg-orange-50 transition-all font-bold text-xs italic"
                        >
                          <AlertTriangle size={14} /> Flag Proof
                        </button>
                        <button 
                          onClick={() => handleVerify(req.id, req.student_id, "verified")}
                          className="flex-1 flex items-center justify-center gap-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 font-bold text-xs italic"
                        >
                          <CheckCircle size={14} /> Final Approval
                        </button>
                      </>
                    ) : (
                      <div className="w-full text-center py-2 bg-slate-50 rounded-xl text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
                        View Only (Mentor Verification Pending)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
