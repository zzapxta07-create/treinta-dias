import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import Timer from '../ui/Timer';
import api from '../../api/index.js';

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

  if (expired) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0806] text-center px-6">
        <div className="fixed inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)' }} />
        <div className="relative">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-[#8b1a2a]/40 bg-[#110d0a] mb-6">
            <span className="text-[#8b1a2a] text-2xl">☽</span>
          </div>
          <p className="font-cinzel text-[#8b1a2a] text-2xl font-bold tracking-[0.08em] mb-3">
            Tiempo Agotado
          </p>
          <p className="text-[#9a8470] text-sm leading-relaxed max-w-xs">
            El día quedó perdido. Mañana a partir de las 7am podrás comenzar de nuevo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0806] px-4 py-8">
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)' }} />

      <div className="relative max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-[#3a2e22] bg-[#110d0a] mb-3">
            <span className="text-[#c9a254] text-xl">✦</span>
          </div>
          <p className="font-cinzel text-[#5a4838] text-[9px] tracking-[0.4em] uppercase mb-1">
            Aurora Matutina
          </p>
          <h1 className="font-cinzel text-2xl font-bold text-[#f0e6d0] tracking-[0.06em]">
            Ritual del Alba
          </h1>
          <div className="flex items-center gap-3 mt-3 mb-4">
            <div className="flex-1 h-px bg-[#3a2e22]" />
            <span className="text-[#5a4838] text-xs">◆</span>
            <div className="flex-1 h-px bg-[#3a2e22]" />
          </div>
          {ritualTimer && (
            <div className="inline-block">
              <Timer deadline={ritualTimer.deadline} onExpire={handleExpire} />
            </div>
          )}
        </div>

        {/* Essay */}
        <div className="bg-[#110d0a] rounded-lg p-4 mb-4 border border-[#3a2e22]">
          <div className="flex items-center justify-between mb-3">
            <p className="font-cinzel text-[9px] text-[#5a4838] tracking-[0.25em] uppercase">
              Ensayo Matutino
            </p>
            <span className={`font-mono text-xs ${words >= 500 ? 'text-[#c9a254]' : 'text-[#8b1a2a]'}`}>
              {words} / 500 palabras
            </span>
          </div>
          <p className="text-[#5a4838] text-xs mb-3 leading-relaxed">
            Escribe sobre tus objetivos del día, reflexiones, lo que vas a lograr hoy. Mínimo 500 palabras.
          </p>
          <textarea
            value={essay}
            onChange={(e) => { setEssay(e.target.value); setError(''); }}
            rows={12}
            placeholder="Hoy me propongo..."
            className="w-full bg-[#0a0806] text-[#f0e6d0] text-sm rounded px-3 py-2.5 outline-none border border-[#3a2e22] focus:border-[#c9a254] resize-none placeholder-[#3a2e22] transition-colors leading-relaxed"
          />
          <div className="mt-2 h-1 bg-[#3a2e22] rounded overflow-hidden">
            <div
              className="h-full bg-[#c9a254] transition-all duration-300"
              style={{ width: `${Math.min(100, (words / 500) * 100)}%` }}
            />
          </div>
        </div>

        {/* Phrase */}
        <div className="bg-[#110d0a] rounded-lg p-4 mb-4 border border-[#3a2e22]">
          <label className="font-cinzel text-[9px] text-[#5a4838] block mb-2 tracking-[0.2em] uppercase">
            Frase de Batalla
          </label>
          <input
            type="text"
            value={phrase}
            onChange={(e) => setPhrase(e.target.value)}
            placeholder="Una frase que guíe la jornada..."
            className="w-full bg-[#0a0806] text-[#f0e6d0] text-sm rounded px-3 py-2.5 outline-none border border-[#3a2e22] focus:border-[#c9a254] placeholder-[#3a2e22] transition-colors"
          />
        </div>

        {error && (
          <p className="text-[#8b1a2a] text-sm bg-[#8b1a2a]/10 border border-[#8b1a2a]/30 px-3 py-2 rounded mb-4">
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!isValid || submitted}
          className="w-full font-cinzel font-bold bg-[#f0e6d0] text-[#0a0806] py-4 rounded text-sm tracking-[0.12em] uppercase active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-transform"
        >
          {submitted ? 'Guardando...' : '¡A las Armas! →'}
        </button>
      </div>
    </div>
  );
}
