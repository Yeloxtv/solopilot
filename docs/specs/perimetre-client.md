# Spécification : faire valider le périmètre par le client

Statut : validée le 2026-10-11, en cours de réalisation. Chantier 2 de l'[état des lieux](../etat-des-lieux.md).

## Objectif

Le devis achète « l'application », pas une liste de fonctionnalités. solopilot tire du plan un document de périmètre que le client valide par écrit. L'accord est enregistré, et devient la référence à laquelle se mesure ensuite toute demande d'ajout.

## Le document de périmètre

Généré à partir de `solopilot.yaml`, dans la langue du projet, sans aucun retard, marge ni date projetée interne. Il contient :

| Section | Ce qu'elle reprend du plan |
| --- | --- |
| L'objectif | `goal` et la date cible |
| Garanti pour la date | Les fonctionnalités du cœur, par domaine, chacune avec sa source dans le cahier des charges |
| Prévu ensuite, dans le budget | Les autres fonctionnalités du plan |
| Non prévu à ce stade | Ce qui est sous la ligne : réalisable seulement s'il reste du temps, sans engagement |
| Hors périmètre | Les exclusions (`scope: out`), avec la raison |
| Ce que nous attendons de vous | Les dépendances : qui, quoi, et vers quelle date c'est nécessaire |
| Les questions à trancher | Les questions ouvertes : qui répond, ce que ça débloque, pour quand |
| Les demandes en attente | Les demandes pas encore arbitrées, à chiffrer à part |
| L'accord | Nom, date, signature, ou un simple « bon pour accord » par e-mail |

Citer la source de chaque fonctionnalité montre au client que son cahier des charges est couvert point par point, et ce qui n'y figurait pas.

## Le déroulé

1. Le plan est convenu en interne : `solopilot baseline`, comme aujourd'hui.
2. `solopilot scope` génère le document. Le skill propose le message d'envoi.
3. Le client répond. S'il demande des changements, c'est une replanification (le mode 4 du skill), puis un nouveau document.
4. Quand il valide, `solopilot scope --agreed-by "Nom" --on AAAA-MM-JJ` enregistre l'accord.

Le plan convenu en interne permet de démarrer le développement sans attendre le client. L'accord du client, lui, devient la référence du périmètre.

## Changements de l'outil

- `solopilot scope` écrit `build/scope.html`, une page claire faite pour être imprimée en PDF, et `build/scope.md`, le même contenu en texte, à coller dans un e-mail.
- `solopilot scope --agreed-by <nom> [--on <date>]` écrit `project.scope_agreed: { by, date }`, ajoute une entrée `agreed` au journal, committe et pose le tag git `scope-agreed-<date>` dans le dossier de pilotage. Le fichier tagué garde l'état exact du périmètre validé : la croissance du périmètre (chantier 4) s'y mesurera.
- Le tableau de bord mentionne l'accord : « Périmètre validé par Mme Le Goff le 20 octobre ».
- Le skill, à l'étape 6 du premier plan, enchaîne `baseline` puis `scope`, et propose le message au client. Quand le développeur annonce l'accord du client, il l'enregistre.

## Décisions prises (2026-10-11)

1. **La forme du document.** *Recommandé : page imprimable en PDF et texte pour l'e-mail, générés par la ligne de commande.* Le contenu est le même à chaque fois, et rien d'interne ne peut s'y glisser. Les alternatives : une page publiée sur claude.ai, que le client ne peut pas forcément ouvrir, ou un texte rédigé par Claude à chaque fois, moins sûr.
2. **Le moment de la validation.** *Recommandé : plan convenu en interne d'abord, accord du client ensuite, enregistré à part.* L'alternative est d'attendre l'accord du client pour clore la planification, ce qui bloquerait le démarrage.
3. **Ce qui fait foi.** *Recommandé : l'accord du client devient la référence du périmètre dès qu'il existe, le plan convenu en interne sinon.*
4. **Le contenu.** *Recommandé : les neuf sections ci-dessus, sources comprises.*

## Comment on le teste

- Tests unitaires : le document ne contient ni marge, ni retard, ni date projetée ; chaque catégorie reprend les bonnes fonctionnalités ; l'accord écrit `scope_agreed`, l'entrée de journal et le tag.
- Scénario de bout en bout : à la fin de la planification de Kerlan, le skill génère le document et propose le message ; puis « le client a validé, c'est Mme Le Goff, le 20 octobre » enregistre l'accord.
