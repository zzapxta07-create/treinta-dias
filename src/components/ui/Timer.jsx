import { useEffect, useState } from "react";
import { secondsUntil, formatCountdown } from "../../utils/dateUtils";

export default function Timer({ deadline, onExpire, className = "" }) {
  const [secs, setSecs] = useState(() => secondsUntil(deadline));

  useEffect(() => {
    const id = setInterval(() => {
      const remaining = secondsUntil(deadline);
      setSecs(remaining);
      if (remaining === 0) {
        clearInterval(id);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  const urgent = secs < 120;
  return (
    <span
      className={`font-mono text-5xl font-black ${className}`}
      style={{
        color: urgent ? '#c43040' : '#f0e6d0',
        textShadow: urgent ? '0 0 20px rgba(196,48,64,0.5)' : '0 0 30px rgba(212,169,86,0.15)',
        animation: urgent ? 'pulse 1s ease-in-out infinite' : 'none',
      }}
    >
      {formatCountdown(secs)}
    </span>
  );
}
