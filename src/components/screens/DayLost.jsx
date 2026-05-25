import { useState } from 'react';
import { useStore } from '../../store/useStore';
import api from '../../api/index.js';

export default function DayLost() {
  const currentDay    = useStore((s) => s.currentDay);
  const setCurrentDay = useStore((s) => s.setCurrentDay);
  const [recovering, setRecovering] = useState(false);

  async function handleRecover() {
    if (!confirm('¿Recuperar el día y continuar? Se quitará la penalización.')) return;
    setRecovering(true);
    try {
      const { data } = await api.post(`/api/days/${currentDay.date_key}/recover`);
      setCurrentDay(data.data);
    } finally {
      setRecovering(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#080808] px-6 text-center">
      <div className="text-7xl font-black text-red-500 tracking-widest mb-4 leading-none">
        DÍA<br />PERDIDO
      </div>
      <p className="text-[#6B7280] mb-6">{currentDay?.date_key?.toString().slice(0, 10)}</p>
      <div className="bg-[#181818] rounded-2xl p-6 mb-8 max-w-xs w-full border border-[#2C2C2C]">
        <p className="text-[#6B7280] text-sm mb-1">Penalización aplicada</p>
        <p className="text-red-400 text-4xl font-black font-mono">−150 pts</p>
      </div>
      <p className="text-[#6B7280] text-sm max-w-sm leading-relaxed mb-8">
        No podés registrar nada hoy. Mañana a partir de las 7am podés volver a empezar.
      </p>
      <button
        onClick={handleRecover}
        disabled={recovering}
        className="text-[#6B7280] text-xs underline hover:text-[#F0F0F0] transition-colors disabled:opacity-50"
      >
        {recovering ? 'Recuperando...' : 'Recuperar día (error de timer)'}
      </button>
    </div>
  );
}
