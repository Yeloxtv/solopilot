// The end-of-session update on Fieldbook with the developer typing in English, the plan's language:
// the common case for an English-speaking developer. `daily` keeps the developer in French on purpose.
import { buildFieldbook } from '../fixtures.mjs';
import { fieldbookDaily } from './daily.mjs';

const english = (s) => !/[éèêàâçùûôî]|\b(les|des|une|avec|pour|est|sur)\b/i.test(s);

export default fieldbookDaily({
  name: 'daily-en',
  title: 'End-of-session update on Fieldbook, in English',
  build: buildFieldbook,
  language: { label: 'English', test: english },
  prompts: { approve: 'I approve all of it. Effort today: 0.5.', reminded: 'I reminded Harbor & Pine about Q01 today, by email.' },
});
