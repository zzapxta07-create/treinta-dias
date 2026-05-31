/**
 * Parses a raw command string into { cmd, args, raw }.
 * Returns null for empty input.
 */
export function parseCommand(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Split respecting quoted strings: save-command name "https://example.com"
  const parts = [];
  let current = '';
  let inQuote = false;

  for (const ch of trimmed) {
    if (ch === '"' || ch === "'") {
      inQuote = !inQuote;
    } else if (ch === ' ' && !inQuote) {
      if (current) { parts.push(current); current = ''; }
    } else {
      current += ch;
    }
  }
  if (current) parts.push(current);

  if (parts.length === 0) return null;

  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);

  return { cmd, args, raw: trimmed };
}
