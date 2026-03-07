"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import DashboardShell from "@/components/dashboard-shell";
import { User, School, Users, ShieldCheck, Loader2, Save } from "lucide-react";

export default function ProfileSetupPage() {
  const { profile, user } = useAuth();
  const router = useRouter();
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    year: "",
    section: "",
    mentor_id: ""
  });

  useEffect(() => {
    async function fetchData() {
      // 1. Fetch Mentors
      try {
        const q = query(collection(db, "users"), where("role", "in", ["mentor", "hod"]));
        const snap = await getDocs(q);
        setMentors(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (e) {
        console.error("Error fetching mentors:", e);
      }

      // 2. Pre-fill name if exists
      if (profile) {
        setFormData(prev => ({ ...prev, name: profile.name || "" }));
      }
      setLoading(false);
    }
    fetchData();
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.year || !formData.section || !formData.mentor_id) {
      alert("Please fill all fields.");
      return;
    }

    setSaving(true);
    try {
      const profileRef = doc(db, "users", user.uid);
      await updateDoc(profileRef, {
        ...formData,
        profile_completed: true,
        updated_at: new Date()
      });
      alert("Profile completed successfully!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="animate-spin text-blue-600 w-12 h-12" />
    </div>
  );

  return (
    <DashboardShell>
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200 border border-slate-100 italic transition-all">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 mx-auto mb-4 border-2 border-blue-100">
               <ShieldCheck size={40} />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900">Final Step!</h1>
            <p className="text-slate-500 font-bold mt-2">Complete your profile to access your dashboard.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 ml-2">Display Name</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Your Full Name" 
                  className="input-field pl-12 rounded-2xl border-slate-200 focus:ring-blue-500" 
                  required
                />
                <User className="absolute left-4 top-3.5 text-slate-400" size={20} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 ml-2">Academic Year</label>
                <div className="relative">
                  <select 
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                    className="input-field pl-12 rounded-2xl border-slate-200 focus:ring-blue-500 appearance-none bg-white"
                    required
                  >
                    <option value="">Select Year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                  <School className="absolute left-4 top-3.5 text-slate-400" size={20} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 ml-2">Section</label>
                <div className="relative">
                  <select 
                    value={formData.section}
                    onChange={(e) => setFormData({...formData, section: e.target.value})}
                    className="input-field pl-12 rounded-2xl border-slate-200 focus:ring-blue-500 appearance-none bg-white"
                    required
                  >
                    <option value="">Select Sec</option>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                  <Users className="absolute left-4 top-3.5 text-slate-400" size={20} />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 ml-2">Assigned Mentor</label>
              <div className="relative">
                <select 
                  value={formData.mentor_id}
                  onChange={(e) => setFormData({...formData, mentor_id: e.target.value})}
                  className="input-field pl-12 rounded-2xl border-slate-200 focus:ring-blue-500 appearance-none bg-white"
                  required
                >
                  <option value="">Select your Mentor</option>
                  {mentors.map(m => (
                    <option key={m.id} value={m.username}>{m.name} ({m.username})</option>
                  ))}
                </select>
                <ShieldCheck className="absolute left-4 top-3.5 text-slate-400" size={20} />
              </div>
              <p className="text-[10px] text-slate-400 mt-2 ml-2 italic font-bold leading-tight">Can't find your mentor? Ensure they have registered their account first.</p>
            </div>

            <button 
              type="submit" 
              disabled={saving}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold uppercase tracking-widest text-sm shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              Complete Registration
            </button>
          </form>
        </div>
      </div>
    </DashboardShell>
  );
}
