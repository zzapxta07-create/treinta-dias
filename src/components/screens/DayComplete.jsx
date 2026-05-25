import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { calcDayScore } from '../../utils/scoring';
import AiChat from '../ui/AiChat';
import api from '../../api/index.js';

export default function DayComplete() {
  const currentDay    = useStore((s) => s.currentDay);
  const setCurrentDay = useStore((s) => s.setCurrentDay);
  const score         = currentDay ? (currentDay.score || calcDayScore(currentDay)) : 0;
  const dateLabel     = currentDay?.date_key?.toString().slice(0, 10);
  const [starting,    setStarting] = useState(false);

  async function startNewDay() {
    setStarting(true);
    try {
      const { data } = await api.get('/api/days/today');
      setCurrentDay(data.data);
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#080808] px-6 text-center pb-12">
      <div className="text-6xl mb-6 text-green-400">✓</div>
      <h1 className="text-3xl font-black text-white mb-2">
        Día cerrado — {dateLabel}
      </h1>
      <p className="text-[#6B7280] mb-8">
        Score: <span className="text-white font-bold font-mono">{score} pts</span>
      </p>

      <button
        onClick={startNewDay}
        disabled={starting}
        className="w-full max-w-xs bg-white text-black font-black py-4 rounded-xl text-lg active:scale-95 disabled:opacity-50 transition-transform mb-6"
      >
        {starting ? 'Cargando...' : 'COMENZAR NUEVO DÍA →'}
      </button>

      <p className="text-[#374151] text-xs mb-4">
        ✦ El coach IA está disponible abajo a la derecha
      </p>

      <AiChat initialMessage={`Analiza mi día ${dateLabel} y dame feedback honesto como coach. Revisá mis bloques, áreas completadas, evidencias y score.`} />
    </div>
  );
}
