import { useStore } from "../../store/useStore";
import { calcAreaScore } from "../../utils/scoring";
import { AREAS, MANDATORY_AREAS } from "../../data/areas";
import ProgressBar from "./ProgressBar";

export default function ScoreBar() {
  const days = useStore((s) => s.days);
  return (
    <div className="flex flex-col gap-2">
      {MANDATORY_AREAS.map((areaId) => {
        const area = AREAS[areaId];
        const score = calcAreaScore(days, areaId);
        return (
          <ProgressBar
            key={areaId}
            label={area.label}
            value={score}
            max={100}
            color={area.color}
          />
        );
      })}
    </div>
  );
}
