"use client";

import { useState, useEffect } from "react";
import DashboardShell from "@/components/dashboard-shell";
import { Users, UserPlus, Settings, Shield, Search, Loader2, Save, CheckCircle2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc, query, where, getDocs } from "firebase/firestore";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("students");
  const [limits, setLimits] = useState<Record<string, number>>({});
  const [students, setStudents] = useState<any[]>([]);
  const [faculty, setFaculty] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // 1. Listen for Year Limits
    const unsubLimits = onSnapshot(collection(db, "year_limits"), (snap) => {
      const l: any = {};
      snap.docs.forEach(doc => l[doc.id] = doc.data().limit);
      setLimits(l);
    });

    // 2. Fetch Users
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      const allUsers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(allUsers.filter((u: any) => u.role === "student"));
      setFaculty(allUsers.filter((u: any) => u.role === "mentor" || u.role === "hod"));
      setIsLoading(false);
    });

    return () => { unsubLimits(); unsubUsers(); };
  }, []);

  const handleSaveLimits = async () => {
    setIsSaving(true);
    try {
      const promises = Object.entries(limits).map(([year, limit]) => 
        updateDoc(doc(db, "year_limits", year), { limit: Number(limit) })
      );
      await Promise.all(promises);
      alert("OD Limits updated successfully!");
    } catch (error) {
      console.error("Error saving limits:", error);
      alert("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredStudents = students.filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFaculty = faculty.filter(f => 
    f.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardShell>
      <div className="max-w-6xl mx-auto space-y-8 pb-12">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Admin Control Center</h1>
            <p className="text-slate-500 italic">Manage users, department configuration, and OD limits.</p>
          </div>
        </div>

        <div className="flex border-b border-slate-200">
          <TabButton active={activeTab === "students"} onClick={() => setActiveTab("students")} label="Students" icon={<Users size={16}/>} />
          <TabButton active={activeTab === "faculty"} onClick={() => setActiveTab("faculty")} label="Faculty" icon={<Shield size={16}/>} />
          <TabButton active={activeTab === "limits"} onClick={() => setActiveTab("limits")} label="OD Limits" icon={<Settings size={16}/>} />
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-100 min-h-[500px] relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <Loader2 className="animate-spin text-blue-600 w-10 h-10" />
            </div>
          )}

          {(activeTab === "students" || activeTab === "faculty") && (
            <div className="space-y-6">
              <div className="relative">
                <input 
                   type="text" 
                   placeholder={`Search ${activeTab}...`} 
                   className="input-field pl-12 py-4 rounded-2xl border-slate-200 focus:ring-blue-500" 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-4 top-4 text-slate-400" size={20} />
              </div>
              
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Name</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Username/ID</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Role</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(activeTab === "students" ? filteredStudents : filteredFaculty).map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800">{user.name}</td>
                        <td className="px-6 py-4 text-sm text-slate-500 italic">{user.username}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">{user.role}</span>
                        </td>
                        <td className="px-6 py-4">
                          <CheckCircle2 className="text-green-500" size={18} />
                        </td>
                      </tr>
                    ))}
                    {(activeTab === "students" ? filteredStudents : filteredFaculty).length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-20 text-center text-slate-400 italic">No records found matching your search.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "limits" && (
            <div className="max-w-md mx-auto space-y-8 pt-6">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-4">
                   <Settings size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Department OD Balancing</h3>
                <p className="text-sm text-slate-500 italic">Set the maximum On-Duty slots allowed per day for each year.</p>
              </div>

              <div className="space-y-4">
                {[1, 2, 3, 4].map(year => (
                  <div key={year} className="flex items-center justify-between p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 hover:border-blue-200 transition-all">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800 text-lg">Year {year}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Daily Quota</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <input 
                        type="number" 
                        value={limits[year] || 0} 
                        onChange={(e) => setLimits({ ...limits, [year]: Number(e.target.value) })}
                        className="w-24 px-4 py-3 bg-white border border-slate-200 rounded-xl text-center font-bold text-xl text-slate-900 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all shadow-inner" 
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button 
                onClick={handleSaveLimits}
                disabled={isSaving}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-lg shadow-slate-200 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                {isSaving ? "Saving..." : "Update Daily Limits"}
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}

function TabButton({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: any }) {
  return (
    <button 
      onClick={onClick}
      className={`px-8 py-4 flex items-center gap-2 font-bold text-sm italic transition-all border-b-4 ${active ? "border-blue-600 text-blue-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}
    >
      {icon}
      {label}
    </button>
  );
}
