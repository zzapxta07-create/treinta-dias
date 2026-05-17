import { useStore } from "../store/useStore";
import { useCurrentTime } from "./useCurrentTime";

export function useActiveBlock() {
  const blocks = useStore((s) => s.currentDay.blocks);
  const now = useCurrentTime();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const active = blocks.find(
    (b) => b.startMinutes <= currentMinutes && currentMinutes < b.endMinutes
  );
  return active || null;
}
