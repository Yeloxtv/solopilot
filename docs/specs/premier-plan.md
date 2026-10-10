# Spécification : le premier plan

Statut : validée le 2026-10-10, en cours de réalisation. Mission 1 de la [vision produit](../vision.md).

## Objectif

Passer des documents d'un projet signé (cahier des charges, notes d'ateliers, maquettes s'il y en a, devis, date de mise en production) à un `solopilot.yaml` complet, construit avec Claude en six étapes validées une à une, et qui répond à la question : *qu'est-ce que je peux promettre ?*

Une fois validé, ce plan devient le **plan convenu** : la référence du projet.

## Déroulé

```bash
solopilot init ../acme-pilot     # dossier de pilotage : sources/, plan vide en phase de planification, premier commit
# déposer les documents du projet dans ../acme-pilot/sources/
cd ../acme-pilot && claude       # Claude Code ouvert dans le dossier de pilotage
/solopilot                       # le skill voit un plan en planification : il déroule les six étapes
solopilot baseline               # fige le plan convenu
solopilot install ../acme        # branche le pilotage sur le dépôt du projet, comme aujourd'hui
```

La planification se fait dans le dossier de pilotage, pas dans le dépôt du projet : les documents du client sont confidentiels et n'ont rien à faire dans un dépôt qui lui sera livré. Elle peut aussi commencer avant que le dépôt du projet existe.

## Entrées

| Entrée | Forme | Sert à |
| --- | --- | --- |
| Cahier(s) des charges | PDF, Markdown, texte. Un fichier Word se convertit d'abord en PDF ou en Markdown | Les fonctionnalités et leurs sources |
| Notes d'ateliers | Mêmes formats | Les décisions déjà prises, les questions déjà posées |
| Maquettes, s'il y en a | Images, PDF, ou liens Figma si le connecteur Figma est disponible | Les écrans dessinés et leurs vues |
| Devis | Le nombre de jours vendus | Le plafond du plan |
| Dates | Démarrage et mise en production | `start` et `target` |
| Disponibilité | La part de chaque journée donnée au projet, de 0 à 1 | `focus` |

Les trois dernières entrées sont demandées au développeur dès le début, si les documents ne les donnent pas.

## Les six étapes

Chaque étape suit le même cycle :
1. Claude rédige une proposition.
2. Le développeur la corrige et la valide.
3. Claude l'écrit dans `solopilot.yaml`.
4. `solopilot check` passe.
5. Claude fait un commit dans le dossier de pilotage, par exemple `plan : étape 2, écrans et vues`.

Rien ne s'écrit avant la validation.

Une règle vaut pour toutes les étapes : **Claude n'invente rien.** Chaque fonctionnalité renvoie à une source. Ce que les documents ne disent pas devient une question, jamais une hypothèse silencieuse.

### 1. Les fonctionnalités

- **Claude** lit toutes les sources et liste chaque fonctionnalité. Il la range dans un domaine et note sa source précise (fichier, page ou section). Il relève aussi ce que le cahier des charges exclut explicitement, et ce qu'il laisse dans le flou.
- **S'écrit :** `areas`, `features`, et les premières `questions`, nées des zones floues.
- **Le développeur vérifie** que la liste est complète, que rien n'est inventé, que les domaines tiennent et que les exclusions sont justes.

### 2. Les écrans et leurs vues

- **Claude** déduit les écrans qui portent ces fonctionnalités et, pour chacun, la liste de ses vues : par défaut, vide, chargement, erreur, et les variantes métier. S'il y a des maquettes, il rattache chaque écran dessiné à son entrée, puis signale les écrans et les vues qui restent à dessiner. Les états vides et d'erreur manquent presque toujours.
- **S'écrit :** les tâches écran `S…`, avec leurs vues, leurs fonctionnalités et leur maquette, mais sans jour pour l'instant. Si un tiers dessine ce qui manque, une dépendance « écrans à dessiner » est ajoutée par lot.
- **Le développeur vérifie** les écrans manquants ou en trop, et les vues.

### 3. Les questions

- **Claude** passe chaque fonctionnalité et chaque écran au crible : règle métier, contenu, donnée, accès, infrastructure, décision. Il sépare ce qu'il faut **trancher**, qui devient une question, de ce qu'il faut **recevoir** (accès, contenus, maquettes), qui devient une dépendance.
- **S'écrit :** `questions` et `dependencies`, chacune avec `who` et les fonctionnalités qui l'attendent. Si un rendez-vous client est connu, il est ajouté dans `meeting`.
- **Le développeur vérifie** la pertinence des questions, et qui doit répondre à chacune.

### 4. Les tâches et leur estimation

