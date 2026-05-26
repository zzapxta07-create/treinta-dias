import { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { areaMinutesFromBlocks } from '../../utils/scoring';
import { minutesToLabel, addDays } from '../../utils/dateUtils';
import { AREAS } from '../../data/areas';
import api from '../../api/index.js';

export default function YesterdaySummary() {
  const currentDay    = useStore((s) => s.currentDay);
  const setCurrentDay = useStore((s) => s.setCurrentDay);
  const [yesterday,   setYesterday]  = useState(null);
  const [loading,     setLoading]    = useState(true);
  const [confirming,  setConfirming] = useState(false);

  const dateKey = currentDay?.date_key;

  useEffect(() => {
    if (!dateKey) return;
    const yday = addDays(dateKey, -1);
    api.get(`/api/days/${yday}/summary`)
       .then((r) => setYesterday(r.data.data))
       .catch(() => setYesterday(null))
       .finally(() => setLoading(false));
  }, [dateKey]);

  async function goToPlanner() {
    setConfirming(true);
    try {
      const { data } = await api.post(`/api/days/${dateKey}/start`);
      setCurrentDay(data.data);
    } finally {
      setConfirming(false);
    }
  }

  const todayLabel = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-cinzel text-[#5a4838] text-xs tracking-widest uppercase">
          Consultando el pergamino...
        </p>
      </div>
    );
  }

  if (!yesterday) {
    return (
      <div className="min-h-screen flex flex-col px-6 pt-12 pb-8 max-w-lg mx-auto">
        <div className="fixed inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)' }} />

        <div className="relative mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-[#3a2e22] bg-[#110d0a] mb-5">
            <span className="text-[#c9a254] text-2xl">⚔</span>
          </div>
          <p className="font-cinzel text-[#5a4838] text-[9px] tracking-[0.4em] uppercase mb-2 capitalize">
            {todayLabel}
          </p>
          <h2 className="font-cinzel text-4xl font-bold text-[#f0e6d0] leading-tight mb-3 tracking-[0.04em]">
            La Jornada<br />Comienza.
          </h2>
          <p className="text-[#9a8470] text-sm leading-relaxed max-w-xs">
            Sistema de productividad del caballero — sin límite de días.
          </p>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 h-px bg-[#3a2e22]" />
          <span className="text-[#5a4838] text-xs">◆</span>
          <div className="flex-1 h-px bg-[#3a2e22]" />
        </div>

        <div className="mb-8">
          <p className="font-cinzel text-[9px] text-[#5a4838] tracking-[0.3em] uppercase mb-4">
            Mínimos Diarios
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Negocio',   min: '5h',    color: 'text-blue-400' },
              { label: 'Estudio',   min: '3h',    color: 'text-amber-400' },
              { label: 'Segunda',   min: '1h',    color: 'text-purple-400' },
              { label: 'Ejercicio', min: '30min', color: 'text-emerald-400' },
            ].map((item) => (
              <div key={item.label} className="bg-[#110d0a] rounded-lg p-3 border border-[#3a2e22]">
                <p className={`font-mono text-lg font-black ${item.color}`}>{item.min}</p>
                <p className="font-cinzel text-[#5a4838] text-[9px] mt-0.5 tracking-widest uppercase">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto">
          <button
            onClick={goToPlanner}
            disabled={confirming}
            className="w-full font-cinzel font-bold bg-[#f0e6d0] text-[#0a0806] py-4 rounded text-sm tracking-[0.12em] uppercase active:scale-95 disabled:opacity-50 transition-transform"
          >
            {confirming ? 'Cargando...' : 'Comenzar la Jornada →'}
          </button>
        </div>
      </div>
    );
  }

  const areaMins    = areaMinutesFromBlocks(yesterday.blocks || []);
  const score       = yesterday.score || 0;
  const statusLabel = yesterday.status === 'complete' ? 'Completado' : yesterday.status === 'lost' ? 'Perdido' : 'Parcial';
  const statusColor = yesterday.status === 'complete'
    ? 'bg-[#c9a254]/15 text-[#c9a254] border border-[#c9a254]/30'
    : yesterday.status === 'lost'
    ? 'bg-[#8b1a2a]/15 text-[#8b1a2a] border border-[#8b1a2a]/30'
    : 'bg-[#9a8470]/15 text-[#9a8470] border border-[#9a8470]/30';

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      {/* Header */}
      <p className="font-cinzel text-[9px] text-[#5a4838] tracking-[0.3em] uppercase mb-2">
        Crónica de Ayer
      </p>

      {/* Score row */}
      <div className="flex items-baseline gap-3 mb-6">
        <span className="font-mono text-5xl font-black text-[#f0e6d0]">{score}</span>
        <span className="text-[#5a4838] text-xl font-cinzel">/ 100</span>
        <span className={`ml-auto font-cinzel text-[9px] tracking-[0.1em] uppercase px-2.5 py-1 rounded ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px bg-[#3a2e22]" />
        <span className="text-[#5a4838] text-xs">◆</span>
        <div className="flex-1 h-px bg-[#3a2e22]" />
      </div>

      {/* Area summary */}
      <div className="bg-[#110d0a] rounded-lg p-4 mb-4 border border-[#3a2e22]">
        <p className="font-cinzel text-[8px] text-[#5a4838] uppercase tracking-[0.25em] mb-4">
          Horas por Área
        </p>
        <div className="flex flex-col gap-2">
          {Object.entries(AREAS).filter(([id]) => id !== 'OTROS').map(([id, area]) => {
            const mins = areaMins[id] || 0;
            const ok   = mins >= area.minMinutes;
            return (
              <div key={id} className="flex justify-between items-center text-sm">
                <span className={ok ? 'text-[#c9a254]' : 'text-[#5a4838]'}>{area.label}</span>
                <span className={`font-mono ${ok ? 'text-[#c9a254]' : 'text-[#9a8470]'}`}>
                  {minutesToLabel(mins)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {yesterday.daily_phrase && (
        <p className="italic text-[#9a8470] text-sm mb-6 text-center px-4 leading-relaxed">
          "{yesterday.daily_phrase}"
        </p>
      )}

      <button
        onClick={goToPlanner}
        disabled={confirming}
        className="w-full font-cinzel font-bold bg-[#f0e6d0] text-[#0a0806] py-4 rounded text-sm tracking-[0.12em] uppercase active:scale-95 disabled:opacity-50 transition-transform"
      >
        {confirming ? 'Cargando...' : 'Comenzar la Jornada →'}
      </button>
    </div>
  );
}
