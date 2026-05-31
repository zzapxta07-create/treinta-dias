const KEY = 'fb_history';
const MAX = 100;

/**
 * @param {object} entry
 * @param {string} entry.url
 * @param {string} entry.command
 * @param {string} entry.type - 'open' | 'visit'
 * @param {string} entry.essay
 * @param {boolean} entry.isDistractor
 * @param {boolean} entry.completed
 * @param {string} entry.lang
 */
export async function addHistoryEntry(entry) {
  try {
    const data = await chrome.storage.local.get(KEY);
    const history = data[KEY] || [];
    history.unshift({ ...entry, timestamp: Date.now() });
    if (history.length > MAX) history.length = MAX;
    await chrome.storage.local.set({ [KEY]: history });
  } catch {}
}

export async function loadHistory() {
  try {
    const data = await chrome.storage.local.get(KEY);
    return data[KEY] || [];
  } catch {
    return [];
  }
}
