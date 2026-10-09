import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadLocale } from '../src/i18n.mjs';

test('plurals follow each language', () => {
  const en = loadLocale('en').t;
  const fr = loadLocale('fr').t;
  assert.equal(en('units.workingDays', { n: 1 }), '1 working day');
  assert.equal(en('units.workingDays', { n: 0 }), '0 working days');
  assert.equal(fr('units.workingDays', { n: 0 }), '0 jour ouvré');
  assert.equal(fr('units.workingDays', { n: 3 }), '3 jours ouvrés');
});

test('numbers use the locale', () => {
  assert.equal(loadLocale('fr').t('units.days', { n: 2.5 }), '2,5 j');
  assert.equal(loadLocale('en').t('units.days', { n: 2.5 }), '2.5 d');
});

test('unknown keys and variables stay visible', () => {
  const { t } = loadLocale('en');
  assert.equal(t('no.such.key'), 'no.such.key');
  assert.equal(t('day', {}), 'D{n}');
});

test('unknown languages fall back to English, tags keep their date format', () => {
  assert.equal(loadLocale('xx').lang, 'en');
  const gb = loadLocale('en-GB');
  assert.equal(gb.lang, 'en');
  assert.equal(gb.intl, 'en-GB');
});

test('every locale has the same keys as English', () => {
  const keys = (o, p = '') => Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' && !('other' in v) ? keys(v, `${p}${k}.`) : [`${p}${k}`]));
  const read = (lang) => JSON.parse(readFileSync(new URL(`../locales/${lang}.json`, import.meta.url), 'utf8'));
  const en = keys(read('en')).sort();
  assert.deepEqual(keys(read('fr')).sort(), en);
});
