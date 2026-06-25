import { useStore } from "../../store/useStore";
import { calcAreaScore } from "../../utils/scoring";
import { useAreas } from "../../hooks/useAreas";
import ProgressBar from "./ProgressBar";

export default function ScoreBar() {
  const days  = useStore((s) => s.days);
  const areas = useAreas();

  return (
    <div className="flex flex-col gap-2">
      {areas.filter(a => a.min_minutes > 0).map((area) => {
        const score = calcAreaScore(days, area.id);
        return (
          <ProgressBar
            key={area.id}
            label={area.emoji + ' ' + area.label}
            value={score}
            max={100}
            color={area.color}
          />
        );
      })}
    </div>
  );
}
