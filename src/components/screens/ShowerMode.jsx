import { useState } from "react";
import { useStore } from "../../store/useStore";
import Timer from "../ui/Timer";
import PhotoUpload from "../ui/PhotoUpload";

export default function ShowerMode() {
  const showerTimer = useStore((s) => s.currentDay.showerTimer);
  const completeShower = useStore((s) => s.completeShower);
  const showerFailed = useStore((s) => s.showerFailed);

  const [photo, setPhoto] = useState(null);
  const [phrase, setPhrase] = useState("");
  const [expired, setExpired] = useState(false);
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0806] text-center px-6">
        <div className="fixed inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)' }} />
        <div className="relative">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-[#8b1a2a]/40 bg-[#110d0a] mb-5">
            <span className="text-[#8b1a2a] text-2xl">☽</span>
          </div>
          <p className="font-cinzel text-[#8b1a2a] text-2xl font-bold tracking-[0.08em]">Tiempo Agotado</p>
          <p className="text-[#9a8470] mt-3 text-sm">El día quedó perdido. Mañana a las 7am de nuevo.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0806] px-6 py-10">
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)' }} />
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full border border-[#3a2e22] bg-[#110d0a] mb-4">
            <span className="text-[#c9a254] text-2xl">☀</span>
          </div>
          <p className="font-cinzel text-[#5a4838] text-[9px] tracking-[0.4em] uppercase mb-1">Purificación</p>
          <h1 className="font-cinzel text-2xl font-bold text-[#f0e6d0] tracking-[0.06em]">Ritual del Agua</h1>
        </div>
        <p className="text-[#9a8470] text-sm text-center mb-6">
          Ve a ducharte. Tienes 20 minutos para volver con tu foto.
        </p>

        <div className="text-center mb-8">
          {showerTimer && (
            <Timer deadline={showerTimer.deadline} onExpire={handleExpire} />
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <p className="font-cinzel text-[9px] text-[#5a4838] tracking-[0.2em] uppercase mb-3 text-center">
              Prueba del Ritual
            </p>
            <div className="flex justify-center">
              <PhotoUpload value={photo} onChange={setPhoto} label="Subir foto de ducha" />
            </div>
          </div>

          <div>
            <label className="font-cinzel text-[9px] text-[#5a4838] block mb-2 tracking-[0.2em] uppercase">
              Frase de Batalla
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
            disabled={!canSubmit}
            className="w-full font-cinzel font-bold bg-[#f0e6d0] text-[#0a0806] py-4 rounded text-sm tracking-[0.12em] uppercase active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-transform"
          >
            ¡A las Armas!
          </button>
        </div>
      </div>
    </div>
  );
}
