import { useEffect, useState } from "react";

export default function ResetLocked({ unlocksAt }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const diff = unlocksAt - now;

      if (diff <= 0) {
        window.location.reload();
        return;
      }

      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      setTimeLeft(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [unlocksAt]);

  return (
    <div className="min-h-screen bg-[#0a0806] flex flex-col items-center justify-center text-center px-6">
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)' }} />
      <div className="relative space-y-6 max-w-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-[#3a2e22] bg-[#110d0a]">
          <span className="text-[#c9a254] text-2xl">⚿</span>
        </div>
        <div>
          <p className="font-cinzel text-[9px] text-[#5a4838] tracking-[0.4em] uppercase mb-2">
            Fortaleza Sellada
          </p>
          <h1 className="font-cinzel text-2xl font-bold text-[#f0e6d0] tracking-[0.06em]">
            Acceso Restringido
          </h1>
        </div>
        <p className="text-[#9a8470] text-sm leading-relaxed">
          El pergamino ha sido reiniciado. Las puertas del castillo se abrirán mañana a las <strong className="text-[#c9a254]">7:00 AM</strong> para comenzar una nueva jornada.
        </p>

        <div className="bg-[#110d0a] border border-[#3a2e22] rounded-lg p-8 mt-4">
          <p className="font-cinzel text-[8px] text-[#5a4838] uppercase tracking-[0.25em] mb-3">
            Tiempo hasta desbloquearse
          </p>
          <div className="font-mono text-4xl font-black text-[#c9a254]">{timeLeft || "00:00:00"}</div>
        </div>

        <p className="font-cinzel text-[#3a2e22] text-[8px] mt-4 uppercase tracking-widest">
          La app se actualizará automáticamente al llegar la hora.
        </p>
      </div>
    </div>
  );
}
