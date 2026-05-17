import { useState } from "react";
import { useStore } from "../../store/useStore";
import { saveToCloud } from "../../lib/cloudSync";

export default function Header() {
  const dayNumber = useStore((s) => s.dayNumber);
  const ups = useStore((s) => s.ups);
  const specialDays = useStore((s) => s.specialDays);
  const replanDays = useStore((s) => s.replanDays);
  const setPhase = useStore((s) => s.setPhase);
  const phase = useStore((s) => s.currentDay.phase);

  const [showSettings, setShowSettings] = useState(false);

  async function handleReset() {
    if (!confirm("¿Resetear todo? Se borrará todo el progreso y empezará desde cero.")) return;
    setShowSettings(false);
    localStorage.removeItem("treinta-dias-store");
    localStorage.removeItem("treinta-dias-reset-unlock");
    await saveToCloud({
      monthStart: null, dayNumber: 1,
      ups: { total: 1, used: false },
      specialDays: { total: 4, usedDays: [] },
      replanDays: { total: 5, usedDays: [] },
      projects: [], days: {}, currentDay: {},
    });
    window.location.reload();
  }

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
      <div className="flex gap-2 items-center">
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

        {/* Settings gear */}
        <div className="relative">
          <button
            onClick={() => setShowSettings((v) => !v)}
            className="text-gray-700 hover:text-gray-400 text-base px-1 py-1 transition-colors"
            title="Ajustes"
          >
            ⚙
          </button>
          {showSettings && (
            <div className="absolute right-0 top-8 bg-[#1a1a1a] border border-[#333333] rounded-xl p-3 w-44 shadow-xl z-[200]">
              <button
                onClick={handleReset}
                className="w-full text-left text-xs text-red-400 hover:text-red-300 py-2 px-2 rounded-lg hover:bg-[#2a1010] transition-colors"
              >
                Resetear todo
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
