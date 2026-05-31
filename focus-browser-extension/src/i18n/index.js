import { es } from './es.js';
import { en } from './en.js';

const TRANSLATIONS = { es, en };

let _lang = 'es';

export function setLanguage(lang) {
  if (TRANSLATIONS[lang]) {
    _lang = lang;
    try {
      chrome.storage.local.set({ fb_lang: lang });
    } catch {}
  }
}

export function getLanguage() {
  return _lang;
}

export async function initLanguage() {
  try {
    const data = await chrome.storage.local.get('fb_lang');
    if (data.fb_lang && TRANSLATIONS[data.fb_lang]) {
      _lang = data.fb_lang;
    }
  } catch {}
  return _lang;
}

export function t() {
  return TRANSLATIONS[_lang] || TRANSLATIONS.es;
}
