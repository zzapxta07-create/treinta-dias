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

  const tier = score >= 70 ? 'victoria' : score >= 40 ? 'honrado' : 'escaso';
  const tierData = {
    victoria: {
      icon: '⚔',
      latin: 'DIES COMPLETVS',
      subtitle: 'La batalla ha sido ganada. El caballero descansa con honor.',
      iconBorder: 'border-[#c9a254]/50',
      iconBg: 'bg-[#c9a254]/10',
      iconColor: 'text-[#c9a254]',
      scoreColor: '#c9a254',
    },
    honrado: {
      icon: '◈',
      latin: 'HONORE DIGNUS',
      subtitle: 'Un día de trabajo digno. Mañana se puede lograr más.',
      iconBorder: 'border-[#9a8470]/50',
      iconBg: 'bg-[#9a8470]/10',
      iconColor: 'text-[#9a8470]',
      scoreColor: '#9a8470',
    },
    escaso: {
      icon: '◦',
      latin: 'PARUM FACTUM',
      subtitle: 'El esfuerzo fue insuficiente. La disciplina se forja mañana.',
      iconBorder: 'border-[#8b1a2a]/50',
      iconBg: 'bg-[#8b1a2a]/10',
      iconColor: 'text-[#8b1a2a]',
      scoreColor: '#8b1a2a',
    },
  }[tier];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0806] px-6 text-center pb-12">
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.65) 100%)' }} />

      <div className="relative">
        {/* Icon */}
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full border ${tierData.iconBorder} ${tierData.iconBg} mb-6`}>
          <span className={`text-3xl ${tierData.iconColor}`}>{tierData.icon}</span>
        </div>

        {/* Latin title */}
        <p className="font-cinzel text-[9px] text-[#5a4838] tracking-[0.5em] uppercase mb-3">
          {dateLabel}
        </p>
        <h1 className="font-cinzel text-3xl font-bold text-[#f0e6d0] tracking-[0.1em] mb-2">
          {tierData.latin}
        </h1>

        {/* Ornament */}
        <div className="flex items-center gap-3 my-4 px-8">
          <div className="flex-1 h-px bg-[#3a2e22]" />
          <span className="text-[#5a4838] text-xs">◆</span>
          <div className="flex-1 h-px bg-[#3a2e22]" />
        </div>

        {/* Score */}
        <div className="mb-2">
          <span className="font-mono font-black text-5xl" style={{ color: tierData.scoreColor }}>
            {score}
          </span>
          <span className="font-cinzel text-[#5a4838] text-lg ml-2">/ 100</span>
        </div>
        <p className="text-[#9a8470] text-sm mb-8 max-w-xs mx-auto leading-relaxed">
          {tierData.subtitle}
        </p>

        <button
          onClick={startNewDay}
          disabled={starting}
          className="w-full max-w-xs font-cinzel font-bold bg-[#f0e6d0] text-[#0a0806] py-4 rounded text-sm tracking-[0.12em] uppercase active:scale-95 disabled:opacity-50 transition-transform mb-6"
        >
          {starting ? 'Cargando...' : 'Comenzar Nueva Jornada →'}
        </button>

        <p className="font-cinzel text-[#3a2e22] text-[9px] tracking-[0.2em] uppercase mb-4">
          ✦ El Consejero está disponible abajo
        </p>
      </div>

      <AiChat initialMessage={`Analiza mi día ${dateLabel} y dame feedback honesto como coach. Revisá mis bloques, áreas completadas, evidencias y score.`} />
    </div>
  );
}
