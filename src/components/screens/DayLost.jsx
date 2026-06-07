import { useState } from 'react';
import { useStore } from '../../store/useStore';
import api from '../../api/index.js';
import { GreatHelm, DiamondOrnament } from '../ui/Ornaments';

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
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #100a0c 0%, #0c0a14 40%, #090608 100%)' }}>

      {/* Crimson atmospheric glow */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 70% 60% at 50% 0%, rgba(155,31,48,0.08) 0%, transparent 70%)',
      }} />
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.8) 100%)',
      }} />

      {/* Large faint inverted/broken helm */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none rotate-180"
        style={{ opacity: 0.03 }}>
        <GreatHelm size={500} color="#9b1f30" strokeWidth={0.8} />
      </div>

      {/* Corner lines — red tinted */}
      <div className="fixed top-8 left-8 w-12 h-12 pointer-events-none" style={{
        borderLeft: '1px solid rgba(155,31,48,0.2)',
        borderTop: '1px solid rgba(155,31,48,0.2)',
      }} />
      <div className="fixed top-8 right-8 w-12 h-12 pointer-events-none" style={{
        borderRight: '1px solid rgba(155,31,48,0.2)',
        borderTop: '1px solid rgba(155,31,48,0.2)',
      }} />

      <div className="relative max-w-sm w-full">

        {/* Broken crest */}
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 relative"
          style={{
            border: '1px solid rgba(155,31,48,0.25)',
            background: 'rgba(155,31,48,0.06)',
            boxShadow: '0 0 40px rgba(155,31,48,0.12), inset 0 1px 0 rgba(155,31,48,0.05)',
          }}>
          <div style={{ filter: 'drop-shadow(0 0 8px rgba(155,31,48,0.4))' }}>
            <GreatHelm size={54} color="#9b1f30" strokeWidth={1.5} opacity={0.9} />
          </div>
          {/* Diagonal crack lines */}
          <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none" style={{ opacity: 0.4 }}>
            <div style={{
              position: 'absolute', top: '20%', left: '30%',
              width: '1px', height: '50%',
              background: '#9b1f30',
              transform: 'rotate(25deg)',
            }} />
            <div style={{
              position: 'absolute', top: '15%', right: '25%',
              width: '1px', height: '40%',
              background: '#9b1f30',
              transform: 'rotate(-15deg)',
            }} />
          </div>
        </div>

        <p className="font-cinzel text-[#4d4568] text-[8px] tracking-[0.5em] uppercase mb-3">
          {currentDay?.date_key?.toString().slice(0, 10)}
        </p>

        <h1 className="font-cinzel text-5xl font-black tracking-[0.08em] leading-none mb-2"
          style={{
            color: '#9b1f30',
            textShadow: '0 0 40px rgba(155,31,48,0.3), 0 0 80px rgba(155,31,48,0.1)',
          }}>
          DIES<br />AMISSUS
        </h1>

        <div className="flex items-center gap-3 my-5 px-8">
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(155,31,48,0.3))' }} />
          <DiamondOrnament color="#4d4568" size={7} />
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(155,31,48,0.3), transparent)' }} />
        </div>

        {/* Penalty card */}
        <div className="rounded-xl p-5 mb-8 mx-auto max-w-xs w-full"
          style={{
            background: 'linear-gradient(135deg, #1a0c10 0%, #110e1c 100%)',
            border: '1px solid rgba(155,31,48,0.2)',
            boxShadow: '0 8px 32px rgba(155,31,48,0.08)',
          }}>
          <p className="font-cinzel text-[8px] text-[#4d4568] tracking-[0.25em] uppercase mb-2">
            Penalización Aplicada
          </p>
          <p className="font-mono text-5xl font-black"
            style={{
              color: '#9b1f30',
              textShadow: '0 0 20px rgba(155,31,48,0.3)',
            }}>
            −150
          </p>
          <p className="font-cinzel text-[#4d4568] text-[8px] tracking-widest uppercase">puntos</p>
        </div>

        <p className="text-[#9490aa] text-sm max-w-sm leading-relaxed mb-8">
          El ritual del alba no fue completado a tiempo. El caballero no puede registrar nada hoy.
          Mañana a las 7am la fortaleza abrirá sus puertas de nuevo.
        </p>

        <button
          onClick={handleRecover}
          disabled={recovering}
          className="font-cinzel text-[8px] text-[#4d4568] tracking-widest uppercase hover:text-[#9490aa] transition-colors disabled:opacity-50"
        >
          {recovering ? 'Recuperando...' : 'Recuperar día (error de temporizador)'}
        </button>
      </div>
    </div>
  );
}
