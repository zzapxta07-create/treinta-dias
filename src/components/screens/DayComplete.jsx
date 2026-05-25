import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { calcDayScore } from '../../utils/scoring';
import api from '../../api/index.js';

export default function DayComplete() {
  const currentDay = useStore((s) => s.currentDay);
  const score      = currentDay ? (currentDay.score || calcDayScore(currentDay)) : 0;

  const [coach,   setCoach]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    if (!currentDay?.date_key || fetched) return;
    setFetched(true);
    setLoading(true);
    api.post('/api/ai/coach', { date_key: currentDay.date_key })
       .then(r => {
         const d = r.data.data;
         setCoach(d?.feedback || d?.response || d?.text || d?.message
           || (typeof d === 'string' ? d : null));
       })
       .catch(() => setCoach(null))
       .finally(() => setLoading(false));
  }, [currentDay?.date_key]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#080808] px-6 text-center pb-12">
      <div className="text-6xl mb-6 text-green-400">✓</div>
      <h1 className="text-3xl font-black text-white mb-2">
        Día cerrado — {currentDay?.date_key}
      </h1>
      <p className="text-[#6B7280] mb-8">
        Score: <span className="text-white font-bold font-mono">{score} pts</span>
      </p>

      {/* AI Coach section */}
      <div className="w-full max-w-sm mb-8">
        {loading ? (
          <div className="bg-[#101010] rounded-2xl p-5 border border-[#2C2C2C]">
            <p className="text-[#374151] text-xs uppercase tracking-wider mb-2">✦ Coach IA</p>
            <p className="text-[#6B7280] text-sm animate-pulse">Analizando tu día...</p>
          </div>
        ) : coach ? (
          <div className="bg-[#101010] rounded-2xl p-5 border border-[#2C2C2C] text-left">
            <p className="text-[#374151] text-xs uppercase tracking-wider mb-3">✦ Coach IA</p>
            <p className="text-[#F0F0F0] text-sm leading-relaxed whitespace-pre-line">{coach}</p>
          </div>
        ) : null}
      </div>

      <div className="bg-[#101010] rounded-2xl p-6 max-w-xs w-full border border-[#2C2C2C]">
        <p className="text-[#6B7280] text-sm leading-relaxed">
          Mañana podés empezar un nuevo día cuando quieras.
        </p>
      </div>
    </div>
  );
}
