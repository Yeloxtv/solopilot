# Spécification : voir tous ses projets ensemble

Statut : validée le 2026-10-11, en cours de réalisation. Chantier 6 de l'[état des lieux](../etat-des-lieux.md).

## Objectif

Un développeur seul mène souvent plusieurs projets à la fois. Chaque plan suppose sa part de journée (`focus`), et chaque projection en dépend. Personne ne vérifie que ces parts tiennent ensemble : trois projets à 0,5 j par jour ouvré, c'est une journée et demie promise chaque jour. Au moins une projection est alors fausse, et on ne le découvre qu'en retard.

Ce chantier montre tous les projets d'un coup d'œil, et la charge promise au total face à une journée de travail.

## Connaître ses projets

Un registre personnel, `~/.solopilot/projects.json`, liste les dossiers de pilotage de la machine. `solopilot init` et `solopilot install` y inscrivent le dossier. Un dossier disparu est signalé puis ignoré, et `solopilot projects --forget <dossier>` le retire. Le registre ne contient que des chemins, jamais le contenu des plans, et il ne quitte pas la machine.

## La vue d'ensemble

`solopilot projects` affiche :

- **une ligne par projet** : nom, client, phase (en planification, ou convenu), date cible, fin projetée du cœur et marge, et ce qui demande une action (réponses à relancer, jamais posées, périmètre qui a grossi au-delà du seuil) ;
- **la charge promise semaine par semaine**, jusqu'à la fin du dernier projet. Chaque projet compte pour sa part de journée, de son démarrage à sa fin projetée, et un projet entièrement livré ne compte plus. Les semaines au-delà d'une journée sont signalées : « Du 19 octobre au 13 novembre : 1,25 jour promis par jour ouvré. Au moins une projection ne tiendra pas. »

## Alerter avant qu'il soit trop tard

- **Au démarrage d'un projet.** Avant la première étape du premier plan, le skill lance `solopilot projects`. Si la part de journée du nouveau projet fait dépasser une journée pendant sa durée, il le dit, et propose d'ajuster la part, la date cible ou les autres projets.
- **Au quotidien.** `status` ajoute une ligne quand la charge totale dépasse une journée pendant la durée du projet. Le point de fin de session la signale.

## Décisions prises (2026-10-11)

1. **Le registre.** *Recommandé : `~/.solopilot/projects.json`, rempli par `init` et `install`, avec `--forget` pour retirer un projet.* L'alternative est de chercher les dossiers de pilotage sous un dossier parent, ce qui suppose qu'ils soient tous rangés au même endroit.
2. **Le calcul de la charge.** *Recommandé : la somme des parts de journée des projets actifs, semaine par semaine, chacun de son démarrage à sa fin projetée.* Un projet entièrement livré sort du calcul.
3. **Où alerter.** *Recommandé : au démarrage d'un projet, dans le skill, et au quotidien, dans `status`.*
4. **Une page de portefeuille.** *Recommandé : pas dans cette version.* La vue du terminal d'abord ; une page à publier pour la direction pourra suivre si le besoin se confirme.

## Comment on le teste

- Tests unitaires : le registre (inscription, dossier disparu, `--forget`) ; la charge semaine par semaine sur des projets fabriqués qui se chevauchent ; un projet livré qui sort du calcul ; la ligne de `status` en cas de surcharge.
- Scénario de bout en bout : un second projet fictif existe déjà, et la planification de Kerlan signale la surcharge au moment de fixer sa part de journée.
