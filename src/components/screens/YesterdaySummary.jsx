import { useEffect, useState } from 'react';
import { useStore } from '../../store/useStore';
import { areaMinutesFromBlocks } from '../../utils/scoring';
import { minutesToLabel, addDays } from '../../utils/dateUtils';
import { useAreas } from '../../hooks/useAreas';
import api from '../../api/index.js';
import { DiamondOrnament } from '../ui/Ornaments';

const panelStyle = {
  background: 'linear-gradient(135deg, #17142a 0%, #110e1c 100%)',
  border: '1px solid #2c2740',
  borderRadius: '12px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
};

export default function YesterdaySummary() {
  const currentDay    = useStore((s) => s.currentDay);
  const setCurrentDay = useStore((s) => s.setCurrentDay);
  const areas         = useAreas();
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
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(160deg, #0f0d1a 0%, #0c0a14 50%, #09080e 100%)' }}>
        <p className="font-cinzel text-[#4d4568] text-xs tracking-widest uppercase">
          Consultando el pergamino...
        </p>
      </div>
    );
  }

  if (!yesterday) {
    return (
      <div className="min-h-screen flex flex-col px-6 pt-12 pb-8 max-w-lg mx-auto"
        style={{ background: 'linear-gradient(160deg, #0f0d1a 0%, #0c0a14 50%, #09080e 100%)' }}>
        <div className="fixed inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(90,70,150,0.08) 0%, transparent 65%)' }} />
        <div className="fixed inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)' }} />

        <div className="relative mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-5"
            style={{
              border: '1px solid rgba(212,169,86,0.2)',
              background: 'linear-gradient(135deg, #1e1b2e 0%, #110e1c 100%)',
              boxShadow: '0 0 20px rgba(212,169,86,0.1)',
            }}>
            <span className="text-[#d4a956] text-2xl">⚔</span>
          </div>
          <p className="font-cinzel text-[#4d4568] text-[9px] tracking-[0.4em] uppercase mb-2 capitalize">
            {todayLabel}
          </p>
          <h2 className="font-cinzel text-4xl font-bold text-[#f0e6d0] leading-tight mb-3 tracking-[0.04em]"
            style={{ textShadow: '0 0 40px rgba(212,169,86,0.1)' }}>
            La Jornada<br />Comienza.
          </h2>
          <p className="text-[#9490aa] text-sm leading-relaxed max-w-xs">
            Sistema de productividad del caballero — sin límite de días.
          </p>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 h-px" style={{ background: '#2c2740' }} />
          <DiamondOrnament color="#4d4568" size={7} />
          <div className="flex-1 h-px" style={{ background: '#2c2740' }} />
        </div>

        <div className="mb-8">
          <p className="font-cinzel text-[9px] text-[#4d4568] tracking-[0.3em] uppercase mb-4">
            Mínimos Diarios
          </p>
          <div className="grid grid-cols-2 gap-3">
            {areas.filter(a => a.min_minutes > 0).map((area) => (
              <div key={area.id} className="rounded-lg p-3" style={panelStyle}>
                <p className="font-mono text-lg font-black" style={{ color: area.color }}>
                  {minutesToLabel(area.min_minutes)}
                </p>
                <p className="font-cinzel text-[#4d4568] text-[9px] mt-0.5 tracking-widest uppercase">
                  {area.label.split(' ')[0]}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto">
          <button
            onClick={goToPlanner}
            disabled={confirming}
            className="btn-primary disabled:opacity-50"
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

  const statusStyle = yesterday.status === 'complete'
    ? { background: 'rgba(212,169,86,0.12)', color: '#d4a956', border: '1px solid rgba(212,169,86,0.3)' }
    : yesterday.status === 'lost'
    ? { background: 'rgba(155,31,48,0.12)', color: '#9b1f30', border: '1px solid rgba(155,31,48,0.3)' }
    : { background: 'rgba(148,144,170,0.1)', color: '#9490aa', border: '1px solid rgba(148,144,170,0.2)' };

  const scoreColor = score >= 70 ? '#d4a956' : score >= 40 ? '#9490aa' : '#9b1f30';

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto"
      style={{ background: 'linear-gradient(160deg, #0f0d1a 0%, #0c0a14 50%, #09080e 100%)' }}>

      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(90,70,150,0.08) 0%, transparent 65%)' }} />

      {/* Header */}
      <p className="font-cinzel text-[9px] text-[#4d4568] tracking-[0.3em] uppercase mb-2">
        Crónica de Ayer
      </p>

      {/* Score row */}
      <div className="flex items-baseline gap-3 mb-6">
        <span className="font-mono text-5xl font-black"
          style={{ color: scoreColor, textShadow: `0 0 20px ${scoreColor}40` }}>
          {score}
        </span>
        <span className="text-[#4d4568] text-xl font-cinzel">/ 100</span>
        <span className="ml-auto font-cinzel text-[9px] tracking-[0.1em] uppercase px-2.5 py-1 rounded"
          style={statusStyle}>
          {statusLabel}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px" style={{ background: '#2c2740' }} />
        <DiamondOrnament color="#4d4568" size={7} />
        <div className="flex-1 h-px" style={{ background: '#2c2740' }} />
      </div>

      {/* Area summary */}
      <div className="p-4 mb-4" style={panelStyle}>
        <p className="font-cinzel text-[8px] text-[#4d4568] uppercase tracking-[0.25em] mb-4">
          Horas por Área
        </p>
        <div className="flex flex-col gap-2">
          {areas.filter(a => a.id !== 'OTROS').map((area) => {
            const mins = areaMins[area.id] || 0;
            const ok   = mins >= area.min_minutes;
            return (
              <div key={area.id} className="flex justify-between items-center text-sm">
                <span style={{ color: ok ? '#d4a956' : '#4d4568' }}>{area.label}</span>
                <span className="font-mono" style={{ color: ok ? '#d4a956' : '#9490aa' }}>
                  {minutesToLabel(mins)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {yesterday.daily_phrase && (
        <p className="italic text-[#9490aa] text-sm mb-6 text-center px-4 leading-relaxed">
          "{yesterday.daily_phrase}"
        </p>
      )}

      <button
        onClick={goToPlanner}
        disabled={confirming}
        className="btn-primary disabled:opacity-50"
      >
        {confirming ? 'Cargando...' : 'Comenzar la Jornada →'}
      </button>
    </div>
  );
}
