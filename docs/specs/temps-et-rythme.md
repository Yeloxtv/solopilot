# Spécification : confronter le plan à la réalité

Statut : brouillon à valider. Chantier 3 de l'[état des lieux](../etat-des-lieux.md).

## Objectif

Aujourd'hui, le plan ne rencontre jamais la réalité : le temps passé est déclaré à chaque session, et la projection suit l'estimation indéfiniment. Ce chantier mesure le temps sans rien saisir, compare le rythme réel à l'estimation, et alerte quand l'écart dure. Ces mesures sont aussi la matière première de l'apprentissage des estimations, qui viendra ensuite.

## Mesurer le temps

**La source.** Claude Code garde en local un journal de chaque session. solopilot y lit les sessions du projet, c'est-à-dire celles dont le dossier de travail est dans le dépôt du projet. Il n'en lit que les horodatages et le type de chaque événement, jamais le contenu des échanges.

**Les mesures, par jour :**

| Mesure | Ce qu'elle compte |
| --- | --- |
| Temps d'attention | Le temps du développeur : écrire, lire, valider. Le délai avant chacun de ses messages compte en entier s'il dure moins de 15 minutes. Au-delà, il était ailleurs, et seules 5 minutes de lecture comptent. |
| Temps de l'agent | Le temps où Claude travaille, de chaque message du développeur à la fin de la réponse |
| Amplitude | De la première à la dernière activité de la journée |
| Sessions, messages | Combien de sessions, combien de messages du développeur |

Ce que la mesure ne voit pas : le code écrit à la main, les réunions, les appels. Elle donne un plancher, que le développeur complète.

**La conservation.** Claude Code efface ses journaux au bout de 30 jours par défaut. `solopilot time --record` relève donc, à chaque point, les jours pas encore relevés et les écrit dans une section `time` de `solopilot.yaml`, une ligne par jour. Le plan garde ainsi son historique.

## Proposer la charge au lieu de la demander

À chaque point, le skill lance `solopilot time` et propose la charge de la session à partir du temps d'attention. Par exemple : 2,3 h d'attention, sur des journées de 7 h, donnent une charge de 0,35, arrondie à 0,25 ou 0,5. Le développeur ajoute ce qui s'est fait hors de Claude Code. La durée d'une journée de travail se règle avec `project.hours_per_day`, 7 par défaut.

## Le rythme réel face à l'estimation

- **Le rythme réel** : les points livrés par jour de charge déclarée (la somme des `effort` des sessions). L'estimation du plan, c'est `points_per_day`.
- **Où il s'affiche** : une ligne dans `status` et une carte dans le tableau de bord. Par exemple : « Rythme réel : 4,1 points par jour de travail, pour 6,3 estimés (−35 %). À ce rythme, le cœur finirait le 2 décembre. »
- **Le risque** : levé quand le rythme réel reste sous 80 % de l'estimation, après au moins 5 sessions et 15 % du plan livré. Avant, les premiers jours ne disent rien, et le risque ne se lève pas.
- **La projection officielle reste sur l'estimation du plan.** La date au rythme réel est une information. Recalibrer `points_per_day` reste la décision du développeur, qui l'inscrit au journal comme une replanification.

## Changements de l'outil

- `src/journal.mjs` lit les journaux de Claude Code d'un projet et calcule les mesures par jour.
- `solopilot time` affiche les mesures des jours pas encore relevés, et `--record` les écrit dans `time`. C'est la troisième commande qui écrit `solopilot.yaml`, par les mêmes modifications chirurgicales que `layout` et `baseline`.
- Le calcul ajoute le rythme réel, la date au rythme réel et le risque. Le tableau de bord et `status` les affichent.
- Le skill, au point de fin de session, lance `solopilot time`, propose la charge, puis `solopilot time --record` avec l'écriture du point.

## Décisions à prendre

1. **La source.** *Recommandé : les journaux de Claude Code.* Ils existent déjà et couvrent le passé dès l'installation, sans hook de plus. Leur format est interne et peut changer : la mesure le signale alors, au lieu de se tromper. L'alternative est un hook qui écrit ses propres événements : un contrat stable, mais qui ne mesure qu'à partir de son installation.
2. **La conservation.** *Recommandé : une section `time` dans `solopilot.yaml`, une ligne par jour.*
3. **Les seuils.** *Recommandé : 15 minutes avant de considérer une absence, 5 minutes de lecture après une absence, 7 heures par journée de travail.*
4. **Le rythme réel.** *Recommandé : les points livrés par jour de charge déclarée, et un risque levé sous 80 % de l'estimation, après 5 sessions et 15 % du plan livré.* Les heures mesurées serviront plus tard à apprendre ce que coûte chaque type de tâche.
5. **La charge proposée.** *Recommandé : tirée du temps d'attention, arrondie au quart de journée, complétée par le développeur.*

## Hors de cette version

- Répartir le temps entre les tâches par les commits, pour apprendre ce que coûte chaque type de tâche : c'est la suite, une fois les mesures accumulées.
- Le temps d'attention partagé entre deux sessions de projets différents menées en parallèle : chaque projet compte le sien, ce qui peut compter deux fois les mêmes minutes.

## Comment on le teste

- Tests unitaires sur des journaux fabriqués : le temps d'attention avec et sans absence, le temps de l'agent, les jours, le filtrage par dossier de projet, un format inconnu signalé sans planter.
- Le relevé : `time --record` n'écrit que les jours nouveaux, et le plan reste valide.
- Le rythme réel et le risque : levé dans les bonnes conditions seulement.
- Scénario de bout en bout : sur Fieldbook, le point de fin de session propose une charge tirée de la mesure et relève le temps.
