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

      const hours   = Math.floor(diff / 3600000);
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
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6"
      style={{ background: '#09080e' }}>
      <div className="fixed inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)' }} />

      <div className="relative space-y-6 max-w-sm">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full"
          style={{ border: '1px solid #2c2740', background: '#110e1c' }}>
          <span style={{ color: '#d4a956', fontSize: '24px' }}>⚿</span>
        </div>

        <div>
          <p className="font-cinzel text-[9px] tracking-[0.4em] uppercase mb-2" style={{ color: '#4d4568' }}>
            Fortaleza Sellada
          </p>
          <h1 className="font-cinzel text-2xl font-bold tracking-[0.06em]" style={{ color: '#f0e6d0' }}>
            Acceso Restringido
          </h1>
        </div>

        <p className="text-sm leading-relaxed" style={{ color: '#9490aa' }}>
          El pergamino ha sido reiniciado. Las puertas del castillo se abrirán mañana a las{' '}
          <strong style={{ color: '#d4a956' }}>7:00 AM</strong> para comenzar una nueva jornada.
        </p>

        <div className="rounded-xl p-8"
          style={{
            background: 'linear-gradient(135deg, #17142a 0%, #110e1c 100%)',
            border: '1px solid #2c2740',
          }}>
          <p className="font-cinzel text-[8px] uppercase tracking-[0.25em] mb-3" style={{ color: '#4d4568' }}>
            Tiempo hasta desbloquearse
          </p>
          <div className="font-mono text-4xl font-black" style={{ color: '#d4a956' }}>
            {timeLeft || "00:00:00"}
          </div>
        </div>

        <p className="font-cinzel text-[8px] uppercase tracking-widest" style={{ color: '#2c2740' }}>
          La app se actualizará automáticamente al llegar la hora.
        </p>
      </div>
    </div>
  );
}
