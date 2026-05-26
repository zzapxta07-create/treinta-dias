const COLORS = {
  NEGOCIO:   { bg: 'rgba(59,130,246,0.12)',  text: '#3B82F6',  border: 'rgba(59,130,246,0.25)'  },
  SEGUNDA:   { bg: 'rgba(168,85,247,0.12)',  text: '#A855F7',  border: 'rgba(168,85,247,0.25)'  },
  ESTUDIO:   { bg: 'rgba(245,158,11,0.12)',  text: '#F59E0B',  border: 'rgba(245,158,11,0.25)'  },
  EJERCICIO: { bg: 'rgba(16,185,129,0.12)',  text: '#10B981',  border: 'rgba(16,185,129,0.25)'  },
  OTROS:     { bg: 'rgba(107,114,128,0.10)', text: '#9a8470',  border: 'rgba(107,114,128,0.2)'  },
};

const LABELS = {
  NEGOCIO: 'Negocio', SEGUNDA: 'Segunda', ESTUDIO: 'Estudio',
  EJERCICIO: 'Ejercicio', OTROS: 'Otros',
};

export default function AreaBadge({ area, label }) {
  const cfg = COLORS[area] || COLORS.OTROS;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-cinzel tracking-[0.05em]"
      style={{ backgroundColor: cfg.bg, color: cfg.text, border: `1px solid ${cfg.border}` }}
    >
      {label || LABELS[area] || area}
    </span>
  );
}

export function areaColor(area) {
  return COLORS[area]?.text || '#9a8470';
}
