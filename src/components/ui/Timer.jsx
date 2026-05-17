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
      className={`font-mono text-5xl font-black ${
        urgent ? "text-red-400 animate-pulse" : "text-white"
      } ${className}`}
    >
      {formatCountdown(secs)}
    </span>
  );
}
