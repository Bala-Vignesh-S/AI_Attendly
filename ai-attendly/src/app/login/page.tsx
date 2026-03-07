"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { detectRoleFromUsername } from "@/lib/auth-utils";
import { ShieldCheck, GraduationCap, User as UserIcon } from "lucide-react";

import { seedInitialData } from "@/lib/seed";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSeed = async () => {
    if (!username || !password) {
      alert("Enter username and password first.");
      return;
    }
    setIsLoading(true);
    try {
      // 1. Detect role and validate format
      detectRoleFromUsername(username);

      // 2. Custom Domain Logic
      let email = username;
      if (!username.includes("@")) {
        if (username === "admin.ai" || username === "balavignesh.ai") {
          email = "balavignesh.ai@gmail.com";
        } else if (username.endsWith(".ai")) {
          email = `${username.toLowerCase()}@sairam.edu.in`;
        } else if (username.toUpperCase().startsWith("SEC")) {
          email = `${username.toLowerCase()}@sairamtap.edu.in`;
        } else {
          email = `${username.toLowerCase()}@sairamtap.edu.in`; // Default
        }
      }
      
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      
      await seedInitialData(user.uid, username, username.split(".")[0].toUpperCase());
      alert("Profile Created Successfully! Redirecting...");
      router.push("/dashboard");
    } catch (err: any) {
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        alert("Account not found or password incorrect. Please create the user in the Firebase Console with the correct email domain first!");
      } else {
        alert(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // 1. Detect role and validate format
      detectRoleFromUsername(username);

      // 2. Custom Domain Logic
      let email = username;
      if (!username.includes("@")) {
        if (username === "admin.ai" || username === "balavignesh.ai") {
          email = "balavignesh.ai@gmail.com";
        } else if (username.endsWith(".ai")) {
          email = `${username.toLowerCase()}@sairam.edu.in`;
        } else if (username.toUpperCase().startsWith("SEC")) {
          email = `${username.toLowerCase()}@sairamtap.edu.in`;
        } else {
          email = `${username.toLowerCase()}@sairamtap.edu.in`; // Default
        }
      }
      
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Invalid credentials or username format");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl shadow-slate-200 overflow-hidden">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <ShieldCheck size={32} />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">Ai_attendly</h1>
          <p className="text-center text-slate-500 mb-8 text-sm">Engineering Dept OD Management System</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
              <div className="relative">
                <input
                  type="text"
                  className="input-field pl-10"
                  placeholder="SEC23AD179 or name.ai"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
                <UserIcon className="absolute left-3 top-2.5 text-slate-400" size={18} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100 italic">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Sign In</>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-3">
             <button 
              type="button"
              onClick={handleSeed}
              className="text-[10px] font-bold text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-all italic"
            >
              First time? Seed Firestore Profile
            </button>
            <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">
              Ai_attendly v1.0 • Secure Departmental Access
            </p>
          </div>
        </div>
        
        <div className="bg-slate-900 p-4 text-center">
          <p className="text-slate-400 text-xs">
            SEC Prefix for Students • .ai Suffix for Staff
          </p>
        </div>
      </div>
    </div>
  );
}
