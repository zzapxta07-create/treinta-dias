const MIN_CHARS = 120; // ≈ 20 palabras

/**
 * Returns { valid: true } or { valid: false, error: string, actual?: number }
 */
export function validateEssay(text, minChars = MIN_CHARS) {
  const chars = text.trim().length;

  if (chars < minChars) {
    return { valid: false, error: 'tooShort', actual: chars };
  }

  // Alpha character ratio: text should be mostly letters/spaces
  const noSpaces = text.replace(/\s/g, '');
  const alphaCount = (text.match(/[a-záéíóúñüa-z]/gi) || []).length;
  if (noSpaces.length > 0 && alphaCount / noSpaces.length < 0.6) {
    return { valid: false, error: 'randomChars' };
  }

  // Unique word ratio: at least 30% unique words
  const words = tokenize(text);
  if (words.length > 5) {
    const normalized = words.map(w => w.toLowerCase().replace(/[^a-záéíóúñüa-z0-9]/gi, ''));
    const unique = new Set(normalized.filter(w => w.length > 0));
    if (unique.size < words.length * 0.3) {
      return { valid: false, error: 'tooRepetitive' };
    }
  }

  // Detect keyboard spam
  if (hasKeyboardSpam(text)) {
    return { valid: false, error: 'randomChars' };
  }

  return { valid: true };
}

function tokenize(text) {
  return text.trim().split(/\s+/).filter(w => w.length > 1);
}

function hasKeyboardSpam(text) {
  if (/(.)\1{5,}/.test(text)) return true;
  const nonAlpha = (text.match(/[^a-záéíóúñüa-z0-9\s.,;:!?'"()-]/gi) || []).length;
  if (text.length > 20 && nonAlpha / text.length > 0.3) return true;
  return false;
}

export function countChars(text) {
  return text.trim().length;
}
