"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardShell from "@/components/dashboard-shell";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { FileText, Send, Loader2, AlertCircle } from "lucide-react";

export default function AttendanceProofPage() {
  const { id } = useParams();
  const router = useRouter();
  const { profile } = useAuth();
  const [request, setRequest] = useState<any>(null);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRequest() {
      if (!id) return;
      const snap = await getDoc(doc(db, "od_requests", id as string));
      if (snap.exists()) {
        setRequest(snap.data());
      }
      setIsLoading(false);
    }
    fetchRequest();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !id) return;

    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "od_requests", id as string), {
        event_description: description,
        verification_status: "pending",
        attendance_submitted_at: serverTimestamp(),
      });
      router.push("/dashboard/requests");
    } catch (error) {
      console.error("Error submitting attendance:", error);
      alert("Failed to submit. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" /></div>;
  if (!request) return <div className="p-20 text-center text-slate-400 italic">Request not found.</div>;

  return (
    <DashboardShell>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Event Attendance</h1>
          <p className="text-slate-500">Provide a detailed description of the event as proof of attendance.</p>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-100">
            <h3 className="font-bold text-slate-700">{request.event_name}</h3>
            <p className="text-xs text-slate-500 italic uppercase font-bold tracking-wider">{request.od_id}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Event Description</label>
              <textarea
                required
                className="input-field min-h-[150px] resize-none py-3"
                placeholder="Describe your participation, key learnings, or sessions attended..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider italic flex items-center gap-1">
                <AlertCircle size={10} /> Be specific. This will be verified by your mentor.
              </p>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 mt-4"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /> Submit Verification</>}
            </button>
          </form>
        </div>
      </div>
    </DashboardShell>
  );
}
