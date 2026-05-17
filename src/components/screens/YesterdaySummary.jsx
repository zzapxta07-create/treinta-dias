import { useStore } from "../../store/useStore";
import { addDays, minutesToLabel } from "../../utils/dateUtils";
import { areaMinutesFromBlocks } from "../../utils/scoring";
import { AREAS } from "../../data/areas";

export default function YesterdaySummary() {
  const setPhase = useStore((s) => s.setPhase);
  const dayNumber = useStore((s) => s.dayNumber);
  const days = useStore((s) => s.days);
  const monthStart = useStore((s) => s.monthStart);

  const isFirstDay = dayNumber === 1;
  const yesterdayKey = monthStart ? addDays(monthStart, dayNumber - 2) : null;
  const yesterday = yesterdayKey ? days[yesterdayKey] : null;

  if (isFirstDay || !yesterday) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="text-6xl mb-5">🚀</div>
        <h1 className="text-4xl font-black mb-3 tracking-tight">30 Días</h1>
        <p className="text-gray-400 mb-2 text-lg">Hoy empieza el reto.</p>
        <p className="text-gray-600 text-sm mb-10 max-w-sm leading-relaxed">
          30 días de datos objetivos para tomar la decisión más importante de este año.
          Meta: ≥2100 puntos y ≥80% de cumplimiento de hábitos.
        </p>
        <button
          onClick={() => setPhase("planner")}
          className="bg-white text-black font-black py-4 px-10 rounded-xl text-xl active:scale-95 transition-transform"
        >
          PLANIFICAR HOY →
        </button>
      </div>
    );
  }

  const areaMins = areaMinutesFromBlocks(yesterday.blocks || []);
  const score = yesterday.score || 0;
  const statusLabel =
    yesterday.status === "complete"
      ? "Completo"
      : yesterday.status === "lost"
      ? "Perdido"
      : "Parcial";
  const statusColor =
    yesterday.status === "complete"
      ? "bg-green-600 text-white"
      : yesterday.status === "lost"
      ? "bg-red-600 text-white"
      : "bg-yellow-500 text-black";

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">
        Resumen de ayer — Día {dayNumber - 1}
      </p>
      <div className="flex items-baseline gap-3 mb-6">
        <span className="text-5xl font-black text-white">{score}</span>
        <span className="text-gray-500 text-xl">/ 100 pts</span>
        <span className={`ml-auto text-xs font-bold px-2 py-1 rounded-lg ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      {/* Area breakdown */}
      <div className="bg-[#111111] rounded-2xl p-4 mb-4">
        <p className="text-xs text-gray-600 mb-3 uppercase tracking-wider">Horas por área</p>
        <div className="flex flex-col gap-2">
          {Object.entries(AREAS)
            .filter(([id]) => id !== "OTROS")
            .map(([id, area]) => {
              const mins = areaMins[id] || 0;
              const met = mins >= area.minMinutes;
              return (
                <div key={id} className="flex justify-between items-center text-sm">
                  <span className={met ? "text-green-400" : "text-gray-400"}>
                    {area.label}
                  </span>
                  <span className={`font-mono ${met ? "text-green-400" : "text-gray-500"}`}>
                    {minutesToLabel(mins)}
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Blocks */}
      {(yesterday.blocks || []).length > 0 && (
        <div className="bg-[#111111] rounded-2xl p-4 mb-4">
          <p className="text-xs text-gray-600 mb-3 uppercase tracking-wider">Bloques</p>
          <div className="flex flex-col gap-2">
            {yesterday.blocks.map((b) => {
              const evs = (yesterday.evidences || []).filter(
                (e) => e.blockId === b.id
              );
              const slots = Math.max(1, Math.floor((b.endMinutes - b.startMinutes) / 30));
              const done = evs.filter((e) => !e.noHice).length;
              const ok = done >= slots;
              return (
                <div
                  key={b.id}
                  className="flex justify-between items-center text-sm"
                >
                  <div>
                    <span className="text-gray-300 font-mono">
                      {b.startTime}–{b.endTime}
                    </span>
                    <span className="text-gray-600 ml-2 text-xs">
                      {AREAS[b.area]?.label}
                    </span>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-mono ${
                      ok
                        ? "bg-green-900 text-green-400"
                        : "bg-[#222222] text-gray-500"
                    }`}
                  >
                    {done}/{slots}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {yesterday.dailyPhrase && (
        <p className="italic text-gray-600 text-sm mb-6 text-center px-4">
          "{yesterday.dailyPhrase}"
        </p>
      )}

      <button
        onClick={() => setPhase("planner")}
        className="w-full bg-white text-black font-black py-4 rounded-xl text-xl active:scale-95 transition-transform"
      >
        PLANIFICAR HOY →
      </button>
    </div>
  );
}
