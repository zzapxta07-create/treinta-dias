export const SCORE_TABLE = {
  entryOnTime:   15,
  ritualComplete: 15,
  minNegocio:    15,
  minSegunda:    10,
  minEstudio:    10,
  minEjercicio:  10,
  allEvidences:  15,
  dayClose:      10,
};

// Supports both API shape (area_id, start_minutes) and legacy shape (area, startMinutes)
export function areaMinutesFromBlocks(blocks) {
  const result = { NEGOCIO: 0, SEGUNDA: 0, ESTUDIO: 0, EJERCICIO: 0, OTROS: 0 };
  for (const b of blocks) {
    const key = b.area_id || b.area;
    const dur = (b.end_minutes ?? b.endMinutes) - (b.start_minutes ?? b.startMinutes);
    if (result[key] !== undefined) result[key] += dur;
  }
  return result;
}

// Supports both API shape (snake_case) and legacy shape (camelCase)
export function calcDayScore(day) {
  if (!day || day.status === 'lost') return 0;
  let score = 0;

  if (day.entered_on_time  ?? day.enteredOnTime)       score += SCORE_TABLE.entryOnTime;
  if (day.ritual_complete  ?? day.showerComplete)       score += SCORE_TABLE.ritualComplete;

  const mins = areaMinutesFromBlocks(day.blocks || []);
  if (mins.NEGOCIO   >= 300) score += SCORE_TABLE.minNegocio;
  if (mins.SEGUNDA   >=  60) score += SCORE_TABLE.minSegunda;
  if (mins.ESTUDIO   >= 180) score += SCORE_TABLE.minEstudio;
  if (mins.EJERCICIO >=  30) score += SCORE_TABLE.minEjercicio;

  if (day.all_evidences_complete ?? day.allEvidencesComplete) score += SCORE_TABLE.allEvidences;
  if (day.close_complete         ?? day.closeComplete)         score += SCORE_TABLE.dayClose;

  const pen = (day.penalties || []).reduce((acc, p) => acc + (p.points || 0), 0);
  return Math.max(0, score - pen);
}

export function calcTotalScore(days) {
  return Object.values(days).reduce(
    (acc, d) => acc + (d.score || 0) - (d.global_penalty || d.globalPenalty || 0),
    0
  );
}
