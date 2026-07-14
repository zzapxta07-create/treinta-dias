import { useAreaMap } from '../../hooks/useAreas';

function hexToRgba(hex, alpha) {
  if (!hex || hex[0] !== '#') return `rgba(154,132,112,${alpha})`;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function AreaBadge({ area, label }) {
  const areaMap = useAreaMap();
  const cfg = areaMap[area];
  const color = cfg?.color || '#9a8470';

  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-cinzel tracking-[0.05em]"
      style={{
        backgroundColor: hexToRgba(color, 0.12),
        color,
        border: `1px solid ${hexToRgba(color, 0.25)}`,
      }}
    >
      {label || (cfg ? `${cfg.emoji} ${cfg.label}` : area)}
    </span>
  );
}
