# Spécification : une Vue Kanban qui se lit sur un vrai projet

Statut : brouillon du 2026-10-18, à valider. Fait suite à [la Vue Kanban](board.md). Une fois validé, il sera traduit en anglais et fondu dans `board.md`.

## Le problème

Sur la démo Fieldbook (40 tâches), la Vue Kanban se lit. Sur le premier vrai projet suivi avec solopilot (187 tâches en trois sprints), elle devient un très long défilement :

- **La hauteur d'une ligne de sprint est celle de sa plus longue colonne**, et c'est toujours « À faire » : 44 cartes dans le sprint en cours, 69 dans le suivant.
- **Chaque carte porte tout son détail**, sur trois rangs : le numéro et les points, le titre, puis le domaine, le jour et les vues. Dans un quart de la largeur, un vrai titre d'une centaine de caractères prend trois ou quatre lignes.
- **À côté, « En cours » et « Bloqué » tiennent en une ou deux cartes.** On voit trois colonnes presque vides le long d'une colonne de plusieurs milliers de pixels.

« Fait » avait le même défaut. Il a été réglé dès la première version : la colonne ne montre que ses cinq cartes les plus récentes. « À faire » n'a pas eu ce traitement.

## Ce qui change

Deux changements, essayés sur une maquette de la démo Fieldbook avant d'écrire cette note. Sur un écran de 1 024 px, le sprint 2 de la démo passe de 2 369 à 620 px de haut, et la page entière de 3 260 à 1 359 px.

### 1. « À faire » rangé par jour du plan

Dans la colonne « À faire », les cartes se regroupent sous leur jour du plan (« J7 », « J8 », etc.), dans l'ordre du plan.

- **Les deux premiers jours sont ouverts** : ce sont les deux prochains jours qui ont encore des tâches à faire. Comme le jour en cours est le premier jour non terminé, aucun jour qui le précède n'a de tâche à faire : les deux premiers jours de la colonne sont toujours les prochains.
- **Le jour en cours a son titre en couleur d'accent**, comme sa ligne de sprint.
- **Les autres jours se replient en une ligne**, par exemple « J11 · 3 tâches · 8 pts ». Les points n'y figurent que si le plan estime chaque tâche. Un clic déplie le jour.
- **Chaque ligne ouverte a ses deux jours ouverts.** Un sprint ouvert parce qu'il a du travail en cours montre donc où ce travail mène.
- **Ce que le lecteur ouvre ou replie le reste** tant que la page est ouverte, même s'il filtre ou change de langue. Au rechargement, on revient au défaut.
- **Pendant un filtre** (domaine, réponse attendue, recherche), tous les jours qui gardent une carte sont ouverts : quand on cherche une tâche, on doit la voir.
- **La ligne « Sous la ligne » n'a pas de jours.** Ses cartes restent en une seule liste, dans l'ordre du plan.

Les autres colonnes gardent leur ordre. « En cours » et « Bloqué » ont peu de cartes, et « Fait » garde ses cinq plus récentes.

### 2. Des cartes compactes

Dans toutes les colonnes, une carte tient en deux rangs au lieu de trois :

- **En haut**, le numéro puis le titre, sur deux lignes au plus. Un titre plus long se termine par « … » et se lit en entier au survol.
- **En bas**, sur un rang : la marque du cœur, le domaine, le jour, les vues d'un écran, la date de fin d'une tâche faite, le badge « Attend Q03 », et les points calés à droite.
- **Le jour n'est pas répété** sur une carte rangée sous son jour dans « À faire ».
- **La note d'une tâche bloquée reste en entier** : elle dit pourquoi la tâche est bloquée, et c'est ce qu'on vient lire.

Sur un téléphone, la colonne prend toute la largeur et le titre n'est pas coupé.

Un titre coupé reste en entier dans la page : un lecteur d'écran le lit et la recherche le trouve.

## Où c'est calculé

Le regroupement par jour se calcule dans `src/board.mjs`, avec le reste du tableau, et se teste sans navigateur. En plus de ses colonnes, chaque ligne reçoit la liste des jours de « À faire ». Pour chaque jour : le jour, ses tâches dans l'ordre du plan, la somme de leurs points quand le plan estime chaque tâche, et s'il est ouvert par défaut. La page dessine ces jours et ne retient que ce que le lecteur a ouvert ou replié.

## Ce qui ne change pas

- Les colonnes, les lignes de sprint, les lignes ouvertes par défaut et les filtres.
- La lecture seule : une carte ne se déplace pas.
- Le format du plan : aucune clé nouvelle.
- Le document de périmètre pour le client et le terminal.

## Décisions

1. **Deux jours ouverts.** Un jour du plan compte en général trois à six tâches. Deux jours correspondent au travail des deux prochaines séances, ce que l'on cherche en ouvrant la page. Un seul jour cacherait la suite immédiate, et trois rallongeraient la colonne sur un gros projet.
2. **Seule « À faire » est rangée par jour.** « En cours » et « Bloqué » restent courtes. « Fait » se lit du plus récent au plus ancien, ce qu'un rangement par jour casserait.
3. **Les cartes compactes partout.** Une même carte doit se lire de la même façon dans chaque colonne.
4. **Les options écartées :**
   - *Une hauteur maximale par colonne, avec son propre défilement* : cela fait un défilement dans le défilement, cache du contenu à l'impression et en PDF, et se manie mal au doigt.
   - *Des lignes par jour au lieu de par sprint* : cela referait l'onglet « Jour par jour » de la page Pilotage.
   - *Un réglage « compact / détaillé »* : un réglage de plus, alors qu'il n'y a qu'une bonne réponse, et les cartes compactes gardent toute l'information.

## Comment c'est testé

- **Tests unitaires** (`test/board.test.mjs`) :
  - les jours de « À faire » suivent l'ordre du plan ;
  - les deux premiers jours sont ouverts et les suivants repliés ;
  - la somme des points par jour est donnée, et absente quand le plan n'estime pas chaque tâche ;
  - la ligne « Sous la ligne » n'a pas de jours ;
  - une ligne sans tâche à faire n'a pas de jours.
- **Les deux langues** : les nouveaux textes existent en anglais et en français, comme le vérifie déjà le test des locales.
- **Sur la démo Fieldbook**, en anglais et en français, au 21 octobre :
  - le sprint 2 est ouvert, avec J7 et J8 ouverts dans « À faire » et J9 à J14 repliés ;
  - les cartes sont compactes dans les quatre colonnes ;
  - ouvrir un jour, filtrer et changer de langue fonctionnent ;
  - dans Chromium, sur ordinateur et sur téléphone, il n'y a ni erreur de script ni défilement horizontal.

  Les captures de la Vue Kanban dans les README sont refaites.
