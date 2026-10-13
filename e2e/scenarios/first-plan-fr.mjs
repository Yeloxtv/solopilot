// The first plan of Fieldbook in French, from the documents `solopilot init --example --locale fr`
// copies: the same story as first-plan-en, the developer and the plan in French.
import { buildFieldbookDocsFr } from '../fixtures.mjs';
import { fieldbookFirstPlan } from './first-plan-en.mjs';

export default fieldbookFirstPlan({
  name: 'first-plan-fr',
  title: 'First plan of Fieldbook, from its documents, in French',
  build: buildFieldbookDocsFr,
  language: 'French',
  locale: 'fr',
  prompt: [
    'Pour ce qui manque : je donne à ce projet la moitié de chaque jour ouvré, et une journée pleine vaut 6 points.',
    'Les dates et les jours vendus sont dans le devis : garde-les, même si le jour 1 est déjà derrière nous.',
    // Approving one step at a time: without "show me the next one", a session may take the approval
    // for the whole plan and write every step without showing it.
    "Ta proposition me convient : je l'approuve. Écris-la, puis présente-moi l'étape suivante avant de l'écrire. Pour le cœur et l'ordre, garde ce que tu proposes.",
    'Quand le plan est prêt à être convenu, je le confirme : lance solopilot baseline.',
  ].join(' '),
  answers: (t) => /\b(les|des|fonctionnalités?)\b/i.test(t) && !/\b(the|features)\b/i.test(t),
  foreign: /\b(the|and|screen)\b/i,
  gaps: {
    'whether a submitted inspection can be corrected': /corrig|modifi|renvo|soumis/,
    'how long photos are kept': /photo/,
    'what page one of the report shows': /première page|page 1|page un/,
    'what a manager sees': /responsable|rôle/,
    'the list of sites': /site/,
    'the sample checklists': /grille|formulaire/,
    'the inspection screens from the design team': /écran|design|maquette/,
    'the staging server, domain and certificate': /préproduction|domaine|certificat|serveur/,
  },
  exclusions: { 'native apps in the stores': /native|store/, 'maintenance software': /maintenance/, invoicing: /factur/, 'other languages': /langue/ },
  decisions: [/gravit/, /version/, /redimension|localisation/],
  sources: /cahier|atelier|devis|maquette|\.md|\.svg|R\d/i,
  mockups: /maquettes\//,
  // View names may stay the format's own English words, or be written in French.
  views: /vide|erreur|hors ligne|aucun|empty|error|offline|no result/,
  offline: /hors ligne|réseau|offline/i,
  steps: /plan|step|étape/i,
});
