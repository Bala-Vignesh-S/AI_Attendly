"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export default function Home() {
  const router = useRouter();
  const { profile, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (profile) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    }
  }, [profile, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 italic">
      Redirecting...
    </div>
  );
}
