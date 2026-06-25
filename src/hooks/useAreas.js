import { useStore } from '../store/useStore';
import { DEFAULT_AREAS } from '../data/areas';

export function useAreas() {
  return useStore(s => s.areas) || DEFAULT_AREAS;
}

export function useAreaMap() {
  const areas = useAreas();
  return Object.fromEntries(areas.map(a => [a.id, a]));
}
