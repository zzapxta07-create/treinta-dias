import { useStore } from "../../store/useStore";
import { addDays, minutesToLabel } from "../../utils/dateUtils";
import { areaMinutesFromBlocks } from "../../utils/scoring";
import { AREAS } from "../../data/areas";

export default function History() {
  const days = useStore((s) => s.days);
  const monthStart = useStore((s) => s.monthStart);
  const dayNumber = useStore((s) => s.dayNumber);

  if (!monthStart || dayNumber <= 1) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        <p>Aún no hay días registrados.</p>
      </div>
    );
  }

  const pastDays = Array.from({ length: dayNumber - 1 }, (_, i) => {
    const dateKey = addDays(monthStart, i);
    return { dateKey, day: days[dateKey], index: i + 1 };
  }).reverse();

  return (
    <div className="min-h-screen px-4 py-5 max-w-lg mx-auto">
      <h1 className="text-xl font-black mb-5">Historial</h1>
      <div className="flex flex-col gap-3">
        {pastDays.map(({ dateKey, day, index }) => {
          if (!day) {
            return (
              <div key={dateKey} className="bg-[#111111] rounded-2xl p-4 opacity-40">
                <p className="text-gray-500 text-sm">Día {index} — sin datos</p>
              </div>
            );
          }
          const borderColor =
            day.status === "complete"
              ? "border-green-600"
              : day.status === "lost"
              ? "border-red-600"
              : "border-yellow-600";

          const areaMins = areaMinutesFromBlocks(day.blocks || []);

          return (
            <div
              key={dateKey}
              className={`bg-[#111111] rounded-2xl p-4 border-l-4 ${borderColor}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-white font-black text-lg">Día {index}</p>
                  <p className="text-gray-600 text-xs">{dateKey}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-white">
                    {day.score || 0}
                  </p>
                  <p className="text-gray-600 text-xs">/ 100 pts</p>
                </div>
              </div>

              {/* Area breakdown compact */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 mb-3">
                {Object.entries(AREAS)
                  .filter(([id]) => id !== "OTROS")
                  .map(([id, area]) => {
                    const mins = areaMins[id] || 0;
                    const ok = mins >= area.minMinutes;
                    return (
                      <div key={id} className="flex justify-between text-xs">
                        <span className={ok ? "text-green-500" : "text-gray-600"}>
                          {area.label.split(" ")[0]}
                        </span>
                        <span className={`font-mono ${ok ? "text-green-500" : "text-gray-600"}`}>
                          {minutesToLabel(mins)}
                        </span>
                      </div>
                    );
                  })}
              </div>

              {/* Emotional state + phrase */}
              <div className="flex items-center gap-3">
                {day.emotionalState && (
                  <span className="text-gray-500 text-xs">
                    Estado: {day.emotionalState}/10
                  </span>
                )}
                {day.dailyPhrase && (
                  <span className="text-gray-700 text-xs italic truncate">
                    "{day.dailyPhrase}"
                  </span>
                )}
              </div>

              {/* Shower photo thumbnail */}
              {day.showerPhoto && (
                <img
                  src={day.showerPhoto}
                  alt="ducha"
                  className="w-12 h-12 object-cover rounded-lg mt-2"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
