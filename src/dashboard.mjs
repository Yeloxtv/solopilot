import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeT } from './i18n.mjs';

const TEMPLATE = join(dirname(fileURLToPath(import.meta.url)), '..', 'templates', 'dashboard.html');
const escHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// The page is a fragment: hosts such as claude.ai artifacts wrap it in their own document.
export function renderDashboard(b, c, locale) {
  const data = {
    project: b.project, people: b.people, sprints: b.sprints, milestones: b.milestones, meetings: b.meetings,
    dependencies: b.dependencies, questions: b.questions, requests: b.requests, areas: b.areas, log: b.log,
    calc: c, lang: locale.lang, intl: locale.intl, strings: locale.strings,
  };
  const values = {
    __TITLE__: escHtml(`${b.project.name} · solopilot`),
    '/*__DATA__*/null': JSON.stringify(data).replace(/</g, '\\u003c'),
    '/*__MAKE_T__*/null': makeT.toString(),
  };
  // One pass, so inserted data is never scanned for the next marker; a function, so a "$" in the
  // data is not read as a replacement pattern.
  return readFileSync(TEMPLATE, 'utf8').replace(/__TITLE__|\/\*__DATA__\*\/null|\/\*__MAKE_T__\*\/null/g, (m) => values[m]);
}

// build/publish.html is the fragment to publish; build/index.html wraps it to open in a browser.
export function writeDashboard(dir, page, lang) {
  const out = join(dir, 'build');
  mkdirSync(out, { recursive: true });
  const fragment = join(out, 'publish.html');
  const local = join(out, 'index.html');
  writeFileSync(fragment, page);
  writeFileSync(local, `<!doctype html>\n<html lang="${lang}">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n</head>\n<body>\n${page}\n</body>\n</html>\n`);
  return { local, fragment };
}
