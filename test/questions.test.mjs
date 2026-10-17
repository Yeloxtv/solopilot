import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validate } from '../src/backlog.mjs';
import { compute } from '../src/compute.mjs';
import { loadLocale } from '../src/i18n.mjs';
import { digestMessage, statusText } from '../src/report.mjs';
import { fixture } from './fixture.mjs';

// Wednesday 2026-01-07. Q01 (before day 2) was asked on Monday 2025-12-29; Q02 (before day 3) never.
const TODAY = '2026-01-07';
function asked(extra = {}) {
  const b = fixture();
  Object.assign(b.questions[0], { asked_on: '2025-12-29', ...extra });
  return b;
}
const item = (c, id) => c.watch.find((x) => x.id === id);

test('an asked question waits in working days, and is to chase after five', () => {
  const c = compute(asked(), { today: TODAY });
  assert.deepEqual([item(c, 'Q01').asked, item(c, 'Q01').waiting, item(c, 'Q01').chase], [true, 7, true]);
  assert.deepEqual(c.chase.map((x) => x.id), ['Q01']);
});

test('a reminder puts the chase off, and chase_after sets the delay', () => {
  assert.equal(item(compute(asked({ reminded_on: '2026-01-05' }), { today: TODAY }), 'Q01').chase, false);
  const patient = asked();
  patient.project.chase_after = 10;
  assert.equal(item(compute(patient, { today: TODAY }), 'Q01').chase, false);
});

test('an answer needed within two weeks that was never asked stands out', () => {
  const c = compute(asked(), { today: TODAY });
  assert.deepEqual([item(c, 'Q02').asked, item(c, 'Q02').unasked], [false, true]);
  assert.deepEqual(c.unasked.map((x) => x.id), ['Q02']);
  const later = asked();
  later.questions[1].before = undefined;
  assert.deepEqual(compute(later, { today: TODAY }).unasked, [], 'no day set: nothing is due yet');
});

test("the owner's own questions are asked of nobody: never to chase, never unasked", () => {
  const b = asked();
  b.project.owner = 'Alex';
  b.questions[1].who = 'Alex';
  const c = compute(b, { today: TODAY });
  assert.deepEqual([item(c, 'Q02').asks, item(c, 'Q02').unasked], [false, false]);
  assert.deepEqual(c.unasked, []);
  const text = statusText(b, c, loadLocale('en').t);
  assert.match(text, /Q02 .*\(Alex\)\n/, 'no "not asked yet" on its line');
  assert.doesNotMatch(text, /never asked/);
});

test('the dates are checked: a reminder comes after the question', () => {
  assert.deepEqual(validate(asked({ reminded_on: '2026-01-05' })).errors, []);
  const e = validate(asked({ asked_on: 'monday', reminded_on: '2025-12-01' })).errors.join('\n');
  assert.match(e, /Q01: asked_on/);
  assert.match(e, /Q01: reminded_on/);
  assert.match(validate(fixture({ project: { chase_after: 0 } })).errors.join('\n'), /project\.chase_after/);
});

test('status and the digest say who to chase and what was never asked', () => {
  const b = asked();
  const c = compute(b, { today: TODAY });
  const { t } = loadLocale('en');
  const text = statusText(b, c, t);
  assert.match(text, /Q01 .*\(Acme\) · asked December 29, 2025, 7 d ago/);
  assert.match(text, /\nTo chase\n {2}Acme: Q01\n/);
  assert.match(text, /\nNeeded within two weeks, never asked\n {2}Acme: Q02/);
  const digest = JSON.stringify(digestMessage(b, c, t));
  assert.match(digest, /\*To chase \(1\)\*\\n• Acme: Q01/);
  assert.match(digest, /\*Never asked \(1\)\*: needed within two weeks\\n• Acme: Q02/);
  const fr = statusText(b, c, loadLocale('fr').t);
  assert.match(fr, /posée le 29 décembre 2025, il y a 7 j/);
  assert.match(fr, /\nÀ relancer\n {2}Acme : Q01/);
});
