import { normalize } from '../src/backlog.mjs';

// A three-day plan over two working weeks, from Monday 2026-01-05 to Friday 2026-01-16.
// Day 1 is done, day 2 is half done: 6 points delivered out of 12.
export function fixture(overrides = {}) {
  return normalize({
    project: { name: 'Test', client: 'Acme', start: '2026-01-05', target: '2026-01-16', plan_days: 3, core: 2, points_per_day: 4, focus: 0.5, ...overrides.project },
    sprints: [{ id: 1, from: 1, to: 3, title: 'All' }],
    milestones: [{ day: 2, type: 'client', status: 'upcoming', title: 'Demo' }],
    meetings: [{ date: '2026-01-08', title: 'Workshop', with: 'Acme' }],
    dependencies: [{ id: 'D01', before: 1, status: 'received', who: 'Acme', title: 'Access' }],
    questions: [
      { id: 'Q01', before: 2, status: 'open', who: 'Acme', title: 'Who signs off?', tasks: ['T003'] },
      { id: 'Q02', before: 3, status: 'open', who: 'Acme', title: 'Which export format?', tasks: ['T004'] },
    ],
    requests: [{ id: 'R01', status: 'pending', title: 'Dark mode' }],
    areas: [{ id: 'core', title: 'Core' }],
    days: [
      { day: 1, sprint: 1, points: 4, title: 'One' },
      { day: 2, sprint: 1, points: 4, title: 'Two' },
      { day: 3, sprint: 1, points: 4, title: 'Three' },
    ],
    tasks: [
      { id: 'T001', day: 1, area: 'core', status: 'done', done_on: '2026-01-05', title: 'First' },
      { id: 'T002', day: 2, area: 'core', status: 'done', done_on: '2026-01-06', title: 'Second' },
      { id: 'T003', day: 2, area: 'core', status: 'todo', title: 'Third' },
      { id: 'T004', day: 3, area: 'core', status: 'todo', title: 'Fourth' },
    ],
    log: [
      { date: '2026-01-05', type: 'session', effort: 1, title: 'Start' },
      { date: '2026-01-06', type: 'session', title: 'Default effort' },
    ],
    ...overrides.sections,
  });
}
