import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import Timer from '../ui/Timer';
import PhotoUpload from '../ui/PhotoUpload';
import api from '../../api/index.js';

export default function MorningRitual() {
  const currentDay     = useStore((s) => s.currentDay);
  const ritualTimer    = useStore((s) => s.ritualTimer);
  const startRitualTimer = useStore((s) => s.startRitualTimer);
  const clearRitualTimer = useStore((s) => s.clearRitualTimer);
  const setCurrentDay  = useStore((s) => s.setCurrentDay);

  const [photo,     setPhoto]     = useState(null);
  const [phrase,    setPhrase]    = useState('');
  const [expired,   setExpired]   = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Start timer on mount if not already running
  useEffect(() => {
    if (!ritualTimer) startRitualTimer();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleExpire() {
    if (submitted) return;
    setExpired(true);
    clearRitualTimer();
    // Mark day as lost
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#080808] text-center px-6">
        <div className="text-6xl mb-4">💤</div>
        <p className="text-red-400 text-2xl font-black">Tiempo agotado</p>
        <p className="text-[#6B7280] mt-3">El día quedó perdido. Mañana a las 7am de nuevo.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#080808] px-6 py-10">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-black mb-1 text-center tracking-tight">RITUAL MATUTINO</h1>
        <p className="text-[#6B7280] text-sm text-center mb-8">
          Duchate y volvé con tu foto en 30 minutos.
        </p>

        <div className="text-center mb-8">
          {ritualTimer && (
            <Timer deadline={ritualTimer.deadline} onExpire={handleExpire} />
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <p className="text-sm text-[#6B7280] mb-3 text-center">Foto post-ducha</p>
            <div className="flex justify-center">
              <PhotoUpload value={photo} onChange={setPhoto} label="Subir foto de ducha" />
            </div>
          </div>

          <div>
            <label className="text-sm text-[#6B7280] block mb-1.5">Frase motivacional del día</label>
            <textarea
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              rows={3}
              placeholder="Escribí tu frase para hoy..."
              className="w-full bg-[#101010] rounded-xl px-4 py-3 text-sm text-white placeholder-[#374151] border border-[#2C2C2C] focus:outline-none focus:border-[#6B7280] resize-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!photo || phrase.trim().length < 3 || submitted}
            className="w-full bg-green-500 text-black font-black py-4 rounded-xl text-lg active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-transform"
          >
            {submitted ? 'Guardando...' : 'LISTO, A TRABAJAR'}
          </button>
        </div>
      </div>
    </div>
  );
}
