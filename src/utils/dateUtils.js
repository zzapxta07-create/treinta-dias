// ─── FIXED: always use local date components, NEVER toISOString() ──────────
// toISOString() returns UTC — in UTC-5 between 19:00-23:59 it gives tomorrow's date.

export function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// App "day" starts at 7:00am local time. Before 7am → previous day.
export function appDayKey() {
  const now = new Date();
  if (now.getHours() < 7) {
    const y = now.getDate() === 1
      ? new Date(now.getFullYear(), now.getMonth(), 0) // last day of prev month
      : new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    return `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
  }
  return todayKey();
}

// True if current local time is at or after 8:00am
export function isLate() {
  return new Date().getHours() >= 8;
}

// "HH:MM" from Date
export function formatTime(d) {
  const date = d instanceof Date ? d : new Date(d);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// "HH:MM" → minutes since midnight
export function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

// minutes since midnight → "HH:MM"
export function minutesToTime(mins) {
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
}

// Duration label: "1h 30min"
export function minutesToLabel(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

// Remaining seconds until timestamp
export function secondsUntil(ts) {
  return Math.max(0, Math.floor((ts - Date.now()) / 1000));
}

// Format seconds as "MM:SS"
export function formatCountdown(seconds) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

// dateKey + N calendar days → "YYYY-MM-DD" (safe: uses T12:00:00 to avoid DST issues)
export function addDays(dateKey, n) {
  const d = new Date(dateKey + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
