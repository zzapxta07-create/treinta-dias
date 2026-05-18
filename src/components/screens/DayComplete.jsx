import { useStore } from "../../store/useStore";
import { calcDayScore } from "../../utils/scoring";

export default function DayComplete() {
  const currentDay = useStore((s) => s.currentDay);
  const dayNumber = useStore((s) => s.dayNumber);

  const score = calcDayScore({ ...currentDay, status: "complete" });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] px-6 text-center">
      <div className="text-5xl mb-6">✓</div>
      <h1 className="text-3xl font-black text-white mb-2">Día {dayNumber} cerrado</h1>
      <p className="text-gray-500 mb-8">Score del día: <span className="text-white font-bold">{score} pts</span></p>
      <div className="bg-[#111111] rounded-2xl p-6 max-w-xs w-full">
        <p className="text-gray-600 text-sm leading-relaxed">
          Mañana a las <span className="text-white font-bold">7:00am</span> comienza el Día {dayNumber + 1}.
        </p>
      </div>
    </div>
  );
}
