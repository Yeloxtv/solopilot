# Vision produit

## Pourquoi solopilot existe

solopilot est né dans une petite agence où son auteur est le seul développeur. Il n'y a ni chef de projet, ni PO technique.

Un projet démarre toujours de la même façon. Il y a un cahier des charges qui décrit ce que l'application doit faire, et quelques ateliers UX et UI. Ensuite, le développeur se débrouille. Le client signe un devis pour « le développement de l'application », mais personne ne s'est mis d'accord sur une liste de fonctionnalités. Ce que le développeur reçoit vraiment tient en une phrase : *on veut cette application, et elle sort tel jour.*

Mené ainsi, un projet va presque à coup sûr dans le mur. La date est fixe, le périmètre ne l'est pas, et personne n'est chargé de concilier les deux. Les problèmes apparaissent tard : une fonctionnalité ne peut pas être développée parce que le client n'a jamais dit comment elle devait marcher, le plan a grossi en silence après chaque atelier, et le retard se découvre la semaine de la mise en production.

Ce n'est pas propre aux petites structures. Les projets web se vendent de moins en moins cher, et l'IA pousse à livrer toujours plus vite. Le pilotage est le premier poste sacrifié : il n'y a plus le budget pour qu'une personne passe des heures à tenir un planning, relancer le client et rédiger des points d'avancement. C'est pourtant sans pilotage que les projets dérapent.

solopilot fait du pilotage un sous-produit du développement. Le plan se met à jour à partir du travail réellement fait, et celui qui suit le projet n'a qu'à ouvrir le tableau de bord pour savoir où il en est.

## Pour qui

**Ceux qui livrent.** Les développeurs qui construisent seuls des applications web pour des clients, avec une date fixe, un budget serré et un périmètre encore ouvert, en agence ou en freelance, sans personne pour planifier et arbitrer à leur place.

**Ceux qui suivent.** Côté agence : le PO, le chef de projet ou la direction, qui doivent savoir où en est le projet sans organiser de réunion ni attendre un point écrit.

solopilot intervient une fois le projet lancé : le devis est signé, le budget et la date sont fixés.

Plusieurs développeurs sur un même projet, c'est une piste pour une V2. solopilot ne s'adresse pas non plus au travail facturé à l'heure, ni aux produits sans date de livraison.

## Ce qu'il doit faire

### 1. Transformer un cahier des charges en plan daté

Partir des documents du projet (cahier des charges, notes d'ateliers, maquettes s'il y en a) pour lister toutes les fonctionnalités dont l'application a besoin, et en déduire les écrans et leurs vues. Estimer chaque tâche, et répartir le tout sur des jours de plan, regroupés en sprints, en partant de la date de mise en production.

L'estimation ne sert pas à chiffrer, puisque le budget est déjà signé : elle sert à décider. Elle sépare le **cœur**, le minimum qui doit sortir à la date, du reste, et place explicitement **sous la ligne** ce qui ne tiendra pas. Quand le budget ou le délai est tendu, c'est elle qui trace la ligne : on sécurise d'abord le cœur, puis on construit le reste.

La question à laquelle répondre dès le premier jour : *avec ce budget, cette date, et le temps que je peux donner à ce projet, qu'est-ce que je peux promettre ?*

Ce travail se fait avec Claude, étape par étape, et le développeur valide chacune (voir « Le premier plan, pas à pas »).

### 2. Suivre l'avancement et le rythme réel

Savoir à tout moment où en est le projet par rapport au plan : ce qui est fait, l'avance ou le retard du cœur et de la totalité, et la date à laquelle chacun devrait se terminer. Comparer le rythme réel, les points livrés par jour de charge déclarée, à l'estimation du plan, et alerter quand l'écart dure.

### 3. Poser les questions bloquantes avant qu'elles bloquent

La plupart des retards ne sont pas des problèmes de développement. Ce sont des réponses qui manquent : une règle métier jamais tranchée, un contenu jamais livré, un serveur jamais ouvert. Chaque question qui bloquera une fonctionnalité doit être repérée tôt, rattachée au travail qui l'attend, et posée avant que ce travail commence, pas au moment où le développeur l'atteint et doit s'arrêter.

