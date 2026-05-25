import { useStore } from '../store/useStore';
import { useCurrentTime } from './useCurrentTime';

export function useActiveBlock() {
  const blocks       = useStore((s) => s.currentDay?.blocks || []);
  const now          = useCurrentTime();
  const currentMins  = now.getHours() * 60 + now.getMinutes();

  return blocks.find((b) => {
    const start = b.start_minutes ?? b.startMinutes;
    const end   = b.end_minutes   ?? b.endMinutes;
    return start <= currentMins && currentMins < end;
  }) || null;
}
