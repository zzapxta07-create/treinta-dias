export const LOADING_PHRASES = {
  es: [
    'Respira antes de consumir.',
    'Tu atención es un recurso limitado.',
    'No entres por ansiedad; entra por decisión.',
    'Una acción consciente vale más que diez impulsos.',
    'La web debe servir a tu propósito, no reemplazarlo.',
    'Recuerda qué viniste a hacer.',
    'Elige antes de abrir.',
    'No estás bloqueado; estás entrenando tu voluntad.',
    'La fricción protege tu enfoque.',
    'Abre solo lo que puedas justificar.',
  ],
  en: [
    'Breathe before you consume.',
    'Your attention is a limited resource.',
    'Don\'t enter from anxiety; enter by decision.',
    'One conscious action is worth ten impulses.',
    'The web should serve your purpose, not replace it.',
    'Remember what you came here to do.',
    'Choose before you open.',
    'You\'re not blocked; you\'re training your will.',
    'Friction protects your focus.',
    'Only open what you can justify.',
  ],
};

/**
 * Returns `count` non-repeating random phrases for the given language.
 */
export function getRandomPhrases(lang = 'es', count = 2) {
  const pool = [...(LOADING_PHRASES[lang] || LOADING_PHRASES.es)];
  const result = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(idx, 1)[0]);
  }
  return result;
}
