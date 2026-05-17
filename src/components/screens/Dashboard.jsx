import { useEffect } from "react";
import { useStore } from "../../store/useStore";
import { useCurrentTime } from "../../hooks/useCurrentTime";
import { useActiveBlock } from "../../hooks/useActiveBlock";
import { AREAS } from "../../data/areas";
import { formatTime, minutesToLabel } from "../../utils/dateUtils";
import { calcDayScore, areaMinutesFromBlocks, calcTotalScore } from "../../utils/scoring";
import ProgressBar from "../ui/ProgressBar";
import Calendar30 from "../ui/Calendar30";
import ScoreBar from "../ui/ScoreBar";

export default function Dashboard() {
  const now = useCurrentTime();
  const activeBlock = useActiveBlock();
  const currentDay = useStore((s) => s.currentDay);
  const days = useStore((s) => s.days);
  const projects = useStore((s) => s.projects);
  const startEvidenceTimer = useStore((s) => s.startEvidenceTimer);

  // Auto-trigger evidence mode every 30min inside a non-OTROS block
  useEffect(() => {
    if (!activeBlock || activeBlock.area === "OTROS") return;
    if (currentDay.phase !== "dashboard") return;

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const elapsed = currentMinutes - activeBlock.startMinutes;

    if (elapsed > 0 && elapsed % 30 === 0 && now.getSeconds() < 2) {
      const slotIndex = Math.floor(elapsed / 30);
      const alreadyDone = currentDay.evidences.some(
        (e) => e.blockId === activeBlock.id && e.slotIndex === slotIndex
      );
      if (!alreadyDone) {
        startEvidenceTimer(activeBlock.id, slotIndex);
      }
    }
  }, [now.getMinutes()]);

  const areaMins = areaMinutesFromBlocks(currentDay.blocks || []);
  const dayScore = calcDayScore({ ...currentDay, status: "partial" });
  const totalScore = calcTotalScore(days);

  const urgentProjects = [...projects]
    .filter(
      (p) =>
        p.deadline &&
        p.type === "percent" &&
        (p.progress || 0) < 100
    )
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 6);

  const AREA_MINS = { NEGOCIO: 300, SEGUNDA: 60, ESTUDIO: 180, EJERCICIO: 30 };

  return (
    <div className="min-h-screen px-4 py-5 max-w-lg mx-auto pb-24">
      {/* Phrase */}
      {currentDay.dailyPhrase && (
        <p className="italic text-gray-600 text-sm text-center mb-5 px-4">
          "{currentDay.dailyPhrase}"
        </p>
      )}

      {/* Time + Active Block */}
      <div className="bg-[#111111] rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="text-4xl font-mono font-black text-white">
            {formatTime(now)}
          </div>
          {activeBlock ? (
            <div className="text-right">
              <p className="text-green-400 text-xs font-medium uppercase tracking-wider">
                Bloque activo
              </p>
              <p className="text-white text-sm">
                {activeBlock.startTime}–{activeBlock.endTime}
              </p>
              <p className="text-gray-500 text-xs">
                {AREAS[activeBlock.area]?.label}
              </p>
            </div>
          ) : (
            <p className="text-gray-600 text-sm">Sin bloque activo</p>
          )}
        </div>
        {activeBlock?.area === "OTROS" && (
          <p className="text-gray-500 text-xs mt-2 italic">
            Hace lo que tenés que hacer — no problem 👍
          </p>
        )}
      </div>

      {/* Scores */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-[#111111] rounded-2xl p-4 text-center">
          <p className="text-gray-600 text-xs mb-1">Score hoy</p>
          <p className="text-4xl font-black text-white">{dayScore}</p>
          <p className="text-gray-700 text-xs">/ 100</p>
        </div>
        <div className="bg-[#111111] rounded-2xl p-4 text-center">
          <p className="text-gray-600 text-xs mb-1">Score total</p>
          <p className="text-4xl font-black text-white">{Math.max(0, totalScore)}</p>
          <p className="text-gray-700 text-xs">meta 2100</p>
        </div>
      </div>

      {/* Area minimums progress */}
      <div className="bg-[#111111] rounded-2xl p-4 mb-4">
        <p className="text-xs text-gray-600 mb-3 uppercase tracking-wider">
          Mínimos del día
        </p>
        <div className="flex flex-col gap-3">
          {Object.entries(AREA_MINS).map(([id, req]) => (
            <ProgressBar
              key={id}
              label={`${AREAS[id].label} (${minutesToLabel(areaMins[id] || 0)} / ${minutesToLabel(req)})`}
              value={areaMins[id] || 0}
              max={req}
              color={AREAS[id].color}
            />
          ))}
        </div>
      </div>

      {/* Area scores (month) */}
      <div className="bg-[#111111] rounded-2xl p-4 mb-4">
        <p className="text-xs text-gray-600 mb-3 uppercase tracking-wider">
          Score por área (mes)
        </p>
        <ScoreBar />
      </div>

      {/* Urgent projects */}
      {urgentProjects.length > 0 && (
        <div className="bg-[#111111] rounded-2xl p-4 mb-4">
          <p className="text-xs text-gray-600 mb-3 uppercase tracking-wider">
            Proyectos
          </p>
          <div className="flex flex-col gap-3">
            {urgentProjects.map((p) => {
              const today = new Date();
              const deadline = new Date(p.deadline + "T12:00:00");
              const daysLeft = Math.ceil((deadline - today) / 86400000);
              const urgentColor =
                daysLeft <= 2
                  ? "text-red-400"
                  : daysLeft <= 5
                  ? "text-yellow-400"
                  : "text-gray-500";
              return (
                <div key={p.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-300 truncate mr-2 max-w-[75%]">
                      {p.name}
                    </span>
                    <span className={`text-xs shrink-0 ${urgentColor}`}>
                      {daysLeft > 0 ? `${daysLeft}d` : "vencido"}
                    </span>
                  </div>
                  <ProgressBar
                    value={p.progress || 0}
                    max={100}
                    color={AREAS[p.area]?.color || "gray"}
                    showText={false}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="bg-[#111111] rounded-2xl p-4 mb-4">
        <p className="text-xs text-gray-600 mb-3 uppercase tracking-wider">
          30 días
        </p>
        <Calendar30 />
      </div>

      {/* Shower photo + phrase recap */}
      {currentDay.showerPhoto && (
        <div className="bg-[#111111] rounded-2xl p-4 mb-4 flex items-center gap-4">
          <img
            src={currentDay.showerPhoto}
            alt="ducha"
            className="w-16 h-16 object-cover rounded-xl shrink-0"
          />
          <p className="text-gray-500 text-sm italic flex-1">
            "{currentDay.dailyPhrase}"
          </p>
        </div>
      )}
    </div>
  );
}
