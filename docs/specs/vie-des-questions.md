# Spécification : suivre la vie des questions

Statut : validée le 2026-10-11, en cours de réalisation. Chantier 5 de l'[état des lieux](../etat-des-lieux.md).

## Objectif

Le passage au crible du premier plan trouve les questions, et leurs échéances suivent le travail. Mais deux choses échappent encore à l'outil :

- une question n'est pas forcément **posée** : rien ne dit si elle est partie chez le client, ni depuis quand elle attend ;
- les questions naissent aussi **pendant le développement**, au moment où l'on s'approche d'une fonctionnalité.

Ce chantier suit chaque question de sa pose à sa réponse, propose les relances, et cherche les questions qui manquent avant que le travail les atteigne.

## Posée, en attente, à relancer

Deux dates, sur les questions comme sur les dépendances :

| Champ | Sens |
| --- | --- |
| `asked_on` | Le jour où elle a été posée au client, ou demandée |
| `reminded_on` | Le jour de la dernière relance |

Ce qui en découle :

- **En attente depuis** : les jours ouvrés depuis `asked_on`.
- **À relancer** : sans réponse 5 jours ouvrés après la pose ou la dernière relance.
- **Jamais posée** : une réponse nécessaire dans les deux semaines, ou maintenant, qui n'a pas de `asked_on`. C'est le cas le plus coûteux : la question existe dans le plan, mais personne ne l'a envoyée.

## Où ça s'affiche

- **`status`** : dans « À surveiller », chaque réponse dit si elle est posée et depuis quand (« posée le 12 octobre, 7 j ») ou si elle ne l'est pas. Une ligne liste les relances à faire, par interlocuteur.
- **Le tableau de bord** : chaque réponse porte son état (posée depuis, à relancer, jamais posée). Un risque est levé quand des réponses nécessaires dans les deux semaines n'ont jamais été posées, élevé si l'une est nécessaire maintenant.
- **Le digest Slack** : la liste des relances à faire, par interlocuteur, quand il y en a.

## Le skill

- **Quand le développeur dit avoir envoyé des questions**, par exemple avec le document de périmètre ou un e-mail, le skill note `asked_on` sur celles-là.
- **Pour une relance**, il rédige le message au client, groupé par interlocuteur, sans retard ni marge interne. Une fois que le développeur l'a envoyé, il note `reminded_on`.
- **À chaque point de fin de session**, il passe au crible les tâches des trois prochains jours du plan. Pour chacune, il se demande ce qui manque encore pour la construire : une règle métier, un contenu, une donnée, un accès, une décision. Il propose les nouvelles questions ou dépendances, rattachées à leurs tâches, avec leur `before`.

## Décisions prises (2026-10-11)

1. **Les champs.** *Recommandé : `asked_on` et `reminded_on`, sur les questions comme sur les dépendances.*
2. **Le délai de relance.** *Recommandé : 5 jours ouvrés après la pose ou la dernière relance, réglable par `project.chase_after`.*
3. **Le risque des questions jamais posées.** *Recommandé : levé pour les réponses nécessaires dans les deux semaines, élevé si l'une est nécessaire maintenant.*
4. **Le passage au crible en cours de route.** *Recommandé : les tâches des trois prochains jours du plan, à chaque point de fin de session.*

## Comment on le teste

- Tests unitaires : l'attente en jours ouvrés, la relance due après 5 jours puis repoussée par `reminded_on`, les réponses jamais posées et le risque, la validation des dates.
- Scénario de bout en bout : sur Fieldbook, le point de fin de session signale les relances et propose une question nouvelle pour un jour proche ; puis « j'ai relancé le client pour Q03 » note `reminded_on`.
