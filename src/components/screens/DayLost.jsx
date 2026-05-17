import { useStore } from "../../store/useStore";
import { calcTotalScore } from "../../utils/scoring";

export default function DayLost() {
  const days = useStore((s) => s.days);
  const dayNumber = useStore((s) => s.dayNumber);
  const totalScore = calcTotalScore(days);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] px-6 text-center">
      <div className="text-7xl font-black text-red-500 tracking-widest mb-4 leading-none">
        DÍA<br />PERDIDO
      </div>
      <p className="text-gray-500 mb-6">Día {dayNumber} de 30</p>
      <div className="bg-[#1a1a1a] rounded-2xl p-6 mb-8 max-w-xs w-full">
        <p className="text-gray-500 text-sm mb-1">Penalización aplicada</p>
        <p className="text-red-400 text-4xl font-black">−150 pts</p>
        <div className="border-t border-[#333333] mt-4 pt-4">
          <p className="text-gray-600 text-xs">Score total actual</p>
          <p className="text-gray-300 text-xl font-bold">{Math.max(0, totalScore)} pts</p>
        </div>
      </div>
      <p className="text-gray-600 text-sm max-w-sm leading-relaxed">
        No podés registrar nada hoy. El día queda marcado en rojo en tu
        calendario. Mañana a partir de las 7am podés volver a empezar.
      </p>
    </div>
  );
}
