"use client";

import { useState } from "react";
import DashboardShell from "@/components/dashboard-shell";
import { useAuth } from "@/context/auth-context";
import { Send, MapPin, Calendar as CalendarIcon, FileText, CheckCircle2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, getDocs, query, where, Timestamp } from "firebase/firestore";
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
      // 1. Validate Limits for each date in range
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      
      const datesToCheck = [];
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        datesToCheck.push(new Date(d).toISOString().split("T")[0]);
      }

      // Check each date
      for (const dateStr of datesToCheck) {
        // Query current approved/pending ODs for this year level on this date
        const q = query(
          collection(db, "od_requests"), 
          where("student_year", "==", profile.year),
          where("start_date", "<=", dateStr),
          where("end_date", ">=", dateStr)
        );
        
        const [snap, limitDoc] = await Promise.all([
          getDocs(q),
          getDocs(query(collection(db, "year_limits"), where("year", "==", Number(profile.year))))
        ]);

        const currentCount = snap.docs.length;
        const yearLimit = limitDoc.docs[0]?.data().limit || 20;

        if (currentCount >= yearLimit) {
          alert(`Limit reached for Year ${profile.year} on ${dateStr} (${currentCount}/${yearLimit} slots filled). Please choose another date.`);
          setIsSubmitting(false);
          return;
        }
      }

      // 2. Submit Request
      await addDoc(collection(db, "od_requests"), {
        student_id: profile.username,
        student_name: profile.name,
        student_year: profile.year,
        student_section: profile.section,
        mentor_id: profile.mentor_id || "not_assigned",
        ...formData,
        mentor_status: "pending",
        hod_status: "pending",
        verification_status: "not_started",
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      
      router.push("/dashboard/requests");
    } catch (error) {
      console.error("Error submitting OD:", error);
      alert("Failed to submit. " + (error as any).message);
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
