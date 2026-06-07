import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { calcDayScore } from '../../utils/scoring';
import AiChat from '../ui/AiChat';
import api from '../../api/index.js';
import { HelmetFilled, GreatHelm, DiamondOrnament } from '../ui/Ornaments';

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
      latin:        'DIES COMPLETVS',
      subtitle:     'La batalla ha sido ganada. El caballero descansa con honor.',
      scoreColor:   '#d4a956',
      glowColor:    'rgba(212,169,86,0.2)',
      borderColor:  'rgba(212,169,86,0.25)',
      bgColor:      'rgba(212,169,86,0.06)',
      helmColor:    '#d4a956',
      bgGradient:   'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(90,70,30,0.12) 0%, transparent 70%)',
    },
    honrado: {
      latin:        'HONORE DIGNUS',
      subtitle:     'Un día de trabajo digno. Mañana se puede lograr más.',
      scoreColor:   '#9490aa',
      glowColor:    'rgba(148,144,170,0.15)',
      borderColor:  'rgba(148,144,170,0.2)',
      bgColor:      'rgba(148,144,170,0.05)',
      helmColor:    '#9490aa',
      bgGradient:   'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(60,50,90,0.1) 0%, transparent 70%)',
    },
    escaso: {
      latin:        'PARUM FACTUM',
      subtitle:     'El esfuerzo fue insuficiente. La disciplina se forja mañana.',
      scoreColor:   '#9b1f30',
      glowColor:    'rgba(155,31,48,0.15)',
      borderColor:  'rgba(155,31,48,0.2)',
      bgColor:      'rgba(155,31,48,0.05)',
      helmColor:    '#9b1f30',
      bgGradient:   'radial-gradient(ellipse 70% 50% at 50% 0%, rgba(90,20,30,0.1) 0%, transparent 70%)',
    },
  }[tier];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center pb-16 relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0f0d1a 0%, #0c0a14 50%, #09080e 100%)' }}>

      {/* Tier-specific atmospheric glow */}
      <div className="fixed inset-0 pointer-events-none" style={{ background: tierData.bgGradient }} />
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.65) 100%)',
      }} />

      {/* Large faint background helm */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none"
        style={{ opacity: 0.04 }}>
        <HelmetFilled size={500} color={tierData.helmColor} />
      </div>

      {/* Decorative corner frames */}
      <div className="fixed top-8 left-8 w-12 h-12 pointer-events-none" style={{
        borderLeft: `1px solid ${tierData.borderColor}`,
        borderTop: `1px solid ${tierData.borderColor}`,
      }} />
      <div className="fixed top-8 right-8 w-12 h-12 pointer-events-none" style={{
        borderRight: `1px solid ${tierData.borderColor}`,
        borderTop: `1px solid ${tierData.borderColor}`,
      }} />
      <div className="fixed bottom-8 left-8 w-12 h-12 pointer-events-none" style={{
        borderLeft: `1px solid ${tierData.borderColor}`,
        borderBottom: `1px solid ${tierData.borderColor}`,
      }} />
      <div className="fixed bottom-8 right-8 w-12 h-12 pointer-events-none" style={{
        borderRight: `1px solid ${tierData.borderColor}`,
        borderBottom: `1px solid ${tierData.borderColor}`,
      }} />

      <div className="relative z-10 max-w-sm w-full">

        {/* Helm icon */}
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-6"
          style={{
            border: `1px solid ${tierData.borderColor}`,
            background: tierData.bgColor,
            boxShadow: `0 0 40px ${tierData.glowColor}`,
          }}>
          <div style={{ filter: `drop-shadow(0 0 8px ${tierData.glowColor})` }}>
            {tier === 'victoria'
              ? <HelmetFilled size={52} color={tierData.helmColor} />
              : <GreatHelm size={52} color={tierData.helmColor} strokeWidth={1.5} />
            }
          </div>
        </div>

        {/* Latin label */}
        <p className="font-cinzel text-[#4d4568] text-[8px] tracking-[0.5em] uppercase mb-3">
          {dateLabel}
        </p>
        <h1 className="font-cinzel text-3xl font-bold text-[#f0e6d0] tracking-[0.1em] mb-2"
          style={{ textShadow: `0 0 40px ${tierData.glowColor}` }}>
          {tierData.latin}
        </h1>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5 px-6">
          <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${tierData.borderColor})` }} />
          <DiamondOrnament color="#4d4568" size={8} />
          <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${tierData.borderColor}, transparent)` }} />
        </div>

        {/* Score */}
        <div className="mb-2">
          <span className="font-mono font-black text-6xl"
            style={{
              color: tierData.scoreColor,
              textShadow: `0 0 30px ${tierData.glowColor}`,
            }}>
            {score}
          </span>
          <span className="font-cinzel text-[#4d4568] text-xl ml-2">/ 100</span>
        </div>
        <p className="text-[#9490aa] text-sm mb-10 max-w-xs mx-auto leading-relaxed">
          {tierData.subtitle}
        </p>

        <button
          onClick={startNewDay}
          disabled={starting}
          className="btn-primary mb-6"
        >
          {starting ? 'Cargando...' : 'Comenzar Nueva Jornada →'}
        </button>

        <p className="font-cinzel text-[#4d4568] text-[7px] tracking-[0.25em] uppercase mb-4">
          ✦ El Consejero está disponible abajo
        </p>
      </div>

      <AiChat initialMessage={`Analiza mi día ${dateLabel} y dame feedback honesto como coach. Revisá mis bloques, áreas completadas, evidencias y score.`} />
    </div>
  );
}
