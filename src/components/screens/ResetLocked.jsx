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
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-center px-6">
      <div className="space-y-6 max-w-sm">
        <div className="text-5xl">🔒</div>
        <h1 className="text-2xl font-black text-gray-100">App reseteada</h1>
        <p className="text-gray-400 text-sm">
          Tu progreso ha sido completamente borrado. Vuelve mañana a las <strong>7:00 AM</strong> para comenzar el Día 1.
        </p>

        <div className="bg-[#1a1a1a] border border-[#333333] rounded-2xl p-8 mt-8">
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">Tiempo hasta desbloquearse</p>
          <div className="text-4xl font-black text-yellow-400 font-mono">{timeLeft || "00:00:00"}</div>
        </div>

        <p className="text-gray-600 text-xs mt-6">
          La app se actualizará automáticamente cuando llegue la hora.
        </p>
      </div>
    </div>
  );
}
