# Les Voiles de Kerlan — Application de réservation

Cahier des charges, version 1.2 — septembre 2026. Document fictif, créé pour tester solopilot.

## 1. Contexte

Les Voiles de Kerlan est une association de voile de 340 adhérents, sur la côte nord du Finistère. Elle loue une flotte de 22 bateaux (dériveurs, catamarans, paddles) et propose des cours encadrés par 9 moniteurs. Aujourd'hui, les réservations se font par téléphone et sur un tableau papier au club-house. Les doubles réservations et les créneaux non honorés coûtent environ 15 % du chiffre d'affaires de location.

L'association veut une application web, utilisable sur téléphone au ponton comme sur ordinateur à la maison.

## 2. Utilisateurs

- **Adhérent** : réserve un bateau ou une place dans un cours, consulte et annule ses réservations.
- **Moniteur** : gère ses cours (création, effectif, présence). Les moniteurs pourront aussi « gérer le planning des bateaux dans certains cas ».
- **Bureau** (3 personnes) : administre la flotte, les adhérents, les tarifs, et consulte les statistiques.

## 3. Fonctionnalités attendues

### 3.1 Compte et accès

- Connexion par e-mail et mot de passe, avec mot de passe oublié.
- Les comptes adhérents sont créés à partir du fichier des adhérents de l'association (import). L'adhésion doit être à jour pour réserver.
- Un adhérent peut modifier ses coordonnées et son niveau de navigation (débutant, intermédiaire, confirmé).

### 3.2 Planning et réservation des bateaux

- Planning de la flotte par jour et par semaine, avec les créneaux libres et occupés.
- Réservation d'un bateau sur un créneau (demi-journée ou journée).
- Un bateau ne peut être réservé que par un adhérent dont le niveau correspond au bateau (un catamaran demande le niveau confirmé).
- Fiche de chaque bateau : photos, description, niveau requis, capacité.
- Annulation d'une réservation par l'adhérent, « selon des conditions à définir avec le bureau ».
- Un bateau peut être mis en maintenance par le bureau : ses créneaux deviennent indisponibles, et les réservations déjà prises sur cette période doivent être traitées.

### 3.3 Cours

- Catalogue des cours de la saison (stage d'initiation, perfectionnement, régate) avec dates, niveau, moniteur et nombre de places.
- Inscription d'un adhérent à un cours, dans la limite des places, avec liste d'attente.
- Le moniteur fait l'appel au début du cours depuis son téléphone.

### 3.4 Météo

- En cas de météo défavorable, les sorties sont annulées et les adhérents concernés sont prévenus.

### 3.5 Paiement

- Les locations et les cours sont payants, selon la grille tarifaire de l'association.
- Le mode de paiement n'est pas encore arrêté : paiement en ligne à la réservation, ou règlement au club-house.

### 3.6 Notifications

- E-mail de confirmation à chaque réservation, inscription et annulation.
- Rappel la veille d'une sortie.

### 3.7 Administration

- Gestion de la flotte : ajout, modification, maintenance.
- Gestion des adhérents : import, adhésion à jour ou non, niveau.
- Gestion des tarifs.
- Tableau de bord : taux d'occupation de la flotte par semaine, créneaux non honorés, remplissage des cours.

## 4. Contenus

Les photos et descriptions des 22 bateaux, ainsi que la grille tarifaire 2027, seront fournies par le bureau.

## 5. Contraintes techniques

- Application web responsive, accessible depuis un téléphone au ponton (réseau parfois faible).
- Hébergement chez le prestataire actuel du site de l'association, sur un sous-domaine `reservation.voiles-kerlan.fr`.
- Conformité RGPD : les données des adhérents restent en France.

## 6. Hors périmètre

- Application mobile native (iOS ou Android).
- Export comptable et facturation.
- Gestion de plusieurs clubs.
- Messagerie entre adhérents.

## 7. Calendrier

Mise en ligne souhaitée pour l'ouverture des inscriptions de la saison 2027, le 18 décembre 2026.
