import { useStore } from '../../store/useStore';
import { calcDayScore } from '../../utils/scoring';

export default function DayComplete() {
  const currentDay = useStore((s) => s.currentDay);
  const score      = currentDay ? (currentDay.score || calcDayScore(currentDay)) : 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#080808] px-6 text-center">
      <div className="text-6xl mb-6 text-green-400">✓</div>
      <h1 className="text-3xl font-black text-white mb-2">
        Día cerrado — {currentDay?.date_key}
      </h1>
      <p className="text-[#6B7280] mb-8">
        Score: <span className="text-white font-bold font-mono">{score} pts</span>
      </p>
      <div className="bg-[#101010] rounded-2xl p-6 max-w-xs w-full border border-[#2C2C2C]">
        <p className="text-[#6B7280] text-sm leading-relaxed">
          Mañana a las <span className="text-white font-bold">7:00am</span>{' '}
          podés empezar un nuevo día.
        </p>
      </div>
    </div>
  );
}
