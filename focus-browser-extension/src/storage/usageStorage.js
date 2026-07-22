const LIMITS_KEY = 'fb_limits'; // { [domain]: minutesPerDay }
const USAGE_KEY  = 'fb_usage';  // { [dateKey]: { [domain]: minutesUsed } }
const KEEP_DAYS  = 14;

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export function normalizeDomain(input) {
  if (!input) return '';
  let s = input.trim().toLowerCase();
  if (s.includes('://')) {
    try { s = new URL(s).hostname; } catch { /* fall through */ }
  } else {
    s = s.split('/')[0];
  }
  return s.replace(/^www\./, '');
}

// ── Limits ───────────────────────────────────────────────────────────────────

export async function loadLimits() {
  try {
    const data = await chrome.storage.local.get(LIMITS_KEY);
    return data[LIMITS_KEY] || {};
  } catch {
    return {};
  }
}

export async function setLimit(domain, minutes) {
  const d = normalizeDomain(domain);
  const limits = await loadLimits();
  limits[d] = minutes;
  await chrome.storage.local.set({ [LIMITS_KEY]: limits });
  return d;
}

export async function removeLimit(domain) {
  const d = normalizeDomain(domain);
  const limits = await loadLimits();
  delete limits[d];
  await chrome.storage.local.set({ [LIMITS_KEY]: limits });
  return d;
}

// Matches a host against configured limits — exact domain or subdomain.
export function matchLimit(host, limits) {
  for (const domain of Object.keys(limits)) {
    if (host === domain || host.endsWith('.' + domain)) return domain;
  }
  return null;
}

// ── Usage ────────────────────────────────────────────────────────────────────

export async function loadUsage() {
  try {
    const data = await chrome.storage.local.get(USAGE_KEY);
    return data[USAGE_KEY] || {};
  } catch {
    return {};
  }
}

export async function loadTodayUsage() {
  const usage = await loadUsage();
  return usage[todayKey()] || {};
}

// Adds `minutesToAdd` to today's usage for `domain`, prunes old days, returns the new total.
export async function incrementUsage(domain, minutesToAdd = 1) {
  const usage = await loadUsage();
  const today = todayKey();

  const dates = Object.keys(usage).sort();
  if (dates.length > KEEP_DAYS) {
    for (const old of dates.slice(0, dates.length - KEEP_DAYS)) delete usage[old];
  }

  usage[today] = usage[today] || {};
  usage[today][domain] = (usage[today][domain] || 0) + minutesToAdd;
  await chrome.storage.local.set({ [USAGE_KEY]: usage });
  return usage[today][domain];
}
