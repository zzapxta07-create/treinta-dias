const KEY = 'fb_stats';

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function weekKey() {
  const d = new Date();
  const monday = new Date(d);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  monday.setDate(d.getDate() + diff);
  return `${monday.getFullYear()}-W${String(monday.getDate()).padStart(2,'0')}`;
}

const DEFAULT_STATS = () => ({
  totalOpens: 0,
  dailyOpens: {},
  weeklyOpens: {},
  siteFrequency: {},
  distractorOpens: 0,
  intentionsWritten: 0,
  cancelledFlows: 0,
  visitCount: 0,
  openCount: 0,
});

export async function loadStats() {
  try {
    const data = await chrome.storage.local.get(KEY);
    return data[KEY] || DEFAULT_STATS();
  } catch {
    return DEFAULT_STATS();
  }
}

export async function recordOpen({ url, type, isDistractor }) {
  try {
    const stats = await loadStats();
    const today = todayKey();
    const week = weekKey();

    stats.totalOpens = (stats.totalOpens || 0) + 1;
    stats.dailyOpens[today] = (stats.dailyOpens[today] || 0) + 1;
    stats.weeklyOpens[week] = (stats.weeklyOpens[week] || 0) + 1;

    try {
      const host = new URL(url).hostname.replace(/^www\./, '');
      stats.siteFrequency[host] = (stats.siteFrequency[host] || 0) + 1;
    } catch {}

    if (isDistractor) stats.distractorOpens = (stats.distractorOpens || 0) + 1;
    stats.intentionsWritten = (stats.intentionsWritten || 0) + 1;

    if (type === 'visit') stats.visitCount = (stats.visitCount || 0) + 1;
    else stats.openCount = (stats.openCount || 0) + 1;

    await chrome.storage.local.set({ [KEY]: stats });
  } catch {}
}

export async function recordCancelled() {
  try {
    const stats = await loadStats();
    stats.cancelledFlows = (stats.cancelledFlows || 0) + 1;
    await chrome.storage.local.set({ [KEY]: stats });
  } catch {}
}
