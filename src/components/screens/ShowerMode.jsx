import { useState } from "react";
import { useStore } from "../../store/useStore";
import Timer from "../ui/Timer";
import PhotoUpload from "../ui/PhotoUpload";

const inputStyle = {
  width: '100%',
  background: '#09080e',
  color: '#f0e6d0',
  border: '1px solid #2c2740',
  borderRadius: '8px',
  padding: '12px 16px',
  outline: 'none',
  resize: 'none',
  fontFamily: "'Crimson Text', serif",
  fontSize: '14px',
  transition: 'border-color 0.2s',
};

export default function ShowerMode() {
  const showerTimer    = useStore((s) => s.currentDay.showerTimer);
  const completeShower = useStore((s) => s.completeShower);
  const showerFailed   = useStore((s) => s.showerFailed);

  const [photo,     setPhoto]     = useState(null);
  const [phrase,    setPhrase]    = useState("");
  const [expired,   setExpired]   = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleExpire() {
    if (submitted) return;
    setExpired(true);
    showerFailed();
  }

  function handleSubmit() {
    if (!photo || phrase.trim().length < 3 || submitted) return;
    setSubmitted(true);
    completeShower(photo, phrase.trim());
  }

  const canSubmit = photo && phrase.trim().length >= 3;

  if (expired) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6"
        style={{ background: '#09080e' }}>
        <div className="fixed inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)' }} />
        <div className="relative">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-5"
            style={{ border: '1px solid rgba(155,31,48,0.4)', background: '#110e1c' }}>
            <span style={{ color: '#9b1f30', fontSize: '24px' }}>☽</span>
          </div>
          <p className="font-cinzel text-2xl font-bold tracking-[0.08em]" style={{ color: '#9b1f30' }}>
            Tiempo Agotado
          </p>
          <p className="mt-3 text-sm" style={{ color: '#9490aa' }}>
            El día quedó perdido. Mañana a las 7am de nuevo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10"
      style={{ background: '#09080e' }}>
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(212,169,86,0.04) 0%, transparent 50%)' }} />

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4"
            style={{ border: '1px solid rgba(212,169,86,0.3)', background: '#110e1c' }}>
            <span style={{ color: '#d4a956', fontSize: '24px' }}>☀</span>
          </div>
          <p className="font-cinzel text-[9px] tracking-[0.4em] uppercase mb-1" style={{ color: '#4d4568' }}>
            Purificación
          </p>
          <h1 className="font-cinzel text-2xl font-bold tracking-[0.06em]" style={{ color: '#f0e6d0' }}>
            Ritual del Agua
          </h1>
        </div>

        <p className="text-sm text-center mb-6" style={{ color: '#9490aa' }}>
          Ve a ducharte. Tienes 20 minutos para volver con tu foto.
        </p>

        <div className="text-center mb-8">
          {showerTimer && (
            <Timer deadline={showerTimer.deadline} onExpire={handleExpire} />
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <p className="font-cinzel text-[9px] tracking-[0.2em] uppercase mb-3 text-center" style={{ color: '#4d4568' }}>
              Prueba del Ritual
            </p>
            <div className="flex justify-center">
              <PhotoUpload value={photo} onChange={setPhoto} label="Subir foto de ducha" />
            </div>
          </div>

          <div>
            <label className="font-cinzel text-[9px] block mb-2 tracking-[0.2em] uppercase" style={{ color: '#4d4568' }}>
              Frase de Batalla
            </label>
            <textarea
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              rows={3}
              placeholder="Escribí tu frase para hoy..."
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = '#d4a956'; }}
              onBlur={e => { e.target.style.borderColor = '#2c2740'; }}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full btn-primary disabled:opacity-30"
          >
            ¡A las Armas!
          </button>
        </div>
      </div>
    </div>
  );
}
