# Spécification : le tableau des tâches par sprint

Statut : brouillon à valider. Premier retour de l'usage réel, après la [sortie publique](public-release.md) ; voir la [roadmap](../roadmap.md), section « Next ».

## Objectif

Les outils de gestion de projet ont tous une vue que solopilot n'a pas : un tableau où chaque tâche est une carte, rangée dans sa colonne (à faire, en cours, fait). On y voit d'un coup d'œil où en est un sprint, sans ouvrir les jours un par un.

Le tableau de bord montre aujourd'hui les tâches de deux façons : jour par jour, où il faut déplier chaque jour, et par domaine, en liste. Aucune ne répond vite à la question que se pose le développeur en ouvrant sa journée, ou le PO en ouvrant la page : *dans ce sprint, qu'est-ce qui est fait, qu'est-ce qui avance, qu'est-ce qui reste, et qu'est-ce qui coince ?*

Ce chantier ajoute un onglet **Tableau** au tableau de bord : les tâches en cartes, en colonnes par statut, une rangée par sprint.

## Pourquoi pas un outil existant

Brancher solopilot sur un outil open source (Taiga, Plane, Kanboard, Wekan, Focalboard) a été écarté :

- **Deux sources de vérité.** Le plan vit dans `solopilot.yaml`. Un outil externe obligerait à synchroniser dans les deux sens les tâches, leurs statuts, leurs jours et les sprints. C'est cette synchronisation qui coûte et qui casse, pas l'affichage.
- **Un serveur et des comptes.** solopilot est petit et local : pas de serveur, pas de compte, les données restent sur la machine.
- **Le statut ne se déplace pas à la main.** Une tâche passe à `done` sur la preuve d'un commit et de tests verts, après validation du développeur. Un glisser-déposer dans un autre outil contournerait la règle.
- **L'outil ne saurait rien du reste.** Ni la projection, ni le cœur, ni les points, ni les questions qui bloquent une tâche.

Le tableau de bord porte déjà toutes les données nécessaires. Le tableau n'est qu'une vue de plus.

## Le tableau

### Les colonnes

Quatre colonnes, dans cet ordre :

| Colonne | Statuts |
| --- | --- |
| À faire | `todo` |
| En cours | `doing` |
| Bloqué | `blocked` |
| Fait | `done` |

Les tâches reportées (`deferred`) sortent des colonnes, comme elles sortent du décompte : une ligne repliée sous la rangée, « 2 tâches reportées », les montre avec leur note.

Une colonne vide reste affichée, avec un trait : « Bloqué » vide est une information.

### Les rangées

Une rangée par sprint, dans l'ordre des sprints, avec son numéro, son titre, ses jours de plan et sa progression (points livrés sur points prévus, comme ailleurs dans le tableau de bord). Puis une dernière rangée pour ce qui est sous la ligne (`day: later`), quand il y en a.

- **Le sprint en cours est ouvert**, et le premier à l'écran.
- **Les sprints passés et livrés sont repliés** : leur en-tête suffit, « Sprint 1 · API · 14/14 tâches, livré ». Un sprint passé qui n'est pas livré reste ouvert : ce qui traîne doit se voir.
- **Les sprints à venir sont repliés**, et se déplient d'un clic.

Un plan sans sprints a une seule rangée, le plan entier, puis celle de ce qui est sous la ligne.

Un sprint couvre des jours de plan ; une tâche appartient au sprint de son jour. Une tâche dont le jour n'est dans aucun sprint va dans une rangée « Hors sprint », placée selon son jour.

### Les cartes

Chaque carte porte :

- l'id et le titre ;
- le domaine, et les points quand le plan estime chaque tâche ;
- pour un écran, le nombre de vues ;
- le jour de plan ;
- pour une tâche faite, le jour où elle l'a été (`done_on`) ;
- pour une tâche bloquée, sa note ;
- le badge « Attend Q03 » quand une question ou une dépendance ouverte la bloque, avec la même couleur d'urgence que dans l'onglet « Jour par jour ». Une tâche à faire qui attend une réponse reste dans « À faire » : c'est le badge qui alerte, pas la colonne.

Dans une colonne, les cartes suivent l'ordre du plan : par jour, puis tâches avant écrans, puis par id. Dans « Fait », les plus récentes en haut.

