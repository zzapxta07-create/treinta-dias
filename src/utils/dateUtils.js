export function todayKey() {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

// App "day" starts at 7am. Before 7am it's still the previous app-day.
export function appDayKey() {
  const now = new Date();
  if (now.getHours() < 7) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split("T")[0];
  }
  return todayKey();
}

// True if current time is after 8:00am
export function isLate() {
  const now = new Date();
  return now.getHours() >= 8;
}

// "HH:MM" string from Date or timestamp
export function formatTime(dateOrTs) {
  const d = dateOrTs instanceof Date ? dateOrTs : new Date(dateOrTs);
  return d.toTimeString().slice(0, 5);
}

// "HH:MM" → minutes since midnight
export function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

// minutes since midnight → "HH:MM"
export function minutesToTime(mins) {
  const h = Math.floor(mins / 60).toString().padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

// Duration label: "1h 30min"
export function minutesToLabel(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

// Returns remaining seconds until timestamp
export function secondsUntil(timestamp) {
  return Math.max(0, Math.floor((timestamp - Date.now()) / 1000));
}

// Format seconds as "MM:SS"
export function formatCountdown(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// Adds dateKey + N calendar days → "YYYY-MM-DD"
export function addDays(dateKey, n) {
  const d = new Date(dateKey + "T12:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}
