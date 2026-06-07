import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import Timer from '../ui/Timer';
import api from '../../api/index.js';
import { HelmetFilled, DiamondOrnament, OrnamentalDivider } from '../ui/Ornaments';

function validateEssay(text) {
  const words = text.trim().split(/\s+/).filter(w => w.length > 1);
  if (words.length < 500) {
    return `Mínimo 500 palabras. Llevas ${words.length}.`;
  }
  const unique = new Set(words.map(w => w.toLowerCase().replace(/[^a-záéíóúñü]/gi, '')));
  if (unique.size < words.length * 0.25) {
    return 'Texto demasiado repetitivo. Usa más variedad de palabras.';
  }
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 15);
  if (sentences.length < 8) {
    return 'Necesita más oraciones completas (mínimo 8).';
  }
  return null;
}

export default function MorningRitual() {
  const currentDay       = useStore((s) => s.currentDay);
  const ritualTimer      = useStore((s) => s.ritualTimer);
  const startRitualTimer = useStore((s) => s.startRitualTimer);
  const clearRitualTimer = useStore((s) => s.clearRitualTimer);
  const setCurrentDay    = useStore((s) => s.setCurrentDay);

  const [essay,     setEssay]     = useState('');
  const [phrase,    setPhrase]    = useState('');
  const [expired,   setExpired]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error,     setError]     = useState('');

  useEffect(() => {
    if (!ritualTimer) startRitualTimer();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const words = essay.trim().split(/\s+/).filter(w => w.length > 1).length;
  const isValid = words >= 500 && phrase.trim().length >= 3;

  async function handleExpire() {
    if (submitted) return;
    setExpired(true);
    clearRitualTimer();
    try {
      const { data } = await api.post(`/api/days/${currentDay.date_key}/lose`);
      setCurrentDay(data.data);
    } catch {}
  }

  async function handleSubmit() {
    const validationError = validateEssay(essay);
    if (validationError) { setError(validationError); return; }
    if (phrase.trim().length < 3) { setError('La frase de batalla es obligatoria.'); return; }
    if (submitted) return;
    setError('');
    setSubmitted(true);
    clearRitualTimer();
    try {
      const { data } = await api.put(`/api/days/${currentDay.date_key}/ritual`, {
        phrase:       phrase.trim(),
        ritual_essay: essay.trim(),
      });
      setCurrentDay(data.data);
    } catch {
      setSubmitted(false);
      setError('Error al guardar. Intenta de nuevo.');
    }
  }

  const panelStyle = {
    background: 'linear-gradient(135deg, #17142a 0%, #110e1c 100%)',
    border: '1px solid #2c2740',
    borderRadius: '12px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(212,169,86,0.04)',
  };

  if (expired) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6"
        style={{ background: 'linear-gradient(160deg, #100a12 0%, #0c0a14 50%, #080608 100%)' }}>
        <div className="fixed inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, transparent 20%, rgba(155,31,48,0.05) 100%)' }} />
        <div className="relative">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
            style={{
              border: '1px solid rgba(155,31,48,0.3)',
              background: 'rgba(155,31,48,0.06)',
              boxShadow: '0 0 30px rgba(155,31,48,0.1)',
            }}>
            <span className="text-[#9b1f30] text-3xl">☽</span>
          </div>
          <p className="font-cinzel text-[#9b1f30] text-2xl font-bold tracking-[0.08em] mb-3"
            style={{ textShadow: '0 0 30px rgba(155,31,48,0.3)' }}>
            Tiempo Agotado
          </p>
          <p className="text-[#9490aa] text-sm leading-relaxed max-w-xs">
            El día quedó perdido. Mañana a partir de las 7am podrás comenzar de nuevo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 relative"
      style={{ background: 'linear-gradient(160deg, #0f0d1a 0%, #0c0a14 50%, #09080e 100%)' }}>

      {/* Atmospheric overlays */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 50% at 50% -5%, rgba(90,70,150,0.1) 0%, transparent 65%)',
      }} />
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)',
      }} />

      {/* Faint background helm */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none" style={{ opacity: 0.025 }}>
        <HelmetFilled size={500} color="#d4a956" />
      </div>

      <div className="relative max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
            style={{
              background: 'linear-gradient(135deg, #1e1b2e 0%, #110e1c 100%)',
              border: '1px solid rgba(212,169,86,0.2)',
              boxShadow: '0 0 20px rgba(212,169,86,0.1)',
            }}>
            <HelmetFilled size={30} color="#d4a956" />
          </div>
          <p className="font-cinzel text-[#4d4568] text-[8px] tracking-[0.5em] uppercase mb-2">
            Aurora Matutina
          </p>
          <h1 className="font-cinzel text-3xl font-bold text-[#f0e6d0] tracking-[0.06em]"
            style={{ textShadow: '0 0 40px rgba(212,169,86,0.12)' }}>
            Ritual del Alba
          </h1>
          <div className="flex items-center gap-3 mt-4 mb-5">
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, #2c2740)' }} />
            <DiamondOrnament color="#4d4568" size={8} />
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, #2c2740, transparent)' }} />
          </div>
          {ritualTimer && (
            <div className="inline-block">
              <Timer deadline={ritualTimer.deadline} onExpire={handleExpire} />
            </div>
          )}
        </div>

        {/* Essay */}
        <div className="p-5 mb-4" style={panelStyle}>
          <div className="flex items-center justify-between mb-3">
            <p className="font-cinzel text-[8px] text-[#4d4568] tracking-[0.3em] uppercase">
              Ensayo Matutino
            </p>
            <span className={`font-mono text-xs font-bold ${words >= 500 ? 'text-[#d4a956]' : 'text-[#9b1f30]'}`}
              style={words >= 500 ? { textShadow: '0 0 10px rgba(212,169,86,0.3)' } : {}}>
              {words} / 500
            </span>
          </div>
          <p className="text-[#4d4568] text-sm mb-3 leading-relaxed">
            Escribe sobre tus objetivos del día, reflexiones, lo que vas a lograr hoy. Mínimo 500 palabras.
          </p>
          <textarea
            value={essay}
            onChange={(e) => { setEssay(e.target.value); setError(''); }}
            rows={12}
            placeholder="Hoy me propongo..."
            style={{
              width: '100%',
              background: '#0c0a14',
              color: '#f0e6d0',
              fontSize: '15px',
              lineHeight: '1.7',
              borderRadius: '8px',
              padding: '12px 14px',
              border: '1px solid #2c2740',
              outline: 'none',
              resize: 'none',
              fontFamily: "'Crimson Text', serif",
              transition: 'border-color 0.2s',
            }}
            onFocus={e => { e.target.style.borderColor = '#d4a956'; }}
            onBlur={e => { e.target.style.borderColor = '#2c2740'; }}
          />
          <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: '#2c2740' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (words / 500) * 100)}%`,
                background: words >= 500
                  ? 'linear-gradient(90deg, #c49040, #d4a956)'
                  : 'linear-gradient(90deg, #9b1f30, #c43040)',
                boxShadow: words >= 500 ? '0 0 8px rgba(212,169,86,0.3)' : 'none',
              }}
            />
          </div>
        </div>

        {/* Phrase */}
        <div className="p-5 mb-4" style={panelStyle}>
          <label className="font-cinzel text-[8px] text-[#4d4568] block mb-2 tracking-[0.3em] uppercase">
            Frase de Batalla
          </label>
          <input
            type="text"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            placeholder="Una frase que guíe la jornada..."
            style={{
              width: '100%',
              background: '#0c0a14',
              color: '#f0e6d0',
              fontSize: '16px',
              borderRadius: '8px',
              padding: '12px 14px',
              border: '1px solid #2c2740',
              outline: 'none',
              fontFamily: "'Crimson Text', serif",
              fontStyle: 'italic',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => { e.target.style.borderColor = '#d4a956'; }}
            onBlur={e => { e.target.style.borderColor = '#2c2740'; }}
          />
        </div>

        {error && (
          <p className="text-sm px-4 py-3 rounded-lg mb-4"
            style={{
              color: '#c43040',
              background: 'rgba(155,31,48,0.08)',
              border: '1px solid rgba(155,31,48,0.25)',
            }}>
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!isValid || submitted}
          className="btn-primary"
        >
          {submitted ? 'Guardando...' : '¡A las Armas! →'}
        </button>
      </div>
    </div>
  );
}
