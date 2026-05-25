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
      const { data } = await api.put(`/api/days/${dateKey}/phase`, { phase: 'planner' });
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
      <div className="min-h-screen flex items-center justify-center text-[#6B7280]">
        Cargando...
      </div>
    );
  }

  // First day or no yesterday data
  if (!yesterday) {
    return (
      <div className="min-h-screen flex flex-col px-6 pt-12 pb-8 max-w-lg mx-auto">
        <div className="mb-8">
          <p className="text-[#6B7280] text-xs uppercase tracking-widest capitalize mb-4">{todayLabel}</p>
          <h2 className="text-4xl font-black text-white leading-tight mb-2">Empieza hoy.</h2>
          <p className="text-[#6B7280] text-sm leading-relaxed max-w-xs">
            Sistema de productividad permanente — sin límite de días.
          </p>
        </div>

        <div className="border-t border-[#2C2C2C] mb-8" />

        <div className="mb-8">
          <p className="text-[#6B7280] text-xs uppercase tracking-widest mb-4">Mínimos diarios</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Negocio',  min: '5h',    color: 'text-blue-400' },
              { label: 'Estudio',  min: '3h',    color: 'text-amber-400' },
              { label: 'Segunda',  min: '1h',    color: 'text-purple-400' },
              { label: 'Ejercicio', min: '30min', color: 'text-emerald-400' },
            ].map((item) => (
              <div key={item.label} className="bg-[#101010] rounded-xl p-3 border border-[#2C2C2C]">
                <p className={`text-lg font-black ${item.color}`}>{item.min}</p>
                <p className="text-[#6B7280] text-xs mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto">
          <button
            onClick={goToPlanner}
            disabled={confirming}
            className="w-full bg-white text-black font-black py-4 rounded-xl text-lg active:scale-95 disabled:opacity-50 transition-transform"
          >
            {confirming ? 'Cargando...' : 'PLANIFICAR HOY →'}
          </button>
        </div>
      </div>
    );
  }

  const areaMins = areaMinutesFromBlocks(yesterday.blocks || []);
  const score    = yesterday.score || 0;
  const statusLabel = yesterday.status === 'complete' ? 'Completo' : yesterday.status === 'lost' ? 'Perdido' : 'Parcial';
  const statusColor = yesterday.status === 'complete'
    ? 'bg-green-600 text-white'
    : yesterday.status === 'lost'
    ? 'bg-red-600 text-white'
    : 'bg-yellow-500 text-black';

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      <p className="text-[#6B7280] text-xs uppercase tracking-wider mb-1">Resumen de ayer</p>
      <div className="flex items-baseline gap-3 mb-6">
        <span className="text-5xl font-black text-white font-mono">{score}</span>
        <span className="text-[#6B7280] text-xl">/ 100 pts</span>
        <span className={`ml-auto text-xs font-bold px-2 py-1 rounded-lg ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      <div className="bg-[#101010] rounded-2xl p-4 mb-4 border border-[#2C2C2C]">
        <p className="text-xs text-[#6B7280] mb-3 uppercase tracking-wider">Horas por área</p>
        <div className="flex flex-col gap-2">
          {Object.entries(AREAS).filter(([id]) => id !== 'OTROS').map(([id, area]) => {
            const mins = areaMins[id] || 0;
            const ok   = mins >= area.minMinutes;
            return (
              <div key={id} className="flex justify-between items-center text-sm">
                <span className={ok ? 'text-green-400' : 'text-[#6B7280]'}>{area.label}</span>
                <span className={`font-mono ${ok ? 'text-green-400' : 'text-[#6B7280]'}`}>
                  {minutesToLabel(mins)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {yesterday.daily_phrase && (
        <p className="italic text-[#6B7280] text-sm mb-6 text-center px-4">
          "{yesterday.daily_phrase}"
        </p>
      )}

      <button
        onClick={goToPlanner}
        disabled={confirming}
        className="w-full bg-white text-black font-black py-4 rounded-xl text-xl active:scale-95 disabled:opacity-50 transition-transform"
      >
        {confirming ? 'Cargando...' : 'PLANIFICAR HOY →'}
      </button>
    </div>
  );
}
