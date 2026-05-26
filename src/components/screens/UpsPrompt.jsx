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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0806] px-6 text-center">
        <div className="fixed inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)' }} />
        <div className="relative max-w-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-[#c9a254]/30 bg-[#110d0a] mb-5">
            <span className="text-[#c9a254] text-2xl">⏳</span>
          </div>
          <p className="font-cinzel text-[9px] text-[#5a4838] tracking-[0.4em] uppercase mb-2">
            Entrada Tardía
          </p>
          <h1 className="font-cinzel text-2xl font-bold text-[#f0e6d0] tracking-[0.06em] mb-3">
            Más de las 8:00am
          </h1>
          <p className="text-[#9a8470] mb-8 leading-relaxed text-sm">
            No tienes salvoconducto disponible. Puedes continuar — quedará registrado como entrada tardía.
          </p>
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={continueAnyway}
              disabled={loading}
              className="font-cinzel font-bold bg-[#c9a254]/15 text-[#c9a254] border border-[#c9a254]/30 py-4 px-6 rounded text-sm tracking-[0.12em] uppercase active:scale-95 disabled:opacity-50 transition-transform"
            >
              Continuar de todas formas
            </button>
            <button
              onClick={loseDay}
              disabled={loading}
              className="font-cinzel text-[9px] text-[#5a4838] tracking-widest uppercase hover:text-[#8b1a2a] transition-colors py-2 disabled:opacity-50"
            >
              Marcar día como perdido (−150 pts)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0806] px-6 text-center">
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)' }} />
      <div className="relative max-w-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-[#c9a254]/40 bg-[#110d0a] mb-5">
          <span className="text-[#c9a254] text-2xl">⚡</span>
        </div>
        <p className="font-cinzel text-[9px] text-[#5a4838] tracking-[0.4em] uppercase mb-2">
          Entrada Tardía
        </p>
        <h1 className="font-cinzel text-2xl font-bold text-[#f0e6d0] tracking-[0.06em] mb-3">
          Más de las 8:00am
        </h1>
        <p className="text-[#9a8470] mb-8 leading-relaxed text-sm">
          Tienes <span className="text-[#c9a254] font-bold">1 Salvoconducto</span> disponible.
          Úsalo para que la jornada continúe sin penalización.
        </p>
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={useUps}
            disabled={loading}
            className="font-cinzel font-bold bg-[#f0e6d0] text-[#0a0806] py-4 px-6 rounded text-sm tracking-[0.12em] uppercase active:scale-95 disabled:opacity-50 transition-transform"
          >
            Usar Salvoconducto
          </button>
          <button
            onClick={continueAnyway}
            disabled={loading}
            className="font-cinzel text-[9px] text-[#c9a254]/60 tracking-widest uppercase hover:text-[#c9a254] transition-colors py-2 disabled:opacity-50"
          >
            Continuar sin salvoconducto (entrada tarde)
          </button>
          <button
            onClick={loseDay}
            disabled={loading}
            className="font-cinzel text-[9px] text-[#3a2e22] tracking-widest uppercase hover:text-[#8b1a2a] transition-colors py-1 disabled:opacity-50"
          >
            Marcar día como perdido (−150 pts)
          </button>
        </div>
        <p className="font-cinzel text-[#3a2e22] text-[7px] mt-6 uppercase tracking-widest">
          El salvoconducto solo puede usarse una vez por mes.
        </p>
      </div>
    </div>
  );
}
