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
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] text-center px-6">
        <div className="text-6xl mb-4">💤</div>
        <p className="text-red-400 text-2xl font-black">Tiempo agotado</p>
        <p className="text-gray-500 mt-3">
          El día quedó perdido. Mañana a las 7am de nuevo.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] px-6 py-10">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-black mb-1 text-center tracking-tight">
          MODO DUCHA
        </h1>
        <p className="text-gray-500 text-sm text-center mb-8">
          Andá a ducharte. Tenés 20 minutos para volver con tu foto.
        </p>

        <div className="text-center mb-8">
          {showerTimer && (
            <Timer deadline={showerTimer.deadline} onExpire={handleExpire} />
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <p className="text-sm text-gray-400 mb-3 text-center">Foto post-ducha</p>
            <div className="flex justify-center">
              <PhotoUpload
                value={photo}
                onChange={setPhoto}
                label="Subir foto de ducha"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400 block mb-1.5">
              Frase motivacional del día
            </label>
            <textarea
              value={phrase}
              onChange={(e) => setPhrase(e.target.value)}
              rows={3}
              placeholder="Escribí tu frase para hoy..."
              className="w-full bg-[#1a1a1a] rounded-xl px-4 py-3 text-sm text-white placeholder-gray-700 border border-[#333333] focus:outline-none focus:border-gray-500 resize-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full bg-green-500 text-black font-black py-4 rounded-xl text-lg active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-transform"
          >
            LISTO, A TRABAJAR
          </button>
        </div>
      </div>
    </div>
  );
}
