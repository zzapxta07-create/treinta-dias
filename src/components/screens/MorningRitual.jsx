import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import Timer from '../ui/Timer';
import PhotoUpload from '../ui/PhotoUpload';
import api from '../../api/index.js';

export default function MorningRitual() {
  const currentDay       = useStore((s) => s.currentDay);
  const ritualTimer      = useStore((s) => s.ritualTimer);
  const startRitualTimer = useStore((s) => s.startRitualTimer);
  const clearRitualTimer = useStore((s) => s.clearRitualTimer);
  const setCurrentDay    = useStore((s) => s.setCurrentDay);

  const [photo,     setPhoto]     = useState(null);
  const [phrase,    setPhrase]    = useState('');
  const [expired,   setExpired]   = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!ritualTimer) startRitualTimer();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (!photo || phrase.trim().length < 3 || submitted) return;
    setSubmitted(true);
    clearRitualTimer();
    try {
      const { data } = await api.put(`/api/days/${currentDay.date_key}/ritual`, {
        phrase:     phrase.trim(),
        photo_path: photo,
      });
      setCurrentDay(data.data);
    } catch {
      setSubmitted(false);
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
            El día quedó perdido. Mañana a partir de las 7am el caballero podrá levantarse de nuevo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0806] px-6 py-10">
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)' }} />

      <div className="relative w-full max-w-sm">
        {/* Crest */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-[#3a2e22] bg-[#110d0a] mb-4">
            <span className="text-[#c9a254] text-2xl">☀</span>
          </div>
          <p className="font-cinzel text-[#5a4838] text-[9px] tracking-[0.4em] uppercase mb-1">
            Aurora Matutina
          </p>
          <h1 className="font-cinzel text-2xl font-bold text-[#f0e6d0] tracking-[0.06em]">
            Ritual del Alba
          </h1>
          <div className="flex items-center gap-3 mt-3">
            <div className="flex-1 h-px bg-[#3a2e22]" />
            <span className="text-[#5a4838] text-xs">◆</span>
            <div className="flex-1 h-px bg-[#3a2e22]" />
          </div>
        </div>

        <p className="text-[#9a8470] text-sm text-center mb-6">
          Duchate y vuelve con tu foto en 30 minutos.
        </p>

        {/* Timer */}
        <div className="text-center mb-8">
          {ritualTimer && (
            <Timer deadline={ritualTimer.deadline} onExpire={handleExpire} />
          )}
        </div>

        <div className="flex flex-col gap-5">
          {/* Photo */}
          <div>
            <p className="font-cinzel text-[9px] text-[#5a4838] tracking-[0.2em] uppercase mb-3 text-center">
              Prueba del Ritual
            </p>
            <div className="flex justify-center">
              <PhotoUpload value={photo} onChange={setPhoto} label="Subir foto de ducha" />
            </div>
          </div>

          {/* Phrase */}
          <div>
            <label className="font-cinzel text-[9px] text-[#5a4838] block mb-2 tracking-[0.2em] uppercase">
              Frase de Batalla del Día
            </label>
            <textarea
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              rows={3}
              placeholder="Escribí tu frase para hoy..."
              className="w-full bg-[#110d0a] rounded px-4 py-3 text-sm text-[#f0e6d0] placeholder-[#3a2e22] border border-[#3a2e22] focus:outline-none focus:border-[#c9a254] resize-none transition-colors"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!photo || phrase.trim().length < 3 || submitted}
            className="w-full font-cinzel font-bold bg-[#f0e6d0] text-[#0a0806] py-4 rounded text-sm tracking-[0.12em] uppercase active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-transform"
          >
            {submitted ? 'Guardando...' : '¡A las Armas!'}
          </button>
        </div>
      </div>
    </div>
  );
}
