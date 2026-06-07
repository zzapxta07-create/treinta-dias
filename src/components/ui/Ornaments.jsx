/* Heraldic SVG components for the Dark Academia visual theme */

export function GreatHelm({ size = 80, color = '#d4a956', opacity = 1, strokeWidth = 1.5 }) {
  return (
    <svg
      width={size}
      height={size * 1.15}
      viewBox="0 0 80 92"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={opacity}
    >
      {/* Dome */}
      <path d="M14 46 C13 16 22 7 40 7 C58 7 67 16 66 46" />
      {/* Body left & right sides */}
      <line x1="14" y1="46" x2="14" y2="70" />
      <line x1="66" y1="46" x2="66" y2="70" />
      {/* Bottom of body */}
      <path d="M14 70 Q14 75 19 75 L61 75 Q66 75 66 70" />
      {/* Visor top slit */}
      <line x1="14" y1="52" x2="66" y2="52" />
      {/* Visor bottom slit */}
      <line x1="14" y1="59" x2="66" y2="59" />
      {/* Nose bridge (center vertical) */}
      <line x1="40" y1="52" x2="40" y2="59" />
      {/* Lower vent slits */}
      <line x1="19" y1="65" x2="61" y2="65" />
      <line x1="19" y1="70" x2="61" y2="70" />
      {/* Bottom neck brim */}
      <rect x="10" y="74" width="60" height="10" rx="3" />
      {/* Crown plume dot */}
      <circle cx="40" cy="4" r="2" fill={color} stroke="none" opacity={0.6} />
    </svg>
  );
}

export function HelmetFilled({ size = 120, color = '#d4a956', opacity = 1 }) {
  const id = `hm-${Math.random().toString(36).slice(2, 7)}`;
  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 80 92" opacity={opacity}>
      <defs>
        <mask id={id}>
          <rect width="80" height="92" fill="white" />
          {/* Visor cutouts */}
          <rect x="15" y="51" width="50" height="8" rx="1" fill="black" />
          <rect x="37" y="51" width="6" height="8" fill="white" /> {/* nose bridge stays */}
          <rect x="19" y="63" width="42" height="5" rx="1" fill="black" />
          <rect x="19" y="70" width="42" height="5" rx="1" fill="black" />
        </mask>
      </defs>
      {/* Helm dome + body */}
      <path
        d="M14 46 C13 16 22 7 40 7 C58 7 67 16 66 46 L66 70 Q66 75 61 75 L19 75 Q14 75 14 70 Z"
        fill={color}
        mask={`url(#${id})`}
      />
      {/* Neck brim */}
      <rect x="10" y="74" width="60" height="10" rx="3" fill={color} />
      {/* Crown plume */}
      <rect x="38" y="2" width="4" height="7" rx="2" fill={color} opacity="0.7" />
    </svg>
  );
}

export function CrossPattee({ size = 20, color = '#d4a956' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill={color}>
      <path d="M7 0 L7 5 Q7 7 5 7 L0 7 L0 13 L5 13 Q7 13 7 15 L7 20 L13 20 L13 15 Q13 13 15 13 L20 13 L20 7 L15 7 Q13 7 13 5 L13 0 Z" />
    </svg>
  );
}

export function StarOrnament({ size = 12, color = '#4d4568' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill={color}>
      <polygon points="6,0 7.2,4.8 12,6 7.2,7.2 6,12 4.8,7.2 0,6 4.8,4.8" />
    </svg>
  );
}

export function DiamondOrnament({ size = 10, color = '#4d4568' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" fill={color}>
      <polygon points="5,0 10,5 5,10 0,5" />
    </svg>
  );
}

export function SwordIcon({ size = 60, color = '#d4a956', opacity = 1 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={opacity}>
      {/* Blade */}
      <line x1="20" y1="4" x2="20" y2="30" />
      {/* Tip taper */}
      <path d="M18 28 L20 34 L22 28" />
      {/* Guard */}
      <line x1="12" y1="22" x2="28" y2="22" />
      {/* Grip */}
      <rect x="18.5" y="22" width="3" height="8" rx="1" />
      {/* Pommel */}
      <circle cx="20" cy="32" r="2.5" />
    </svg>
  );
}

export function OrnamentalDivider({ color = '#2c2740', accentColor = '#4d4568' }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${color})` }} />
      <DiamondOrnament color={accentColor} size={8} />
      <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${color}, transparent)` }} />
    </div>
  );
}

export function SectionTitle({ children, className = '' }) {
  return (
    <div className={`flex items-center gap-3 mb-3 ${className}`}>
      <div className="flex-1 h-px bg-[#2c2740]" />
      <p className="font-cinzel text-[8px] text-[#4d4568] uppercase tracking-[0.3em] shrink-0">{children}</p>
      <div className="flex-1 h-px bg-[#2c2740]" />
    </div>
  );
}

export function KnightCrestBackground({ opacity = 0.04 }) {
  const id = `crest-${Math.random().toString(36).slice(2, 7)}`;
  return (
    <svg
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        opacity,
        pointerEvents: 'none',
        userSelect: 'none',
      }}
      width="320"
      height="370"
      viewBox="0 0 80 92"
      fill="#d4a956"
    >
      <defs>
        <mask id={id}>
          <rect width="80" height="92" fill="white" />
          <rect x="15" y="51" width="50" height="8" rx="1" fill="black" />
          <rect x="37" y="51" width="6" height="8" fill="white" />
          <rect x="19" y="63" width="42" height="5" rx="1" fill="black" />
          <rect x="19" y="70" width="42" height="5" rx="1" fill="black" />
        </mask>
      </defs>
      <path
        d="M14 46 C13 16 22 7 40 7 C58 7 67 16 66 46 L66 70 Q66 75 61 75 L19 75 Q14 75 14 70 Z"
        fill="#d4a956"
        mask={`url(#${id})`}
      />
      <rect x="10" y="74" width="60" height="10" rx="3" fill="#d4a956" />
      <rect x="38" y="2" width="4" height="7" rx="2" fill="#d4a956" opacity="0.7" />
    </svg>
  );
}
