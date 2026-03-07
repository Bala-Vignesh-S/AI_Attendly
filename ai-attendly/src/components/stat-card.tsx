export function StatCard({ title, value, color }: { title: string, value: string, color: string }) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-green-50 text-green-600 border-green-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    red: "bg-red-50 text-red-600 border-red-100",
  };

  return (
    <div className={`p-6 rounded-2xl border ${colors[color]} shadow-sm`}>
      <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}
