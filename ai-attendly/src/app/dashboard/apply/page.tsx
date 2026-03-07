"use client";

import { useState } from "react";
import DashboardShell from "@/components/dashboard-shell";
import { useAuth } from "@/context/auth-context";
import { Send, MapPin, Calendar as CalendarIcon, FileText, CheckCircle2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function ApplyODPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    event_name: "",
    event_location: "",
    start_date: "",
    end_date: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "od_requests"), {
        student_id: profile.username,
        student_name: profile.name,
        mentor_id: "jeena.ai", // This would be fetched from student profile in prod
        ...formData,
        mentor_status: "pending",
        hod_status: "pending",
        verification_status: "not_started",
        created_at: serverTimestamp(),
      });
      
      router.push("/dashboard/requests");
    } catch (error) {
      console.error("Error submitting OD:", error);
      alert("Failed to submit OD. Check console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardShell>
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Apply for OD</h1>
          <p className="text-slate-500">Submit your event details for approval. No physical proof required at this stage.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Event Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    className="input-field pl-10"
                    placeholder="e.g. Smart India Hackathon 2024"
                    value={formData.event_name}
                    onChange={(e) => setFormData({...formData, event_name: e.target.value})}
                  />
                  <FileText className="absolute left-3 top-2.5 text-slate-400" size={18} />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-2">Event Location</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    className="input-field pl-10"
                    placeholder="e.g. IIT Madras, Chennai"
                    value={formData.event_location}
                    onChange={(e) => setFormData({...formData, event_location: e.target.value})}
                  />
                  <MapPin className="absolute left-3 top-2.5 text-slate-400" size={18} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Start Date</label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    className="input-field pl-10"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  />
                  <CalendarIcon className="absolute left-3 top-2.5 text-slate-400" size={18} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">End Date</label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    className="input-field pl-10"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  />
                  <CalendarIcon className="absolute left-3 top-2.5 text-slate-400" size={18} />
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 text-blue-700">
              <CheckCircle2 className="shrink-0" size={20} />
              <p className="text-sm italic">
                <strong>Note:</strong> Once approved by the HOD, you must return to provide a text-based event description to complete the OD verification.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button 
              type="button" 
              onClick={() => router.back()}
              className="px-6 py-2 text-slate-500 font-semibold hover:bg-slate-100 rounded-lg transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="btn-primary px-8 flex items-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={18} />
                  Submit Application
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}