### 4. Rendre les risques visibles

Montrer clairement ce qui menace la date : un cœur projeté en retard, des réponses qui bloquent le travail en cours, un client qui doit la plupart des réponses attendues, des jours trop tendus, un périmètre qui ne cesse de grossir. Les risques doivent venir des données, pas de l'humeur de quelqu'un.

### 5. Donner l'état du projet à ceux qui le suivent

Le PO ou le chef de projet ouvre le tableau de bord et sait en une minute où en est le projet, ce qui bloque, et ce qu'on attend de qui. Pas de réunion de suivi, pas de point d'avancement à rédiger : le développeur ne perd pas de temps à raconter, et le PO n'en perd pas à demander.

### 6. Apprendre de chaque projet pour mieux estimer le suivant

Estimer un projet est devenu trop difficile : avec le code agentique, on va bien plus vite, mais personne ne sait encore de combien, ni sur quel type de travail. Plutôt que de deviner, solopilot accumule les données de chaque projet (ce qui était estimé, la charge réellement consommée) et s'en sert pour proposer de meilleures estimations au projet suivant (voir « Apprendre à estimer »).

## Principes

- **La date tient, le périmètre bouge.** Le cœur est l'engagement, la totalité est l'objectif, le reste passe sous la ligne. Chaque changement de périmètre a un coût visible.
- **Honnête par construction.** La projection suit l'estimation du plan et la part de chaque journée réellement donnée au projet, jamais le rythme des premiers jours. L'estimation, elle, s'améliore d'un projet à l'autre à partir de la charge que chaque type de tâche a réellement consommée, vitesse du code agentique comprise. Jours de travail et jours de calendrier ne sont jamais confondus.
- **Le pilotage se fait en travaillant.** Pas de feuille de temps, pas de chronomètre, pas de tickets à déplacer, pas de point d'avancement à rédiger. Claude Code lit le travail réellement fait (commits taggés, tests au vert), propose les mises à jour, et le développeur les valide.
- **Pas de surveillance.** solopilot ne mesure jamais les heures du développeur. Une mesure tirée de ses sessions ne verrait qu'un plancher de son travail, et un nombre d'heures se lit toujours comme du temps travaillé. La charge est déclarée, en part de journée.
- **Le développeur décide.** solopilot propose, mesure et alerte. Il n'accepte jamais une demande de changement, ne déplace jamais une échéance et ne recalibre jamais le plan de lui-même.
- **Le plan appartient à l'agence.** C'est un seul fichier texte versionné, gardé hors du dépôt du client. Retards et marges n'atteignent jamais le client.
- **Trois publics, trois niveaux de détail.** Le développeur tient le plan à jour sans effort. Le PO, côté agence, lit le tableau de bord avec toute la vérité interne : retards, marges, risques. Le client ne voit que les fonctionnalités livrées, les jalons, et ce qu'on attend de lui.
- **Petit et local.** Un outil en ligne de commande, une dépendance, pas de serveur, pas de compte. Les données restent sur la machine du développeur.

## Où en est solopilot aujourd'hui

L'état détaillé, besoin par besoin, et la feuille de route des chantiers sont dans l'[état des lieux](etat-des-lieux.md).

## Le premier plan, pas à pas

C'est le travail qui demande le plus de temps au démarrage, et celui qui décide de la suite. Il se fait avec Claude, en six étapes. Claude rédige, et le développeur corrige et valide chaque étape avant de passer à la suivante.

**Entrées.** Le ou les cahiers des charges, les notes des ateliers, le devis (le nombre de jours vendus), la date de mise en production, la part de chaque journée que le développeur peut donner au projet, et les maquettes si elles existent.

