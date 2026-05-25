const COLORS = {
  NEGOCIO:   { bg: 'rgba(59,130,246,0.15)',  text: '#3B82F6' },
  SEGUNDA:   { bg: 'rgba(168,85,247,0.15)',  text: '#A855F7' },
  ESTUDIO:   { bg: 'rgba(245,158,11,0.15)',  text: '#F59E0B' },
  EJERCICIO: { bg: 'rgba(16,185,129,0.15)',  text: '#10B981' },
  OTROS:     { bg: 'rgba(107,114,128,0.15)', text: '#6B7280' },
};

const LABELS = {
  NEGOCIO: 'Negocio', SEGUNDA: 'Segunda', ESTUDIO: 'Estudio',
  EJERCICIO: 'Ejercicio', OTROS: 'Otros',
};

export default function AreaBadge({ area, label }) {
  const cfg = COLORS[area] || COLORS.OTROS;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium"
      style={{ backgroundColor: cfg.bg, color: cfg.text }}
    >
      {label || LABELS[area] || area}
    </span>
  );
}

export function areaColor(area) {
  return COLORS[area]?.text || '#6B7280';
}
