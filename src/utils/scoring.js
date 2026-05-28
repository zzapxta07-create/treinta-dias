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

export function calcDayScore(day) {
  if (!day || day.status === 'lost') return 0;
  let score = 0;

  if (day.entered_on_time ?? day.enteredOnTime)  score += SCORE_TABLE.entryOnTime;
  if (day.ritual_complete ?? day.showerComplete)  score += SCORE_TABLE.ritualComplete;

  const evidences = day.evidences || [];
  const mins = areaMinutesFromBlocks(day.blocks || [], evidences);
  if (mins.NEGOCIO   >= 300) score += SCORE_TABLE.minNegocio;
  if (mins.SEGUNDA   >=  60) score += SCORE_TABLE.minSegunda;
  if (mins.ESTUDIO   >= 180) score += SCORE_TABLE.minEstudio;
  if (mins.EJERCICIO >=  30) score += SCORE_TABLE.minEjercicio;

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