- **Claude** propose d'abord une **grille d'estimation** : des tailles types par genre de tâche, avec leurs points. Par exemple : « écran de 3 vues simples : 1 point », « ressource avec règles métier : 1,5 point ». Une fois la grille validée, il découpe chaque fonctionnalité en tâches `T…` (logique, intégration, contenu, mise en production), chacune avec son genre, sa fonctionnalité et ses points. Les écrans reçoivent aussi leurs points.
- **S'écrit :** `estimation` (la grille et sa base : des hypothèses pour l'instant, l'historique plus tard), les tâches `T…`, et les points de toutes les tâches. Les liens des questions vers les fonctionnalités se précisent en liens vers les tâches.
- **Le développeur valide** la grille d'abord, puis corrige les estimations qu'il juge fausses.

### 5. Le plan daté

- **Claude** classe les fonctionnalités par priorité :
  1. les fondations ;
  2. un parcours de bout en bout, avant d'aller en largeur ;
  3. le reste du cœur, c'est-à-dire ce qui est indispensable à la mise en production ;
  4. le reste.

  `solopilot layout` répartit ensuite les tâches sur des jours de plan, dans cet ordre, à raison de `points_per_day` par jour. Claude propose les sprints et les jalons : démonstration de fin de sprint, recette, mise en production. Chaque question reçoit son `before` : le premier jour du travail qui l'attend.
- **S'écrit :** `days`, le `day` de chaque tâche, `project.core`, `plan_days`, `sprints`, `milestones`, et le `before` des questions et des dépendances.
- **Le développeur valide** l'ordre, la ligne du cœur et les jalons.

### 6. Ce qu'on peut promettre

- **Claude** lance `solopilot status` sur le plan. Il compare la fin projetée du cœur et celle de la totalité à la date cible, et `plan_days` aux jours vendus. Si tout ne tient pas, il propose ce qui passe sous la ligne, en commençant par les fonctionnalités hors cœur de moindre valeur, jusqu'à ce que le cœur tienne avec une marge. Il ne coupe jamais dans le cœur sans le dire.
- **Produit :**
  - un résumé interne pour le PO : ce que couvre le cœur, la marge, les risques ;
  - la liste des questions à poser tout de suite ou au prochain rendez-vous, rédigée pour le client, sans retards ni marges.
- **Le développeur confirme**, puis lance `solopilot baseline`.

## Reprendre en cours de route

Une planification peut s'étaler sur plusieurs sessions. Le skill déduit l'étape atteinte du contenu du fichier : présence de fonctionnalités, d'écrans, de questions, de points, de jours, d'un plan convenu. Il reprend là où on s'était arrêté. Le développeur peut aussi rouvrir une étape, par exemple l'étape 2 quand de nouvelles maquettes arrivent. Les étapes suivantes sont alors revues.

## Changements du format

```yaml
project:
  phase: planning      # écrit par init, retiré par `solopilot baseline`
  baseline: { date: 2026-10-14, points: 132, plan_days: 21 }   # écrit par `solopilot baseline`

features:
  - { id: F01, area: accounts, title: "Connexion par lien magique", source: "cdc.pdf p. 4, §2.1" }
  - { id: F02, area: inspections, title: "Signature en fin d'inspection", source: "atelier-1.md" }
  - { id: F03, area: reports, title: "Export comptable", source: "cdc.pdf p. 9", scope: out, note: "Exclu au devis" }

estimation:
  basis: hypotheses    # plus tard : history
  grid:
    - { kind: screen, size: "3 vues simples", points: 1 }
    - { kind: logic, size: "ressource avec règles métier", points: 1.5 }

tasks:
  - { id: T004, feature: F01, day: 2, area: accounts, kind: logic, status: todo, points: 1.5, title: "Lien magique : envoi, expiration, usage unique" }
  - { id: S01, feature: F01, day: 7, area: accounts, status: todo, points: 1, views: [défaut, erreur, envoi en cours], design: "sources/maquettes/connexion.png", title: "Écran de connexion" }

questions:
  - { id: Q01, who: "Harbor & Pine", features: [F02], tasks: [T019], title: "Une inspection signée peut-elle encore être modifiée ?" }
```

| Champ | Rôle |
| --- | --- |
| `project.phase` | `planning` tant que le plan n'est pas convenu. `check` accepte alors des tâches sans jour et des jours manquants |
| `project.baseline` | Le plan convenu : date, total de points, nombre de jours. La référence de la croissance du périmètre |
| `project.budget_days` | Les jours vendus au devis, auxquels l'étape 6 compare le plan |
| `features` | `F01…` : domaine, titre, source dans les documents, `core: true` pour une fonctionnalité du cœur, `priority` pour l'ordre de réalisation, `scope: out` pour une exclusion explicite, note |
| `tasks[].feature` | La ou les fonctionnalités que la tâche réalise |
| `tasks[].points` | Sa charge estimée. Les points d'un jour deviennent la somme de ses tâches, et son avancement est pondéré par les points |
| `tasks[].kind` | `setup`, `logic`, `integration`, `content` ou `release`. Un écran est de genre `screen` d'office. Sert à l'apprentissage |
| `tasks[].views` | Un entier, comme aujourd'hui, ou la liste des vues nommées |
| `tasks[].design` | Le lien ou le fichier de la maquette |
| `questions[].features`, `dependencies[].features` | Les fonctionnalités qui attendent la réponse, avant que les tâches existent |
| `estimation` | La grille d'estimation et sa base |

