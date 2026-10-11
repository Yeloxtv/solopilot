import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const LOCALES = join(dirname(fileURLToPath(import.meta.url)), '..', 'locales');
const INTL = { en: 'en-US', fr: 'fr-FR' };

// Builds the translation function. It must stay self-contained: build injects its source into
// the dashboard page, so the page and the terminal phrase things the same way.
//   t('key.path', { n: 3, name: 'x' })   {name} placeholders; a string map picks its plural form from n
export function makeT(strings, intl) {
  const plural = new Intl.PluralRules(intl);
  const num = (n, digits = 1) => Number(n).toLocaleString(intl, { maximumFractionDigits: digits });
  const lookup = (key) => key.split('.').reduce((o, k) => (o == null ? o : o[k]), strings);
  const t = (key, vars = {}) => {
    let s = lookup(key);
    if (s == null) return key;
    if (typeof s === 'object') s = s[plural.select(Number(vars.n))] ?? s.other;
    return String(s).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? (typeof vars[k] === 'number' ? num(vars[k]) : String(vars[k])) : m));
  };
  t.num = num;
  // French writes the first of the month as an ordinal: "le 1er décembre".
  t.date = (iso, options) => {
    const s = new Date(`${iso}T12:00:00`).toLocaleDateString(intl, options);
    return /^fr/.test(intl) && options?.day && String(iso).slice(8, 10) === '01' ? s.replace(/(^|\s)1(?=\s)/, '$11er') : s;
  };
  return t;
}

export const availableLocales = () => Object.keys(INTL);

const validTag = (tag) => {
  try { return Intl.getCanonicalLocales(tag).length === 1; } catch { return false; }
};

// A shipped language, alone ("fr") or as a valid tag ("en-GB").
export const isLocale = (locale) => {
  const tag = String(locale);
  return availableLocales().includes(tag.split('-')[0].toLowerCase()) && validTag(tag);
};

// locale: "en", "fr", or a full tag such as "en-GB" to change date formats too. Anything else falls
// back to English.
export function loadLocale(locale = 'en') {
  const tag = isLocale(locale) ? String(locale) : 'en';
  const lang = tag.split('-')[0].toLowerCase();
  const file = join(LOCALES, `${lang}.json`);
  const strings = JSON.parse(readFileSync(existsSync(file) ? file : join(LOCALES, 'en.json'), 'utf8'));
  const intl = tag.includes('-') ? tag : INTL[lang];
  return { lang, intl, strings, t: makeT(strings, intl) };
}
