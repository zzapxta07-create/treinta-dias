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
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
        style={{ background: '#09080e' }}>
        <div className="fixed inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)' }} />
        <div className="relative max-w-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-5"
            style={{ border: '1px solid rgba(212,169,86,0.3)', background: '#110e1c' }}>
            <span style={{ color: '#d4a956', fontSize: '24px' }}>⏳</span>
          </div>
          <p className="font-cinzel text-[9px] tracking-[0.4em] uppercase mb-2" style={{ color: '#4d4568' }}>
            Entrada Tardía
          </p>
          <h1 className="font-cinzel text-2xl font-bold tracking-[0.06em] mb-3" style={{ color: '#f0e6d0' }}>
            Más de las 8:00am
          </h1>
          <p className="mb-8 leading-relaxed text-sm" style={{ color: '#9490aa' }}>
            No tienes salvoconducto disponible. Puedes continuar — quedará registrado como entrada tardía.
          </p>
          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={continueAnyway}
              disabled={loading}
              className="font-cinzel font-bold py-4 px-6 rounded text-sm tracking-[0.12em] uppercase active:scale-95 disabled:opacity-50 transition-transform"
              style={{
                background: 'rgba(212,169,86,0.1)',
                color: '#d4a956',
                border: '1px solid rgba(212,169,86,0.3)',
              }}
            >
              Continuar de todas formas
            </button>
            <button
              onClick={loseDay}
              disabled={loading}
              className="font-cinzel text-[9px] tracking-widest uppercase py-2 disabled:opacity-50 transition-colors"
              style={{ color: '#4d4568' }}
              onMouseOver={e => { e.currentTarget.style.color = '#9b1f30'; }}
              onMouseOut={e => { e.currentTarget.style.color = '#4d4568'; }}
            >
              Marcar día como perdido (−150 pts)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: '#09080e' }}>
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)' }} />
      <div className="relative max-w-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-5"
          style={{ border: '1px solid rgba(212,169,86,0.4)', background: '#110e1c' }}>
          <span style={{ color: '#d4a956', fontSize: '24px' }}>⚡</span>
        </div>
        <p className="font-cinzel text-[9px] tracking-[0.4em] uppercase mb-2" style={{ color: '#4d4568' }}>
          Entrada Tardía
        </p>
        <h1 className="font-cinzel text-2xl font-bold tracking-[0.06em] mb-3" style={{ color: '#f0e6d0' }}>
          Más de las 8:00am
        </h1>
        <p className="mb-8 leading-relaxed text-sm" style={{ color: '#9490aa' }}>
          Tienes <span style={{ color: '#d4a956', fontWeight: 'bold' }}>1 Salvoconducto</span> disponible.
          Úsalo para que la jornada continúe sin penalización.
        </p>
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={useUps}
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50"
          >
            Usar Salvoconducto
          </button>
          <button
            onClick={continueAnyway}
            disabled={loading}
            className="font-cinzel text-[9px] tracking-widest uppercase py-2 disabled:opacity-50 transition-colors"
            style={{ color: 'rgba(212,169,86,0.5)' }}
            onMouseOver={e => { e.currentTarget.style.color = '#d4a956'; }}
            onMouseOut={e => { e.currentTarget.style.color = 'rgba(212,169,86,0.5)'; }}
          >
            Continuar sin salvoconducto (entrada tarde)
          </button>
          <button
            onClick={loseDay}
            disabled={loading}
            className="font-cinzel text-[9px] tracking-widest uppercase py-1 disabled:opacity-50 transition-colors"
            style={{ color: '#2c2740' }}
            onMouseOver={e => { e.currentTarget.style.color = '#9b1f30'; }}
            onMouseOut={e => { e.currentTarget.style.color = '#2c2740'; }}
          >
            Marcar día como perdido (−150 pts)
          </button>
        </div>
        <p className="font-cinzel text-[7px] mt-6 uppercase tracking-widest" style={{ color: '#2c2740' }}>
          El salvoconducto solo puede usarse una vez por mes.
        </p>
      </div>
    </div>
  );
}
