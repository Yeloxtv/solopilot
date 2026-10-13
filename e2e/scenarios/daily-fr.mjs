// The end-of-session update on the French Fieldbook: the same week of work as daily.mjs, on the
// French demo, with the developer, the commits and the plan in French.
import { buildFieldbookFr } from '../fixtures.mjs';
import { fieldbookDaily } from './daily.mjs';

const french = (s) => /[éèêàâçùûôî]|\b(les|des|une|avec|pour|est|sur)\b/i.test(s);

export default fieldbookDaily({ name: 'daily-fr', title: 'End-of-session update on Fieldbook, in French', build: buildFieldbookFr, language: { label: 'French', test: french } });
