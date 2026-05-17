export default function ProgressBar({ label, value, max, color = "blue", showText = true }) {
  const pct = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100));
  const colorMap = {
    blue: "bg-blue-500",
    yellow: "bg-yellow-400",
    green: "bg-green-500",
    red: "bg-red-500",
    purple: "bg-purple-500",
    gray: "bg-gray-500",
  };
  return (
    <div className="w-full">
      {showText && (
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>{label}</span>
          <span>{pct}%</span>
        </div>
      )}
      <div className="w-full h-2 bg-[#222222] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorMap[color] || colorMap.blue}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
