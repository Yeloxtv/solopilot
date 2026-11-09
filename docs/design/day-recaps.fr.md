# Spécification : une restitution par jour du plan

Statut : validée le 2026-11-09, à construire. Inscrite dans « Next » de la [feuille de route](../roadmap.md). Version française de [day-recaps.md](day-recaps.md), gardée à côté : les deux changent ensemble.

## Objectif

Le tableau de bord dit à ceux qui suivent le projet où il en est : la marge, ce qui bloque, qui doit quoi. Il ne dit pas ce qui a été construit. Un PO ou un responsable qui ne lit pas le diff, et ne maîtrise pas le back end, voit les tâches d'un jour passer au vert sans savoir ce qu'un utilisateur peut désormais faire, qui a le droit de le faire, ni quel risque a été écarté ce jour-là.

Une restitution est une page privée, une par jour du plan, qui le montre en clair : ce qui marche maintenant, avec une capture, qui peut quoi, les obstacles levés et ce qui le prouve, ce qui reste et quand. Elle existe dès le premier travail livré sur le jour et le suit jusqu'à ce qu'il soit terminé : une tâche encore bloquée ne cache pas ce qui marche déjà. Elle sert le point 5 de la [vision](../vision.md) : donner l'état du projet à ceux qui le suivent, sans réunion et sans compte rendu écrit à la main.

## D'où elle vient

Le format a été utilisé et validé sur un vrai projet client, piloté avec un ancêtre de solopilot. La feuille de route fait passer ce que l'usage réel apprend avant toute fonctionnalité prévue : après presque un mois d'usage réel de solopilot, c'est le deuxième besoin qu'il a fait remonter, après la [vue Kanban](board.md).

## Pour qui

**Ceux qui suivent, côté agence** : le PO, le chef de projet, la direction. Les mêmes lecteurs que le tableau de bord, avec la même confidentialité : les restitutions se lisent depuis la page du tableau de bord, partagée par le développeur seul.

Elle n'est pas pour le client dans cette version. La [vue client](#une-vue-pour-le-client-plus-tard) est discutée plus bas.

## La page

Les sections, dans cet ordre. Chaque affirmation vient de quelque chose que solopilot ou le projet peut montrer : un commit taggé, une entrée du journal, une question répondue, un test qui passe, une recette faite. Ce qui n'a pas été vérifié ne s'écrit pas, et aucune durée ne s'invente.

| Section | Ce qu'elle contient | Qui l'écrit |
| --- | --- | --- |
| En-tête | Le jour, son titre et son sprint ; terminé et quand, ou en cours avec les tâches faites, celles qui restent et celles qui sont bloquées, avec ce qu'elles attendent ; les questions et dépendances réglées pour lui ; le jalon atteint. Puis une phrase, du point de vue d'un utilisateur | solopilot calcule les faits depuis le plan ; la phrase est rédigée |
| Ce qui marche maintenant | Une carte par fonctionnalité que le jour fait avancer : trois ou quatre puces en clair, ce qui arrive plus tard et quand, une capture | Le skill rédige, le développeur valide |
| Qui peut quoi | Un tableau : les actions du jour en lignes, les rôles du projet en colonnes, Oui ou Non avec la nuance en petit. Dessous, les tests qui le prouvent | Depuis les règles d'accès et les tests du projet |
| Obstacles levés | Une carte par obstacle : le risque, dit par sa conséquence pour un utilisateur ; la solution ; la preuve (un test, une relecture, la recette) | Depuis les questions répondues du jour, les notes du journal et le projet |
| Ce qui reste | Les limites connues, les tâches bloquées ou reportées, les questions encore ouvertes, chacune avec son « quand » | Depuis le plan |
| En chiffres | Les commits, les tests des suites touchées, les questions réglées | Depuis le plan et le projet |
| Annexe technique | Repliée : endpoints, données, relectures | Depuis le projet |