Tout reste rétrocompatible. Un fichier sans `phase`, sans `features` et sans points par tâche se lit exactement comme aujourd'hui, et la démo comme les tests existants restent valides.

## Changements de l'outil

**Ligne de commande**

- `init` crée `sources/`, écrit `phase: planning`, et fait le premier commit du dossier de pilotage. Ce dernier point corrige au passage le défaut relevé au premier test : le hook restait muet et `commit -am` échouait.
- `check` suit la phase. Il valide les fonctionnalités et leurs sources, les points, les genres, les vues nommées, et les liens vers les fonctionnalités et les tâches.
- `layout`, une nouvelle commande, répartit les tâches sur des jours de plan, dans l'ordre de priorité des fonctionnalités et à raison de `points_per_day` par jour. Avec `--dry-run`, elle affiche la répartition sans rien écrire.
- `baseline`, une nouvelle commande, vérifie que le plan est complet, écrit `project.baseline`, retire `phase`, ajoute une entrée au journal, et pose un tag git `baseline` dans le dossier de pilotage.
- `status`, en phase de planification, montre l'avancement de la planification (fonctionnalités, écrans et vues, questions, points, jours) au lieu de la projection.
- Le calcul pondère l'avancement d'un jour par les points de ses tâches quand elles en ont.

**Skill**

- Un mode « Premier plan » dans `SKILL.md`. Son déroulé détaillé vit dans `claude/skills/solopilot/plan.md`, lu seulement dans ce mode, pour ne pas alourdir les mises à jour quotidiennes.
- Si `$SOLOPILOT_DIR` est vide mais que le dossier courant contient `solopilot.yaml`, le skill travaille dans ce dossier. C'est le cas de la planification.
- Les textes s'écrivent dans la langue de `project.locale`.

## Décisions prises (2026-10-10)

1. **Points par tâche.** Apprendre ce que vaut un écran ou une intégration demande des points par tâche. Les points par jour restent lus pour les fichiers existants.
2. **`solopilot layout` répartit les jours**, à partir de l'ordre de priorité des fonctionnalités. Le calcul reste exact et reproductible, et Claude et le développeur ajustent ensuite.
3. **Des vues nommées**, le nombre restant accepté. La liste dit ce qu'il faut construire, et la règle « un écran est fait quand toutes ses vues sont branchées » devient vérifiable.
4. **Les sources sont versionnées** dans le dossier de pilotage, qui est privé, pour que les renvois restent lisibles.
5. **Un seul skill**, avec un fichier `plan.md` lu seulement en mode planification.

`layout` et `baseline` sont les deux seules commandes qui écrivent `solopilot.yaml`. Elles le font en gardant les commentaires et la mise en forme, et refusent d'écrire si elles ne peuvent pas le garantir.

## Hors de cette version

- Estimer à partir de l'historique (mission 6). La grille est pensée pour être remplacée par l'historique plus tard. Ici, elle ne part que d'hypothèses.
- La mesure du temps.
- L'affichage de la croissance du périmètre. Le plan convenu est enregistré, mais l'écart ne s'affiche pas encore.
- La lecture des maquettes au-delà de l'inventaire des écrans et des vues.

## Comment on le teste

- **Un cahier des charges fictif**, de cinq à huit pages, pour un projet du bac à sable, avec :
  - des trous volontaires : règles non tranchées, contenus manquants, accès à obtenir ;
  - une section d'exclusions explicites ;
  - deux ou trois maquettes en images, auxquelles il manque des vues.
- **Une planification complète** dans une session Claude Code ouverte dans le dossier de pilotage. On vérifie que :
  - chaque fonctionnalité a sa source ;
  - chaque trou volontaire est devenu une question ou une dépendance ;
  - les vues vides et d'erreur apparaissent ;
  - le plan tient, ou la ligne du cœur est proposée ;
  - `check` passe à chaque étape ;
  - `baseline` pose la référence.
- **Des tests unitaires** : validation en phase de planification, avancement pondéré par les points (et la démo inchangée sans points), répartition de `layout`, `baseline`. Les 43 tests actuels restent verts.
