export const SCORE_TABLE = {
  entryOnTime:    15,
  ritualComplete: 15,
  minNegocio:     15,
  minSegunda:     10,
  minEstudio:     10,
  minEjercicio:   10,
  allEvidences:   15,
  dayClose:       10,
};

// Only counts work blocks (not OTROS) that have evidence submitted
export function areaMinutesFromBlocks(blocks, evidences = []) {
  const result = { NEGOCIO: 0, SEGUNDA: 0, ESTUDIO: 0, EJERCICIO: 0, OTROS: 0 };
  const evidencedIds = new Set((evidences || []).filter(e => !e.no_hice).map(e => e.block_id));
  for (const b of blocks) {
    const key = b.area_id || b.area;
    const dur = (b.end_minutes ?? b.endMinutes) - (b.start_minutes ?? b.startMinutes);
    if (key === 'OTROS') {
      result.OTROS = (result.OTROS || 0) + dur;
      continue;
    }
    if (!evidencedIds.has(b.id)) continue;
    if (result[key] !== undefined) result[key] += dur;
  }
  return result;
}

const DEFAULT_MIN_MINUTES = { NEGOCIO: 300, SEGUNDA: 60, ESTUDIO: 180, EJERCICIO: 30 };

function partialCredit(mins, min, points) {
  if (!min || min <= 0) return 0;
  return Math.round(points * Math.min(1, mins / min));
}

// areaMap: optional { id: { min_minutes } } from useAreaMap() — respects the
// user's customized minimums (Config screen) instead of the hardcoded defaults.
export function calcDayScore(day, areaMap) {
  if (!day || day.status === 'lost') return 0;
  let score = 0;

  if (day.entered_on_time ?? day.enteredOnTime)  score += SCORE_TABLE.entryOnTime;
  if (day.ritual_complete ?? day.showerComplete)  score += SCORE_TABLE.ritualComplete;

  const minMinutes = {
    NEGOCIO:   areaMap?.NEGOCIO?.min_minutes   ?? DEFAULT_MIN_MINUTES.NEGOCIO,
    SEGUNDA:   areaMap?.SEGUNDA?.min_minutes   ?? DEFAULT_MIN_MINUTES.SEGUNDA,
    ESTUDIO:   areaMap?.ESTUDIO?.min_minutes   ?? DEFAULT_MIN_MINUTES.ESTUDIO,
    EJERCICIO: areaMap?.EJERCICIO?.min_minutes ?? DEFAULT_MIN_MINUTES.EJERCICIO,
  };

  const evidences = day.evidences || [];
  const mins = areaMinutesFromBlocks(day.blocks || [], evidences);
  // Proportional credit — each evidenced minute counts immediately instead of
  // an all-or-nothing jump only once the full daily minimum is reached.
  score += partialCredit(mins.NEGOCIO,   minMinutes.NEGOCIO,   SCORE_TABLE.minNegocio);
  score += partialCredit(mins.SEGUNDA,   minMinutes.SEGUNDA,   SCORE_TABLE.minSegunda);
  score += partialCredit(mins.ESTUDIO,   minMinutes.ESTUDIO,   SCORE_TABLE.minEstudio);
  score += partialCredit(mins.EJERCICIO, minMinutes.EJERCICIO, SCORE_TABLE.minEjercicio);

  if (day.all_evidences_complete ?? day.allEvidencesComplete) score += SCORE_TABLE.allEvidences;
  if (day.close_complete         ?? day.closeComplete)        score += SCORE_TABLE.dayClose;

  return Math.max(0, score);
}

export function calcTotalScore(days) {
  return Object.values(days).reduce(
    (acc, d) => acc + (d.score || 0) - (d.global_penalty || d.globalPenalty || 0),
    0
  );
}
