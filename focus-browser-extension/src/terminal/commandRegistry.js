export const DEFAULT_COMMANDS = {
  google:       'https://google.com',
  youtube:      'https://youtube.com',
  github:       'https://github.com',
  chatgpt:      'https://chatgpt.com',
  docs:         'https://docs.google.com',
  notion:       'https://notion.so',
  calendar:     'https://calendar.google.com',
  gmail:        'https://mail.google.com',
  'logic-life': 'https://treinta-dias.vercel.app/',
};

// Commands that bypass the intention gate and loading screen entirely
export const NO_FRICTION_COMMANDS = new Set(['logic-life']);

export const DEFAULT_DISTRACTORS = [
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
  'limit', 'remove-limit', 'limits',
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
