"use client";

import { useAuth } from "@/context/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Calendar,
  PlusCircle,
  CheckSquare,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  User as UserIcon,
  CheckCircle
} from "lucide-react";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !profile) {
      router.push("/login");
      return;
    }

    // Onboarding Guard: Force students to complete profile
    if (
      !loading && 
      profile?.role === "student" && 
      !profile?.profile_completed && 
      pathname !== "/dashboard/profile/setup"
    ) {
      router.push("/dashboard/profile/setup");
    }
  }, [profile, loading, router, pathname]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const role = profile.role;

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["student", "mentor", "hod", "admin"] },
    { name: "Profile", href: "/dashboard/profile", icon: UserIcon, roles: ["student"] },
    { name: "Apply OD", href: "/dashboard/apply", icon: PlusCircle, roles: ["student"] },
    { name: "My Requests", href: "/dashboard/requests", icon: CheckSquare, roles: ["student"] },
    { name: "Approvals", href: "/dashboard/approvals", icon: CheckSquare, roles: ["mentor", "hod"] },
    { name: "Verification", href: "/dashboard/verification", icon: CheckCircle, roles: ["mentor", "hod"] },
    { name: "Calendar", href: "/dashboard/calendar", icon: Calendar, roles: ["student", "mentor", "hod"] },
    { name: "Management", href: "/dashboard/admin", icon: Users, roles: ["admin"] },
    { name: "Settings", href: "/dashboard/admin?tab=limits", icon: Settings, roles: ["admin"] },
  ].filter(item => item.roles.includes(role));

  const handleLogout = async () => {
    localStorage.removeItem("demo-user");
    await signOut(auth);
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-xl font-bold text-blue-600">Ai_attendly</h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">
            {profile.role} Portal
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                    ? "bg-blue-50 text-blue-600 font-semibold"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                  }`}
              >
                <item.icon size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold text-xs">
              {profile.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-700 truncate">{profile.name}</p>
              <p className="text-[10px] text-slate-400 truncate">{profile.username}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-blue-600">Ai_attendly</h1>
          <button onClick={() => setIsMobileMenuOpen(true)}>
            <Menu size={24} className="text-slate-600" />
          </button>
        </header>

        <div className="p-4 md:p-8 overflow-y-auto flex-1">
          {children}
        </div>
      </main>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm md:hidden">
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-white flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <span className="font-bold text-blue-600">Menu</span>
              <button onClick={() => setIsMobileMenuOpen(false)}>
                <X size={24} className="text-slate-400" />
              </button>
            </div>
            <nav className="flex-1 p-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-slate-500 rounded-xl"
                >
                  <item.icon size={20} />
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t border-slate-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-red-500 bg-red-50 rounded-xl"
              >
                <LogOut size={20} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
