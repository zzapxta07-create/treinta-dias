export default function ScoreRing({ score = 0, max = 100, size = 120 }) {
  const r     = (size - 16) / 2;
  const circ  = 2 * Math.PI * r;
  const pct   = Math.min(1, Math.max(0, score / max));
  const dash  = pct * circ;
  const color = score >= 70 ? '#d4a956' : score >= 40 ? '#9490aa' : '#9b1f30';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#2c2740" strokeWidth="7" />
        <circle
          cx={size/2} cy={size/2} r={r}
          fill="none"
          stroke={color}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-mono font-black text-[#f0e6d0]" style={{ fontSize: size * 0.24, color }}>
          {score}
        </span>
        <span className="font-cinzel text-[#4d4568]" style={{ fontSize: size * 0.08 }}>/ {max}</span>
      </div>
    </div>
  );
}