Une section qui n'a rien à dire est omise : un jour qui n'ajoute aucun rôle n'a pas de tableau.

### Par exemple : Fieldbook, jours 5 et 6

Jour 5, « Inspection runs », terminé le 14 octobre, son point de contrôle atteint. Trois tâches faites : démarrer, enregistrer et soumettre une inspection (T011), les constats avec une gravité (T012), la trace de chaque modification (T013).

- **La phrase** : « Un inspecteur peut désormais parcourir une checklist, noter ce qui n'est pas conforme avec sa gravité, et soumettre l'inspection ; chaque modification laisse une trace. »
- **Ce qui marche maintenant** : le déroulé d'une inspection et les constats, deux cartes. Le jour 5 est du back end seul : il n'y a pas encore d'écran à capturer, et les cartes le disent, avec le moment où ce sera visible (les écrans d'inspection, jours 9 et 10, montrés à la démo du jour 10). Aucune maquette ne remplace une capture.
- **Qui peut quoi** : « Soumettre une inspection » vaut Oui pour un inspecteur (*sites de sa région*), Non pour un responsable et un administrateur ; « Modifier une inspection soumise » vaut Non pour tous (*tant que Q01 n'est pas tranchée*). Dessous : les tests d'accès des endpoints d'inspection, et combien passent.
- **Obstacles levés** : « Une inspection soumise est définitive, mais rien ne montrait qui l'avait modifiée avant. » Solution : chaque modification enregistre qui, quand et quoi (T013). Preuve : ses tests, et le point de contrôle atteint.
- **Ce qui reste** : savoir si un inspecteur peut modifier une inspection soumise est encore ouvert (Q01, à poser à la réunion du 23 octobre) ; les règles de modification l'attendent (T014, jour 6).

Le jour 6, « Photos, notes and edits », n'est pas terminé : l'envoi des photos (T015) et les notes sur les constats (T016) le sont, mais les règles de modification (T014) attendent Q01. Sa restitution existe quand même. L'en-tête dit « en cours, 2 tâches sur 3, T014 attend Q01 » ; les photos et les notes ont leurs cartes ; « Ce qui reste » dit ce que Q01 retient. Quand Q01 est répondue et T014 faite, la même restitution est mise à jour et le jour se lit terminé.

## Où elle vit

Un dossier par jour du plan dans le répertoire de pilotage, à côté de `sources/` :

```
fieldbook-pilot/
├── solopilot.yaml
├── recaps/
│   └── day-05/
│       ├── recap.md       les sections rédigées
│       └── *.png          les captures qu'elle montre
└── build/
```

Aucune nouvelle clé dans `solopilot.yaml` : un jour a une restitution quand son dossier contient un `recap.md`. Le dossier est commité avec le plan, dans le répertoire de pilotage, jamais dans le projet.

`recap.md` ne contient que les sections rédigées ; l'en-tête est recalculé depuis le plan à chaque build, si bien que la restitution et le plan ne se contredisent jamais, et qu'un jour qui passe d'en cours à terminé le dit sans qu'un mot soit réécrit. C'est du Markdown, dans un petit sous-ensemble que solopilot rend lui-même, sans nouvelle dépendance :

- des titres `##` pour les sections, dans la langue du projet ;
- des titres `###` pour les cartes : une fonctionnalité qui marche, un obstacle levé ;
- des paragraphes, des puces, du gras, des liens, des tableaux, et des images qui pointent vers un fichier du dossier (`![La liste des sites](site-list.png)`) ;
- une ligne `---` : tout ce qui suit est l'annexe technique repliée.

Rien d'autre : pas de HTML brut, pas de script. Un format restreint garde toutes les restitutions semblables, et `solopilot check` peut dire quand l'une en sort.

## Le build

`solopilot build` rend aussi chaque restitution :

- **`build/recaps/day-05.html`** : une page complète, dans le style du tableau de bord, clair et sombre. Ses images y sont intégrées (URI `data:`) : chaque restitution est un seul fichier. Un jour de quatre captures de téléphone pèse environ un mégaoctet.
- **`solopilot check`** signale un dossier de restitution pour un jour qui n'existe pas, une image citée mais absente, et du Markdown hors du sous-ensemble.

### Lue depuis le tableau de bord

Il n'y a qu'un lien à partager, celui du tableau de bord. Le menu de son en-tête, qui passe déjà du pilotage à la [vue Kanban](board.md), gagne une troisième page, « Restitutions » (« Recaps » en anglais), affichée dès qu'un jour en a une. La page porte une étiquette par jour du plan qui a une restitution, dans l'ordre des jours, marquée terminé ou en cours, la plus récente sélectionnée. Un clic sur une étiquette affiche la restitution de ce jour sous les étiquettes, en pleine largeur, à la hauteur de son contenu. Dans le pilotage, la ligne d'un jour qui a une restitution porte un lien « Restitution » qui ouvre cette page sur son étiquette.

Le panneau ne charge `recaps/day-05.html` qu'au choix de son étiquette, pour que `build/publish.html` ne grossisse pas à chaque restitution : vingt jours de captures dedans dépasseraient les 16 Mo qu'autorise une page claude.ai. Les étiquettes conviennent à la vingtaine de jours d'un plan ; au-delà, une liste déroulante peut les remplacer, sans rien changer d'autre.

### La publication

Quand `project.dashboard_url` est renseigné, le skill publie `build/publish.html` comme aujourd'hui, avec les restitutions en fichiers annexes de la même page (`files: { "recaps/day-05.html": "build/recaps/day-05.html" }`), pour que le panneau les atteigne par leur chemin relatif.

C'est à essayer d'abord : est-ce qu'une page claude.ai peut afficher l'un de ses propres fichiers annexes dans son panneau ? Si non, les restitutions sont intégrées dans la page du tableau de bord elle-même, leurs captures réduites, et le build refuse au-delà de la limite de taille plutôt que de publier une page qui ne se chargerait pas.

## Le skill

- **Quand.** À chaque mise à jour de fin de session dont les commits taggés font avancer des tâches d'un jour du plan, le skill propose de rédiger la restitution de ce jour, ou de la mettre à jour si elle existe. Une tâche bloquée ou inachevée ne la retient pas : ce qui marche déjà est montré, ce qui est bloqué va dans « Ce qui reste ». C'est une proposition, pas une étape : le développeur peut refuser, et aucune restitution n'est rédigée pour les jours passés sauf demande.
- **Une mise à jour** ne réécrit que ce que le nouveau travail change : une nouvelle carte, une ligne ajoutée au tableau, un obstacle levé, une limite qui sort de « Ce qui reste ». Le développeur voit ce qui change avant que ce soit écrit.
- **Le format** va dans `recap.md`, dans le dossier du skill, lu seulement au moment de rédiger, comme `plan.md` pour le premier plan.
- **Ce que solopilot sait déjà**, d'où le skill rédige : les tâches du jour et leurs points, les fonctionnalités qu'elles livrent, les commits taggés de leurs identifiants, les questions et dépendances réglées pour elles, les entrées du journal des jours qu'il a pris, le jalon atteint. `solopilot commits --day 5` liste les commits taggés des tâches d'un jour, sur tout l'historique : le `commits` d'aujourd'hui ne voit que ceux depuis la dernière mise à jour, et le skill ne lance pas git lui-même.
- **Ce que seul le projet sait** : les captures, les rôles et les règles d'accès, les tests et leur nombre. Les captures sont prises par la méthode du projet (un script Playwright sur la stack de dev, à largeur de téléphone, recadré sur l'utile, avec un cadre autour de ce que le jour ajoute) et déposées dans le dossier. solopilot ne les prend jamais : la stack, les comptes et les données de test sont ceux du projet.
- **La validation.** Le skill montre le brouillon, le développeur corrige et valide, puis il écrit `recap.md`, lance `build`, publie et commite dans le répertoire de pilotage. `solopilot install` autorise l'écriture dans `recaps/`, pour que cela tourne sans demande de permission.
- **Le texte ne parle jamais de retard, de marge, de points ni de projection.** Le tableau de bord les porte. Cela garde la restitution lisible par quelqu'un qui ne suit pas le plan, et rend une future vue client peu coûteuse.

