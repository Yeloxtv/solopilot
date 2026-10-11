# Spécification : confronter le plan à la réalité

Statut : validée le 2026-10-11, puis révisée le même jour : la mesure des heures est abandonnée. Chantier 3 de l'[état des lieux](../etat-des-lieux.md).

## Objectif

Le plan ne rencontrait jamais la réalité : la projection suivait l'estimation indéfiniment. Ce chantier compare le rythme réel à l'estimation, et alerte quand l'écart dure.

## Le rythme réel

- **Ce qu'il mesure** : les points livrés par jour de charge déclarée, c'est-à-dire la somme des `effort` des sessions, que le développeur donne en part de journée. L'estimation du plan, c'est `points_per_day`.
- **Quand il compte** : après au moins 5 sessions et 15 % du plan livré. Avant, les premiers jours ne disent rien.
- **Où il s'affiche** : une ligne dans `status`, avec la date où le cœur finirait à ce rythme. Par exemple : « Rythme réel : 4,1 points par jour de travail, pour 6,3 estimés (35 % de moins). À ce rythme, cœur le 2 décembre. »
- **Le risque** : sous 80 % de l'estimation, le tableau de bord lève un risque, élevé sous 60 %.
- **La projection officielle reste sur l'estimation du plan.** Recalibrer `points_per_day`, ou réduire le périmètre, reste la décision du développeur, inscrite au journal comme une replanification. Le skill le propose quand le risque apparaît.

## Pourquoi solopilot ne mesure pas les heures

Une première version mesurait le temps à partir des journaux de Claude Code : l'attention du développeur (le délai avant chacun de ses messages, plafonné quand il s'absentait), le temps de l'agent, et l'amplitude de la journée. Elle proposait la charge de chaque session à partir de l'attention.

Elle a été retirée avant d'être livrée, pour trois raisons :

- **Elle ne voit qu'un plancher.** Le code écrit à la main, les réunions, les appels et la réflexion lui échappent.
- **Un nombre d'heures se lit toujours comme du temps travaillé.** Un employeur qui lit « 1,2 h d'attention » comprend « mon développeur a travaillé une heure ». C'est faux, et l'outil doit protéger le développeur, pas le surveiller.
- **Elle fausse le reste.** Une charge proposée à partir d'un plancher est sous-estimée, et le rythme réel paraît alors meilleur qu'il n'est.

La charge reste donc déclarée par le développeur, en part de journée. Apprendre ce que coûte chaque type de tâche se fera dans la même unité : les jours de charge écoulés entre le début et la fin de chaque tâche, d'après les commits.

## Changements de l'outil

- Le calcul ajoute le rythme réel, la date au rythme réel et le risque. `status` et le tableau de bord les affichent.
- Le skill signale le risque au point de fin de session, et propose de recalibrer ou de réduire le périmètre, sur décision écrite du développeur.

## Comment on le teste

- Tests unitaires : le rythme réel n'est pas jugé avant 5 sessions et 15 % du plan ; il l'est ensuite ; le risque se lève sous 80 % ; la date au rythme réel tombe après la date estimée quand le rythme est plus lent.
- Le scénario de bout en bout `daily` continue de passer.
