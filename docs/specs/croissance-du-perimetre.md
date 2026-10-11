# Spécification : afficher la croissance du périmètre

Statut : validée le 2026-10-11, en cours de réalisation. Chantier 4 de l'[état des lieux](../etat-des-lieux.md).

## Objectif

Quand rien n'est figé à la signature, chaque atelier ajoute du travail, et le plan grossit en silence. Ce chantier dit en une ligne de combien le périmètre a bougé depuis l'accord, et pourquoi.

## La référence

- **L'accord du client**, s'il existe : l'état du plan au tag `scope-agreed-<date>`.
- **Sinon, le plan convenu en interne** : l'état du plan au tag `baseline`.
- **À défaut de tag** (dossier de pilotage sans git, plan tenu à la main) : le total de points enregistré dans `project.baseline`. Seul l'écart total est alors connu, pas son détail.

## Ce qui est mesuré

On compare les points du plan, sous la ligne exclue, entre la référence et aujourd'hui, tâche par tâche :

| Mouvement | Ce qu'il compte |
| --- | --- |
| Ajouté par une demande | Les tâches nouvelles qu'une demande acceptée a créées (`R01`, dans ses `tasks`) |
| Ajouté sans demande | Les autres tâches nouvelles : du travail découvert en route |
| Réestimé | L'écart de points des tâches qui existaient déjà |
| Retiré | Les tâches reportées (`deferred`) ou passées sous la ligne depuis l'accord |

Le solde net, en points et en pourcentage de la référence, résume le tout.

## Où il s'affiche

- **`status`** : « Périmètre depuis l'accord du client (20 octobre) : +12 points (+11 %). +8 par les demandes R01 et R03, +6 ajoutés sans demande, −2 retirés. »
- **Le tableau de bord** : une ligne dans l'explication du plan. Un risque est levé au-delà de +10 % net, élevé au-delà de +25 %.
- **Le digest Slack** : la ligne du périmètre, seulement les jours où le plan a changé (une replanification au journal ce jour-là), pour ne pas répéter le même chiffre chaque jour.
- **Le skill**, au tri d'une demande, chiffre ce qu'elle ajouterait au solde avant que le développeur décide.

Rien de tout cela n'apparaît dans le document de périmètre envoyé au client.

## Décisions prises (2026-10-11)

1. **Ce qui est compté.** *Recommandé : les points du plan hors « sous la ligne », avec le détail par mouvement.*
2. **Les seuils du risque.** *Recommandé : +10 % net pour un risque moyen, +25 % pour un risque élevé.* Ce qui a été compensé (retiré, passé sous la ligne) se déduit avant de comparer.
3. **Le digest.** *Recommandé : seulement les jours où le plan a changé.*

## Comment on le teste

- Tests unitaires : le détail par mouvement sur une référence et un plan fabriqués ; le solde ; le repli sur `project.baseline` sans tag ; les seuils du risque ; rien dans le document client.
- Scénario de bout en bout : sur Kerlan, après l'accord du client, une demande acceptée fait apparaître la croissance, attribuée à la demande.