Les tâches du cœur portent une marque discrète, pour distinguer l'engagement du reste.

### Les filtres

Au-dessus du tableau :

- **les sprints**, avec les puces déjà utilisées par « Jour par jour » : tous, un sprint, sous la ligne ;
- **les domaines**, en liste déroulante ;
- **« Attend une réponse »**, pour ne garder que les tâches bloquées par une question ou une dépendance ouverte ;
- la recherche par id ou par titre, comme dans « Backlog par domaine ».

### En lecture seule

Le tableau ne modifie rien. Une carte ne se déplace pas d'une colonne à l'autre : le statut change par `/solopilot`, à partir des commits, après validation. Le tableau de bord est un fichier généré et publié ; il n'a de toute façon aucun moyen d'écrire le plan.

### Sur téléphone

Les quatre colonnes tiennent côte à côte à partir d'une largeur de tablette. En dessous, elles s'empilent : chaque colonne devient une section repliable, « En cours » et « Bloqué » ouvertes. La page ne défile jamais en largeur.

## Où les données sont calculées

La répartition des tâches (quel sprint, quelle colonne, quel ordre, quelles rangées repliées par défaut) est calculée dans `src/`, avec le reste de la projection, et passée à la page comme le reste. La page ne fait que l'afficher. La logique est ainsi testée comme le reste du calcul, sans navigateur.

## Ce qui ne change pas

- **Le document de périmètre du client.** Le tableau montre l'avancement interne ; il ne va pas au client.
- **Le terminal.** `solopilot status` reste un résumé. Pas de tableau dans le terminal dans cette version.
- **Le format du plan.** Aucune clé nouvelle : le tableau se lit dans les tâches, leurs jours et les sprints existants.

## Décisions à prendre

1. **L'outil.** *Recommandé : une vue du tableau de bord, construite dans solopilot.* L'alternative, un outil open source synchronisé avec le plan, coûte une synchronisation dans les deux sens, un serveur et des comptes.
2. **Les colonnes.** *Recommandé : quatre, À faire, En cours, Bloqué, Fait.* L'alternative est trois colonnes, avec « Bloqué » en badge sur la carte, ce qui cache ce qui coince dans « À faire » ou « En cours ».
3. **Une tâche qui attend une réponse.** *Recommandé : elle reste dans sa colonne, avec le badge « Attend Q03 ».* Seul le statut `blocked`, posé par le développeur avec sa note, la met dans « Bloqué ».
4. **Les rangées ouvertes.** *Recommandé : le sprint en cours, et les sprints passés non livrés.* Les autres sont repliés.
5. **Le déplacement des cartes.** *Recommandé : aucun, le tableau est en lecture seule.*
6. **L'onglet par défaut.** *Recommandé : « Réponses attendues » reste l'onglet d'ouverture, et le tableau devient le deuxième onglet.* Un lien vers `…#board` ouvre directement le tableau, pour le partager. L'alternative est d'ouvrir sur le tableau.
7. **Le nom de l'onglet.** *Recommandé : « Tableau » en français, « Board » en anglais.* « Kanban » est plus parlant pour un développeur, moins pour un PO.

## Comment on le teste

- **Tests unitaires** sur la répartition, avec des plans fabriqués : chaque statut dans sa colonne ; les tâches reportées à part ; une tâche par sprint selon son jour ; un plan sans sprints en une seule rangée ; une tâche hors de tout sprint ; la rangée « sous la ligne » ; l'ordre dans une colonne, et « Fait » du plus récent au plus ancien ; les rangées ouvertes par défaut (sprint en cours, sprint passé non livré) et repliées (sprint livré, sprints à venir) ; une tâche à faire qui attend une question ouverte reste à faire, avec son badge.
- **Les deux langues** : les nouveaux libellés existent en anglais et en français, comme le vérifie déjà le test des locales.
- **Sur la démo Fieldbook**, en anglais et en français, au 21 octobre : le sprint 1 passé mais ouvert, parce qu'une tâche y reste bloquée ; le sprint 2 ouvert avec sa tâche en cours et celles qui attendent une réponse ; le sprint 3 et ce qui est sous la ligne repliés. Vérifié à l'œil, puis capturé pour le README, sur ordinateur et sur téléphone.
- **Publié sur une page claude.ai** : le tableau s'affiche dans la page publiée comme dans `build/index.html`.
