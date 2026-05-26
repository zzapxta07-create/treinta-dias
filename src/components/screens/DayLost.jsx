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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0806] px-6 text-center">
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.8) 100%)' }} />

      <div className="relative">
        {/* Broken crest */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border border-[#8b1a2a]/40 bg-[#8b1a2a]/08 mb-6"
          style={{ backgroundColor: 'rgba(139,26,42,0.08)' }}>
          <span className="text-[#8b1a2a] text-3xl">✕</span>
        </div>

        <p className="font-cinzel text-[9px] text-[#5a4838] tracking-[0.5em] uppercase mb-3">
          {currentDay?.date_key?.toString().slice(0, 10)}
        </p>

        <h1 className="font-cinzel text-4xl font-bold text-[#8b1a2a] tracking-[0.1em] leading-tight mb-2">
          DIES<br />AMISSUS
        </h1>

        <div className="flex items-center gap-3 my-4 px-8">
          <div className="flex-1 h-px bg-[#8b1a2a]/30" />
          <span className="text-[#8b1a2a]/50 text-xs">◆</span>
          <div className="flex-1 h-px bg-[#8b1a2a]/30" />
        </div>

        <p className="font-cinzel text-[9px] text-[#5a4838] tracking-[0.3em] uppercase mb-2">
          Día Perdido
        </p>

        {/* Penalty card */}
        <div className="bg-[#110d0a] rounded-lg p-5 mb-8 max-w-xs w-full border border-[#8b1a2a]/30 mx-auto">
          <p className="font-cinzel text-[9px] text-[#5a4838] tracking-[0.2em] uppercase mb-2">
            Penalización Aplicada
          </p>
          <p className="font-mono text-[#8b1a2a] text-4xl font-black">−150 pts</p>
        </div>

        <p className="text-[#9a8470] text-sm max-w-sm leading-relaxed mb-8">
          El ritual del alba no fue completado a tiempo. El caballero no puede registrar nada hoy.
          Mañana a las 7am la fortaleza abrirá sus puertas de nuevo.
        </p>

        <button
          onClick={handleRecover}
          disabled={recovering}
          className="font-cinzel text-[9px] text-[#5a4838] tracking-widest uppercase hover:text-[#9a8470] transition-colors disabled:opacity-50"
        >
          {recovering ? 'Recuperando...' : 'Recuperar día (error de temporizador)'}
        </button>
      </div>
    </div>
  );
}
