export const DEFAULT_AREAS = [
  { id: 'NEGOCIO',   label: 'Negocio Principal',  color: '#3B82F6', emoji: '🏛', min_minutes: 300 },
  { id: 'SEGUNDA',   label: 'Segunda Empresa',     color: '#A855F7', emoji: '⚔',  min_minutes: 60  },
  { id: 'ESTUDIO',   label: 'Estudio Individual',  color: '#F59E0B', emoji: '📖', min_minutes: 180 },
  { id: 'EJERCICIO', label: 'Ejercicio',            color: '#10B981', emoji: '🛡', min_minutes: 30  },
  { id: 'OTROS',     label: 'Otros',               color: '#6B7280', emoji: '◆',  min_minutes: 0   },
];

// Backward compat — components that haven't migrated to useAreaMap yet
export const AREAS = Object.fromEntries(
  DEFAULT_AREAS.map(a => [a.id, { ...a, minMinutes: a.min_minutes }])
);

export const MANDATORY_AREAS = DEFAULT_AREAS
  .filter(a => a.min_minutes > 0)
  .map(a => a.id);
