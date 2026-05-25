export default function ScoreRing({ score = 0, max = 100, size = 120 }) {
  const r       = (size - 16) / 2;
  const circ    = 2 * Math.PI * r;
  const pct     = Math.min(1, Math.max(0, score / max));
  const dash    = pct * circ;
  const color   = score >= 70 ? '#10B981' : score >= 40 ? '#F59E0B' : '#EF4444';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="#222222" strokeWidth="8"
        />
        {/* Progress */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-mono font-black text-white" style={{ fontSize: size * 0.25 }}>
          {score}
        </span>
        <span className="text-[#6B7280]" style={{ fontSize: size * 0.1 }}>/ {max}</span>
      </div>
    </div>
  );
}
