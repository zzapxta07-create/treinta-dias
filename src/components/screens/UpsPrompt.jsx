import { useState } from 'react';
import { useStore } from '../../store/useStore';
import api from '../../api/index.js';

export default function UpsPrompt() {
  const currentDay    = useStore((s) => s.currentDay);
  const config        = useStore((s) => s.config);
  const setCurrentDay = useStore((s) => s.setCurrentDay);
  const [loading, setLoading] = useState(false);

  const hasUps = config && !config.ups_used && config.ups_total > 0;

  async function useUps() {
    setLoading(true);
    try {
      const { data } = await api.post(`/api/days/${currentDay.date_key}/ups/use`);
      setCurrentDay(data.data);
    } finally {
      setLoading(false);
    }
  }

  async function loseDay() {
    setLoading(true);
    try {
      const { data } = await api.post(`/api/days/${currentDay.date_key}/lose`);
      setCurrentDay(data.data);
    } finally {
      setLoading(false);
    }
  }

  async function continueAnyway() {
    setLoading(true);
    try {
      const { data } = await api.post(`/api/days/${currentDay.date_key}/continue-late`);
      setCurrentDay(data.data);
    } finally {
      setLoading(false);
    }
  }

  if (!hasUps) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#080808] px-6 text-center">
        <div className="text-6xl mb-6">⏰</div>
        <h1 className="text-2xl font-bold text-yellow-400 mb-3">Entraste tarde</h1>
        <p className="text-[#6B7280] mb-2">Son más de las 8:00am.</p>
        <p className="text-[#F0F0F0] mb-8 max-w-sm">
          No tenés UPS disponible. Podés continuar el día — quedará registrado como entrada tarde.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={continueAnyway}
            disabled={loading}
            className="bg-yellow-500 text-black font-black py-4 px-6 rounded-xl text-lg active:scale-95 disabled:opacity-50 transition-transform"
          >
            CONTINUAR IGUAL
          </button>
          <button
            onClick={loseDay}
            disabled={loading}
            className="bg-[#181818] text-[#6B7280] font-medium py-3 px-6 rounded-xl text-sm active:scale-95 disabled:opacity-50 transition-transform"
          >
            Marcar día como perdido (−150 pts)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#080808] px-6 text-center">
      <div className="text-6xl mb-6">⚠️</div>
      <h1 className="text-2xl font-bold text-yellow-400 mb-3">Entraste tarde</h1>
      <p className="text-[#6B7280] mb-2">Son más de las 8:00am.</p>
      <p className="text-[#F0F0F0] mb-8 max-w-sm">
        Tenés <span className="text-white font-bold">1 UPS</span> disponible. Úsalo para que el día siga normal.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={useUps}
          disabled={loading}
          className="bg-green-500 text-black font-black py-4 px-6 rounded-xl text-lg active:scale-95 disabled:opacity-50 transition-transform"
        >
          USAR UPS
        </button>
        <button
          onClick={continueAnyway}
          disabled={loading}
          className="bg-[#181818] text-yellow-500 font-medium py-3 px-6 rounded-xl text-sm active:scale-95 disabled:opacity-50 transition-transform"
        >
          Continuar sin UPS (entrada tarde)
        </button>
        <button
          onClick={loseDay}
          disabled={loading}
          className="text-[#374151] text-xs underline hover:text-[#6B7280] transition-colors"
        >
          Marcar día como perdido (−150 pts)
        </button>
      </div>
      <p className="text-[#374151] text-xs mt-8">El UPS solo puede usarse una vez por mes.</p>
    </div>
  );
}
