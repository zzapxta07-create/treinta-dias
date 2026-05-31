const KEY = 'fb_commands';

export async function loadCustomCommands() {
  try {
    const data = await chrome.storage.local.get(KEY);
    return data[KEY] || {};
  } catch {
    return {};
  }
}

export async function saveCommand(name, url) {
  const existing = await loadCustomCommands();
  await chrome.storage.local.set({ [KEY]: { ...existing, [name]: url } });
}

export async function removeCommand(name) {
  const existing = await loadCustomCommands();
  const updated = { ...existing };
  delete updated[name];
  await chrome.storage.local.set({ [KEY]: updated });
}

export async function countCustomCommands() {
  const cmds = await loadCustomCommands();
  return Object.keys(cmds).length;
}
