# État des lieux et feuille de route

11 octobre 2026. Document de travail, à traduire une fois les chantiers menés. À lire avec la [vision produit](vision.md).

## Verdict

solopilot répond bien au cœur de la douleur : passer d'un cahier des charges flou à une liste de fonctionnalités, un plan daté et des questions posées à temps. Le test sur un projet fictif (un cahier des charges de sept pages) a produit 37 tâches, 23 écrans et 107 vues, 30 questions et dépendances avec leur responsable et leur échéance, et un plan de 15 jours en 4 sprints.

Il ne répond pas encore totalement au problème de départ, pour trois raisons :

- **la cause racine reste ouverte** : le périmètre n'est jamais validé par le client. Le plan est interne, et « aucune liste de fonctionnalités décidée en amont » reste vrai ;
- **le plan ne se confronte jamais à la réalité** : l'estimation repose sur des hypothèses, le temps passé est déclaré, et rien n'apprend ;
- **le mode quotidien n'a jamais servi en vrai**, alors que c'est lui qui doit faire gagner du temps.

## Besoin par besoin

| Besoin | Ce qui marche | Ce qui manque |
| --- | --- | --- |
| Lister les fonctionnalités, des sprints vers la date | Planification en six étapes, sources tracées, cœur et sous la ligne, plan convenu | Rien à envoyer au client pour qu'il valide le périmètre par écrit |
| Suivre l'avancement et la performance | Avance ou retard, projection, preuves par les commits | L'évolution dans le temps, le rythme réel face à l'estimation, le temps mesuré plutôt que déclaré |
| Anticiper les questions bloquantes | Passage au crible initial, échéances qui suivent le travail, réponses groupées par rendez-vous | La recherche des nouvelles questions pendant le développement, la date où une question a été posée et sa relance |
| Voir les risques | Retard projeté, réponses bloquantes, dépendance à une seule partie, jours tendus | La croissance du périmètre, l'écart durable entre rythme réel et estimation, l'incertitude de l'estimation |
| Un PO qui ouvre juste le tableau de bord | Tableau de bord complet, digest Slack | La publication jamais testée avec solopilot, l'accès d'un PO à la page à vérifier |
| Apprendre à estimer, mesurer le temps | Conçu dans la vision | Rien n'est codé |
| Gagner du temps sur le pilotage | Le skill fait la saisie à partir des commits | Jamais testé en vrai ; frictions probables (permissions, hook de rappel) ; aucune vue d'ensemble de plusieurs projets |

## Les chantiers

Dans l'ordre où on les mène.

### 1. Éprouver le quotidien

**Pourquoi.** C'est le mode qui sert chaque jour, et le seul jamais utilisé en vrai.

**Ce qu'on fait.** Un point de fin de session complet sur le bac à sable Fieldbook : proposition des changements, validation, écriture, publication sur une page claude.ai, commit. Puis on supprime les frictions constatées. Deux sont pressenties :

- les demandes de permission à chaque commande `solopilot` : `install` pourrait les autoriser dans les réglages locaux du projet ;
- le hook de rappel, qui risque de demander de lancer `/solopilot` pendant que le skill attend la validation.

**Fini quand** un point de fin de session se fait sans friction, et la page publiée est lisible par quelqu'un d'autre que le développeur.

**État (11 octobre).** Fait, sauf la publication réelle sur claude.ai, que le banc d'essai désactive. Le scénario automatisé `daily` passe toutes ses vérifications, sans aucune demande de permission. Il a trouvé et fait corriger cinq frictions : les permissions, le commit bloqué, les preuves partielles, le hook pendant `/solopilot`, le travail non commité.

### 2. Faire valider le périmètre par le client

**Pourquoi.** C'est la cause racine du problème : le devis achète « l'application », pas une liste de fonctionnalités. Sans accord écrit sur le périmètre, chaque demande se discute contre un souvenir.

**Ce qu'on fait.** À la fin de la planification, générer pour le client un document de périmètre, sans retards ni marges :
- les fonctionnalités du cœur, celles qui suivent si le temps le permet, et les exclusions ;
- les hypothèses retenues ;
- les questions auxquelles il doit répondre.

Il le valide par écrit, et sa validation est enregistrée avec le plan convenu.

**À trancher.** La forme du document : page publiée, PDF, texte pour un e-mail. Le moment de la validation, avant ou après le plan convenu en interne. La façon d'enregistrer qui a validé et quand.

**Fini quand** un projet peut montrer, à tout moment, le périmètre que le client a validé et la date de sa validation.

**État (11 octobre).** Fait, selon la [spécification](specs/perimetre-client.md). Le scénario `first-plan` va des documents du projet jusqu'à l'accord du client.

### 3. Confronter le plan à la réalité

**Pourquoi.** Une projection qui ignore indéfiniment la réalité n'est pas honnête, et l'outil ne peut apprendre à estimer que sur des mesures.

**Ce qu'on fait.**
- Relever à chaque point le temps tiré des journaux de Claude Code (temps de l'agent, attention du développeur), et le garder dans le dossier de pilotage.
- Proposer la charge de la session à partir de cette mesure, au lieu de la demander.
- Afficher le rythme réel à côté de l'estimation.
- Lever un risque quand l'écart dure. La projection reste sur l'estimation du plan ; recalibrer reste la décision du développeur.

**À trancher.** La source (journaux ou hooks), les seuils qui distinguent une lecture d'une absence, la quantité de données qu'il faut avant de lever le risque.

**Fini quand** chaque point enregistre un temps mesuré, et le tableau de bord montre le rythme réel face au plan.

### 4. Afficher la croissance du périmètre

**Pourquoi.** C'est le risque numéro un quand rien n'est figé à la signature. La référence existe depuis le plan convenu, mais elle n'est affichée nulle part.

**Ce qu'on fait.** Les points gagnés ou perdus depuis le plan convenu, et d'où ils viennent : demandes acceptées, tâches ajoutées, tâches reportées. Une ligne dans `status`, un risque dans le tableau de bord, une mention dans le digest quand le périmètre bouge.

**Fini quand** on peut dire en une ligne de combien le périmètre a grossi depuis l'accord, et pourquoi.

### 5. Suivre la vie des questions

**Pourquoi.** Le passage au crible initial est solide, mais les questions naissent aussi pendant le développement, et une question posée sans relance reste ouverte.

**Ce qu'on fait.**
- Noter la date où chaque question a été posée, afficher depuis combien de temps elle attend, et proposer une relance.
- À chaque point de fin de session, passer au crible les tâches des trois prochains jours pour y trouver les questions qui manquent encore.

**Fini quand** aucune question bloquante n'apparaît le jour où le travail l'atteint.

### 6. Voir tous ses projets ensemble

**Pourquoi.** Un développeur seul mène souvent plusieurs projets. Chaque plan suppose sa part de journée, et personne ne vérifie que leur somme tient.

**Ce qu'on fait.** Une vue de tous les dossiers de pilotage : l'état de chaque projet, et la charge promise au total face à une journée de travail.

**Fini quand** l'outil alerte avant qu'un nouveau projet rende les autres intenables.

## Ensuite

- Apprendre à estimer à partir de l'historique (chantier 3 d'abord, pour avoir des données).
- Une vue client générée, au-delà du document de périmètre.
- Avant de passer en public : relire le README, montrer ce qu'il faut pour démarrer avec des documents d'exemple, traduire les documents de travail, ajouter les topics GitHub et un CONTRIBUTING, publier sur npm.
