export const DEFAULT_COMMANDS = {
  google:   'https://google.com',
  youtube:  'https://youtube.com',
  github:   'https://github.com',
  chatgpt:  'https://chatgpt.com',
  docs:     'https://docs.google.com',
  notion:   'https://notion.so',
  calendar: 'https://calendar.google.com',
  gmail:    'https://mail.google.com',
};

export const DEFAULT_DISTRACTORS = [
  'youtube.com',
  'reddit.com',
  'twitter.com',
  'x.com',
  'instagram.com',
  'tiktok.com',
  'facebook.com',
  'netflix.com',
];

export const BUILTIN_COMMANDS = new Set([
  'help', 'manual', 'clear', 'open', 'visit',
  'save-command', 'remove-command', 'commands',
  'history', 'stats', 'focus', 'stop-focus', 'lang',
]);

export function isDistractorUrl(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return DEFAULT_DISTRACTORS.some(d => host === d || host.endsWith('.' + d));
  } catch {
    return false;
  }
}

export function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}
