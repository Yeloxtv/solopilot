import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calendar, nextDay } from '../src/calendar.mjs';

test('nextDay crosses months and years', () => {
  assert.equal(nextDay('2026-01-31'), '2026-02-01');
  assert.equal(nextDay('2026-12-31'), '2027-01-01');
});

test('between counts working days in [from, to[', () => {
  const cal = calendar();
  assert.equal(cal.between('2026-01-05', '2026-01-10'), 5);
  assert.equal(cal.between('2026-01-05', '2026-01-17'), 10);
  assert.equal(cal.between('2026-01-05', '2026-01-05'), 0);
});

test('holidays are not worked', () => {
  const cal = calendar({ holidays: ['2026-01-07'] });
  assert.equal(cal.between('2026-01-05', '2026-01-10'), 4);
  assert.equal(cal.isWorking('2026-01-07'), false);
});

test('working_days can include the weekend', () => {
  const cal = calendar({ workingDays: [1, 2, 3, 4, 5, 6] });
  assert.equal(cal.between('2026-01-05', '2026-01-12'), 6);
});

test('add starts from the first working day', () => {
  const cal = calendar();
  assert.equal(cal.add('2026-01-10', 0), '2026-01-12');
  assert.equal(cal.add('2026-01-09', 1), '2026-01-12');
  assert.equal(cal.add('2026-01-05', 9), '2026-01-16');
});

test('until is signed', () => {
  const cal = calendar();
  assert.equal(cal.until('2026-01-07', '2026-01-16'), 7);
  assert.equal(cal.until('2026-01-16', '2026-01-14'), -2);
  assert.equal(cal.until('2026-01-16', '2026-01-16'), 0);
});
