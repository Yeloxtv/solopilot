// Working-day calendar. Dates are YYYY-MM-DD strings, compared as strings.

export const ISO = /^\d{4}-\d{2}-\d{2}$/;

export const nextDay = (s) => {
  const d = new Date(`${s}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};

export const localToday = () => new Date().toLocaleDateString('sv-SE');

// workingDays: ISO weekdays that are worked (1 = Monday … 7 = Sunday), Monday to Friday by default.
export function calendar({ holidays = [], workingDays = [1, 2, 3, 4, 5] } = {}) {
  const off = new Set(holidays.map(String));
  const worked = new Set(workingDays.map(Number));
  const isWorking = (s) => worked.has(new Date(`${s}T12:00:00Z`).getUTCDay() || 7) && !off.has(s);
  // Number of working days in [from, to[.
  const between = (from, to) => {
    let n = 0;
    for (let s = from; s < to; s = nextDay(s)) if (isWorking(s)) n++;
    return n;
  };
  // The n-th working day after the first working day on or after `from` (n = 0: that first day).
  const add = (from, n) => {
    let s = from;
    while (!isWorking(s)) s = nextDay(s);
    for (let k = 0; k < n;) {
      s = nextDay(s);
      if (isWorking(s)) k++;
    }
    return s;
  };
  // Signed working days from `from` to `to`: negative when `to` comes first.
  const until = (from, to) => (from <= to ? between(nextDay(from), nextDay(to)) : -between(nextDay(to), nextDay(from)));
  return { isWorking, between, add, until };
}
