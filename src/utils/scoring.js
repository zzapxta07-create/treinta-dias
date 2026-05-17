export const SCORE_TABLE = {
  entryOnTime: 15,
  showerComplete: 15,
  minNegocio: 15,
  minSegunda: 10,
  minEstudio: 10,
  minEjercicio: 10,
  allEvidences: 15,
  dayClose: 10,
};

export const PENALTIES = {
  dayLost: 150,
  noHice30min: 8,
  noHice60min: 16,
  projectOverdue: 20,
};

// Total minutes per area from blocks array
export function areaMinutesFromBlocks(blocks) {
  const result = { NEGOCIO: 0, SEGUNDA: 0, ESTUDIO: 0, EJERCICIO: 0, OTROS: 0 };
  for (const b of blocks) {
    const dur = b.endMinutes - b.startMinutes;
    if (result[b.area] !== undefined) result[b.area] += dur;
  }
  return result;
}

// Calculate day score from day record
export function calcDayScore(day) {
  if (!day || day.status === "lost") return 0;
  let score = 0;
  if (day.enteredOnTime) score += SCORE_TABLE.entryOnTime;
  if (day.showerComplete) score += SCORE_TABLE.showerComplete;

  const mins = areaMinutesFromBlocks(day.blocks || []);
  if (mins.NEGOCIO >= 300) score += SCORE_TABLE.minNegocio;
  if (mins.SEGUNDA >= 60) score += SCORE_TABLE.minSegunda;
  if (mins.ESTUDIO >= 180) score += SCORE_TABLE.minEstudio;
  if (mins.EJERCICIO >= 30) score += SCORE_TABLE.minEjercicio;

  if (day.allEvidencesComplete) score += SCORE_TABLE.allEvidences;
  if (day.closeComplete) score += SCORE_TABLE.dayClose;

  const pen = (day.penalties || []).reduce((acc, p) => acc + p.points, 0);
  return Math.max(0, score - pen);
}

// Returns area score 0-100: (days meeting minimum / days elapsed) * 100
export function calcAreaScore(days, area) {
  const MINS = { NEGOCIO: 300, SEGUNDA: 60, ESTUDIO: 180, EJERCICIO: 30 };
  const elapsed = Object.values(days).filter(
    (d) => d.status !== "future" && d.status !== "lost_entry"
  );
  if (elapsed.length === 0) return 0;
  const met = elapsed.filter((d) => {
    const mins = areaMinutesFromBlocks(d.blocks || []);
    return (mins[area] || 0) >= (MINS[area] || 0);
  });
  return Math.round((met.length / elapsed.length) * 100);
}

// Sum all day scores minus global penalties
export function calcTotalScore(days) {
  return Object.values(days).reduce(
    (acc, d) => acc + (d.score || 0) - (d.globalPenalty || 0),
    0
  );
}

// Check for overdue projects and return penalty map { dateKey: points }
export function calcOverduePenalties(projects, today) {
  let total = 0;
  for (const p of projects) {
    if (!p.deadline || p.type === "binary") continue;
    if (p.deadline < today && (p.progress || 0) < 100) {
      total += PENALTIES.projectOverdue;
    }
  }
  return total;
}
