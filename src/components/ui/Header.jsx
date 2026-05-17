import { useStore } from "../../store/useStore";

export default function Header() {
  const dayNumber = useStore((s) => s.dayNumber);
  const ups = useStore((s) => s.ups);
  const specialDays = useStore((s) => s.specialDays);
  const replanDays = useStore((s) => s.replanDays);
  const setPhase = useStore((s) => s.setPhase);
  const phase = useStore((s) => s.currentDay.phase);

  const specialLeft = specialDays.total - specialDays.usedDays.length;
  const replanLeft = replanDays.total - replanDays.usedDays.length;
  const upsLeft = ups.used ? 0 : ups.total;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#111111] border-b border-[#222222] px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-blue-400 font-bold text-sm">Día {dayNumber}/30</span>
        <span className="text-gray-500 text-xs">UPS: {upsLeft}</span>
        <span className="text-gray-500 text-xs">Esp: {specialLeft}/4</span>
        <span className="text-gray-500 text-xs">Rep: {replanLeft}/5</span>
      </div>
      <div className="flex gap-2">
        {phase === "dashboard" && (
          <button
            onClick={() => setPhase("history")}
            className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded bg-[#222222]"
          >
            Historial
          </button>
        )}
        {(phase === "history" || phase === "final") && (
          <button
            onClick={() => setPhase("dashboard")}
            className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded bg-[#222222]"
          >
            ← Dashboard
          </button>
        )}
        {phase === "dashboard" && (
          <button
            onClick={() => setPhase("close")}
            className="text-xs text-gray-500 hover:text-white px-2 py-1 rounded"
          >
            Cerrar día
          </button>
        )}
      </div>
    </header>
  );
}