## Une vue pour le client, plus tard

La feuille de route prévoit « une vue générée pour le client » une fois le besoin confirmé. Les restitutions en seraient la meilleure matière : elles disent ce qui marche, avec les mots du client, captures à l'appui. Elles ne sont pas encore cette vue. Avant qu'une restitution puisse aller à un client, elle perdrait :

- le numéro du jour du plan, ses points et la date à laquelle il était prévu, qui disent le rythme à qui les compare ;
- les tâches bloquées ou reportées, et les limites connues qui trahissent une coupe dans le périmètre ;
- les questions que le développeur se doit à lui-même (`who` vaut `project.owner`), comme dans le document de périmètre ;
- les obstacles qui racontent une difficulté interne plutôt qu'un risque levé pour l'utilisateur ;
- l'annexe technique.

Avec la règle d'écriture ci-dessus, l'essentiel de tout cela se trouve dans les parties que solopilot calcule, et la vue client serait un second rendu du même fichier plutôt qu'un second texte. Elle est hors de cette version.

## Hors périmètre

- Prendre les captures, et toute dépendance à un navigateur ou à Playwright.
- Une restitution pour le client, ou envoyée au client.
- Une restitution par sprint ou par semaine : celles d'un sprint sont les étiquettes de ses jours.
- Une restitution rédigée ou publiée sans la validation du développeur.
- Une clé ou une section dans `solopilot.yaml`.
- La restitution dans le digest Slack, au-delà de ce que donne déjà le lien vers le tableau de bord.