1. **Les fonctionnalités.** L'inventaire complet de ce que l'application doit faire, regroupé par domaines. Chaque fonctionnalité renvoie à l'endroit du cahier des charges d'où elle vient : quand le client demande un ajout, on sait s'il était prévu. Ce que le cahier des charges laisse dans le flou devient une question.
2. **Les écrans et leurs vues.** Les écrans dont l'application a besoin pour porter ces fonctionnalités, et pour chacun ses vues : par défaut, vide, chargement, erreur, variantes. À ce stade, les maquettes n'existent généralement pas : l'inventaire se déduit du cahier des charges. S'il y en a, Claude les lit, rattache chaque écran dessiné à son entrée, et signale les écrans et les vues qui restent à dessiner.
3. **Les questions.** Pour chaque fonctionnalité et chaque écran, ce qui manque pour le développer : une règle métier, un contenu, un accès, une décision. Chaque question nomme qui doit répondre et le travail qui l'attend.
4. **Les tâches et leur estimation.** Chaque fonctionnalité se découpe en tâches (back, front, intégration), chaque écran devient une tâche avec son nombre de vues, et chaque tâche reçoit ses points de charge, proposés à partir de l'historique du développeur quand il existe.
5. **Le plan daté.** Les tâches se répartissent sur des jours de plan et des sprints, en commençant par ce qui lève le plus d'incertitude : un parcours de bout en bout avant d'aller en largeur. Les jalons (démonstrations, recettes, mise en production) se posent, et chaque question reçoit le jour avant lequel il faut sa réponse.
6. **Ce qu'on peut promettre.** Face à la date et aux jours vendus : ce que couvre le cœur, ce qui tient en plus, ce qui passe sous la ligne, et les questions à poser tout de suite. Si tout ne tient pas, le cœur passe en premier, et le reste se construit ensuite, dans l'ordre de valeur.

Une fois validé, ce premier plan devient le **plan convenu** : la référence à partir de laquelle on mesure ensuite la croissance du périmètre.

## Apprendre à estimer

Personne ne sait encore bien estimer le développement avec un agent. Les repères d'hier, construits en codant à la main, surestiment une partie du travail, celle que l'agent écrit vite, et en sous-estiment une autre : relire, tester, corriger ce qu'il a produit. Plutôt que de deviner, solopilot apprend.

À chaque tâche terminée, il garde ce qui était estimé (les points), la charge réellement consommée et le type de tâche : écran et nombre de vues, logique métier, intégration d'un service tiers, mise en production. La charge se rattache aux tâches par les commits : les jours de charge déclarés entre le premier et le dernier commit d'une tâche lui reviennent, partagés avec les tâches menées en même temps. Ces données s'accumulent d'un projet à l'autre dans un historique local, propre au développeur, jamais dans le dépôt du client.

Au projet suivant, l'estimation du premier plan part de cet historique : ce que vaut, pour ce développeur, un écran de cinq vues ou une intégration de paiement, et combien de jours de charge coûte réellement un point. Au premier projet, sans historique, l'estimation part d'hypothèses écrites, que les premières données viendront corriger.

En cours de projet, le rythme réel peut conduire à recalibrer le plan, mais seulement sur décision du développeur, et jamais sur la foi des premiers jours.

## Hors périmètre

- Chiffrer un devis : solopilot intervient une fois le projet signé.
- Le suivi des heures, saisies ou mesurées : feuilles de temps, chronomètres, mesure de l'activité.
- Les fonctions d'équipe (attribution des tâches, charge par personne), jusqu'à une éventuelle V2.
- Remplacer la roadmap contractuelle montrée au client. solopilot est le plan vivant qui se tient derrière.
- Un service hébergé.

## Questions ouvertes

- **Démarrer sans historique.** Au premier projet, sur quelles hypothèses Claude propose-t-il les points, et comment les rendre explicites pour que les données les corrigent ?
- **Où publier le tableau de bord.** Une page que le PO ouvre sans compte particulier, toujours à jour après chaque point.
- **Plusieurs projets à la fois.** Chaque projet a son propre plan. solopilot doit-il aussi les montrer tous ensemble, et alerter quand le temps promis sur l'ensemble des projets dépasse une journée de travail ?
- **Sans Claude Code.** Quelle utilité doit avoir l'outil en ligne de commande seul ?
