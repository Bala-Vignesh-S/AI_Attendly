import { ReactNode } from "react";

export function StatCard({ title, value, color, icon }: { title: string, value: string, color: string, icon?: ReactNode }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-green-50 text-green-600 border-green-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    red: "bg-red-50 text-red-600 border-red-100",
  };

  return (
    <div className={`p-6 rounded-2xl border ${colors[color]} shadow-sm relative overflow-hidden group hover:shadow-md transition-all`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mb-1">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        {icon && (
          <div className="opacity-20 group-hover:opacity-40 transition-opacity">
            {icon}
          </div>
        )}
      </div>
      <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white/10 rounded-full blur-xl" />
    </div>
  );
}
