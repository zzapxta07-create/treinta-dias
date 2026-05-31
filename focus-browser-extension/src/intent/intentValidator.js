const MIN_WORDS = 50;

/**
 * Returns { valid: true } or { valid: false, error: string }
 */
export function validateEssay(text, minWords = MIN_WORDS) {
  const words = tokenize(text);

  if (words.length < minWords) {
    return { valid: false, error: 'tooShort', actual: words.length };
  }

  // Unique word ratio: at least 30% unique
  const normalized = words.map(w => w.toLowerCase().replace(/[^a-záéíóúñüa-z0-9]/gi, ''));
  const unique = new Set(normalized.filter(w => w.length > 0));
  if (unique.size < words.length * 0.3) {
    return { valid: false, error: 'tooRepetitive' };
  }

  // Sentence count: at least 3 sentences longer than 10 chars
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  if (sentences.length < 3) {
    return { valid: false, error: 'notEnoughSentences' };
  }

  // Average word length: should be >= 3 chars (catches "a a a a a..." patterns)
  const avgLen = words.reduce((sum, w) => sum + w.length, 0) / words.length;
  if (avgLen < 3) {
    return { valid: false, error: 'wordsTooShort' };
  }

  // Alpha character ratio: text should be mostly letters/spaces
  const noSpaces = text.replace(/\s/g, '');
  const alphaCount = (text.match(/[a-záéíóúñüa-z]/gi) || []).length;
  if (noSpaces.length > 0 && alphaCount / noSpaces.length < 0.6) {
    return { valid: false, error: 'randomChars' };
  }

  // Max single-word frequency: no word should appear > 20% of the time
  const freq = {};
  normalized.forEach(w => { if (w) freq[w] = (freq[w] || 0) + 1; });
  const maxFreq = Math.max(...Object.values(freq));
  if (words.length > 15 && maxFreq / words.length > 0.2) {
    return { valid: false, error: 'tooManyRepeated' };
  }

  // Detect keyboard spam: consecutive repeated chars (e.g. "aaaaaa", "asdfasdf")
  if (hasKeyboardSpam(text)) {
    return { valid: false, error: 'randomChars' };
  }

  return { valid: true };
}

function tokenize(text) {
  return text.trim().split(/\s+/).filter(w => w.length > 1);
}

function hasKeyboardSpam(text) {
  // More than 5 consecutive identical characters
  if (/(.)\1{5,}/.test(text)) return true;
  // More than 30% of chars are non-alpha and non-space
  const nonAlpha = (text.match(/[^a-záéíóúñüa-z0-9\s.,;:!?'"()-]/gi) || []).length;
  if (text.length > 20 && nonAlpha / text.length > 0.3) return true;
  return false;
}

export function countWords(text) {
  return tokenize(text).length;
}
