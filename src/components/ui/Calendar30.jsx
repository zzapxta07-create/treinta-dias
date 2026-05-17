import { useStore } from "../../store/useStore";
import { addDays } from "../../utils/dateUtils";

export default function Calendar30() {
  const days = useStore((s) => s.days);
  const monthStart = useStore((s) => s.monthStart);
  const dayNumber = useStore((s) => s.dayNumber);

  if (!monthStart) return null;

  const cells = Array.from({ length: 30 }, (_, i) => {
    const dateKey = addDays(monthStart, i);
    const day = days[dateKey];
    const isCurrent = i + 1 === dayNumber;
    const isFuture = i + 1 > dayNumber;

    let bg = "bg-[#222222] text-gray-500";
    if (isFuture) bg = "bg-[#1a1a1a] text-gray-700";
    else if (day?.status === "complete") bg = "bg-green-600 text-white";
    else if (day?.status === "lost") bg = "bg-red-600 text-white";
    else if (!isFuture) bg = "bg-yellow-600 text-black";

    return (
      <div
        key={i}
        className={`${bg} rounded text-center py-1.5 text-xs font-mono font-bold ${
          isCurrent ? "ring-2 ring-white" : ""
        }`}
      >
        {i + 1}
      </div>
    );
  });

  return (
    <div className="grid grid-cols-10 gap-1">
      {cells}
    </div>
  );
}