## Décisions (2026-11-09)

1. **Le fichier de la restitution.** Du Markdown dans un sous-ensemble que solopilot rend, l'en-tête calculé depuis le plan.
2. **Les images.** Intégrées dans la page de chaque restitution.
3. **Un seul lien.** Les restitutions se lisent depuis le tableau de bord, sur une page du menu de son en-tête, à côté de la vue Kanban : une étiquette par jour, et un clic affiche la restitution de ce jour. La forme, étiquettes ou liste déroulante, se règle en construisant la page.
4. **Quand.** À chaque mise à jour qui fait avancer les tâches d'un jour, pas seulement une fois le jour terminé : une tâche bloquée ne cache pas ce qui marche déjà.
5. **La règle d'écriture.** Ni retard, ni marge, ni points, ni projection dans ce qui est rédigé.
6. **Quand la construire.** Maintenant : après presque un mois d'usage réel, c'est un vrai besoin.

## Comment ce serait testé

- Tests unitaires : l'en-tête calculé depuis le plan, pour un jour terminé et pour un jour en cours avec une tâche bloquée ; le sous-ensemble Markdown, les cartes et l'annexe repliée ; les images intégrées, et une image absente signalée par `check` ; le tableau de bord qui ne montre une étiquette que pour les jours qui ont une restitution, et les lignes de jour qui y renvoient ; `publish.html` qui ne grossit pas avec les restitutions ; `commits --day` qui liste les commits des tâches du jour d'une mise à jour à l'autre.
- Scénario de bout en bout : sur Fieldbook, une mise à jour de fin de session fait avancer le jour 6 alors que T014 est encore bloquée ; le skill propose la restitution et la rédige depuis le plan et les commits, T014 dans « Ce qui reste » ; une fois validée, la restitution est écrite, construite et affichée depuis son étiquette. Une mise à jour suivante clôt T014, et la même restitution est mise à jour et se lit terminée.
