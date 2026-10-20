import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scopeGrowth } from '../src/growth.mjs';
import { loadLocale } from '../src/i18n.mjs';
import { growthView } from '../src/report.mjs';
import { fixture } from './fixture.mjs';

// The fixture with points on each task, as agreed by the client on March 2.
function agreedPlan() {
  const b = fixture();
  for (const [id, points] of [['T001', 2], ['T002', 1], ['T003', 1], ['T004', 2]]) b.tasks.find((t) => t.id === id).points = points;
  return b;
}
const agreedOn = (backlog) => ({ basis: 'agreed', date: '2026-03-02', by: 'Ms Smith', backlog });

// Since then: a request accepted with its task, a task added without one, a re-estimate, a deferral.
function grownPlan() {
  const b = agreedPlan();
  b.requests.push({ id: 'R02', status: 'accepted', title: 'CSV export', who: 'Acme', tasks: ['T005'] });
  b.tasks.push({ id: 'T005', day: 3, area: 'core', status: 'todo', points: 1.5, title: 'CSV export' });
  b.tasks.push({ id: 'T006', day: 3, area: 'core', status: 'todo', points: 1, title: 'Import error log' });
  b.tasks.find((t) => t.id === 'T003').points = 2;
  Object.assign(b.tasks.find((t) => t.id === 'T004'), { status: 'deferred', note: 'After the launch' });
  return b;
}

test('each movement since the agreement is told apart, and the balance deducts what was removed', () => {
  const g = scopeGrowth(agreedOn(agreedPlan()), grownPlan());
  assert.deepEqual(
    { reference: g.reference, current: g.current, net: g.net, requests: g.requests, requestIds: g.requestIds, unrequested: g.unrequested, reestimated: g.reestimated, removed: g.removed, level: g.level },
    { reference: 6, current: 7.5, net: 1.5, requests: 1.5, requestIds: ['R02'], unrequested: 1, reestimated: 1, removed: 2, level: 'medium' },
  );
});

test('the risk is medium beyond +10% and high beyond +25%; nothing below', () => {
  const ref = agreedOn(agreedPlan());
  const plan = (extra) => {
    const b = agreedPlan();
    b.tasks.push({ id: 'T009', day: 3, area: 'core', status: 'todo', points: extra, title: 'More' });
    return b;
  };
  assert.equal(scopeGrowth(ref, plan(0.5)).level, null);
  assert.equal(scopeGrowth(ref, plan(1)).level, 'medium');
  assert.equal(scopeGrowth(ref, plan(2)).level, 'high');
});

test('a plan estimated by days weighs each task as a share of its day', () => {
  const b = fixture();
  b.tasks.push({ id: 'T005', day: 3, area: 'core', status: 'todo', title: 'Fifth' });
  const g = scopeGrowth(agreedOn(fixture()), b);
  // Day 3 still weighs 4 points, now shared by two tasks: nothing grew, the share moved.
  assert.deepEqual([g.net, g.unrequested, g.reestimated], [0, 2, -2]);
});

test('without the tagged plan, only the net change against the recorded total is known', () => {
  const g = scopeGrowth({ basis: 'baseline', date: '2026-01-05', backlog: null, points: 10 }, fixture());
  assert.deepEqual([g.detailed, g.reference, g.current, g.net, g.level], [false, 10, 12, 2, 'medium']);
  assert.equal(scopeGrowth({ basis: 'baseline', date: '2026-01-05', backlog: null }, fixture()), null);
  assert.equal(scopeGrowth(null, fixture()), null);
});

test('the movement reads in one line, in English and in French', () => {
  const g = scopeGrowth(agreedOn(agreedPlan()), grownPlan());
  const en = growthView(g, loadLocale('en').t);
  assert.equal(en.line, "Scope since the client's approval (March 2): +1.5 points (+25%).");
  assert.equal(en.details, '+1.5 from request R02, +1 added without a request, +1 re-estimated, −2 removed.');
  const fr = growthView(g, loadLocale('fr').t);
  assert.equal(fr.line, "Périmètre depuis l'accord du client (2 mars) : +1,5 point (+25 %).");
  assert.equal(fr.details, '+1,5 par la demande R02, +1 ajouté sans demande, +1 par réestimation, −2 retirés.');
  assert.equal(growthView(scopeGrowth(agreedOn(agreedPlan()), agreedPlan()), loadLocale('en').t).line, "Scope since the client's approval (March 2): unchanged.");
});

test('the risk says how much the scope grew without a second sign: "grew by 25%", not "grew by +25%"', () => {
  const g = scopeGrowth(agreedOn(agreedPlan()), grownPlan());
  const en = loadLocale('en').t;
  const fr = loadLocale('fr').t;
  assert.equal(en('risks.growth', { pct: growthView(g, en).size, since: 'March 2' }), 'The scope grew by 25% since March 2');
  assert.equal(fr('risks.growth', { pct: growthView(g, fr).size, since: '2 mars' }), 'Le périmètre a grossi de 25 % depuis 2 mars');
});
