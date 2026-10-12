# Fieldbook : cahier des charges fonctionnel

Harbor & Pine, coopérative de gestion de bâtiments. Version 1.2, 15 septembre 2026. Document fictif, écrit pour la démo de solopilot.

## 1. Contexte

Harbor & Pine gère environ 140 sites pour ses adhérents (bureaux, écoles, petits entrepôts) dans trois régions. Des inspecteurs visitent chaque bâtiment selon un calendrier et remplissent des grilles papier : sécurité incendie, installations électriques, accessibilité, état général. Les fiches sont ressaisies au bureau, parfois des semaines plus tard, et des constatations se perdent en route.

Fieldbook remplace le papier. Les inspecteurs remplissent leurs grilles sur un téléphone ou une tablette, sur place, et les responsables voient les constatations dès qu'elles sont soumises. Beaucoup de locaux techniques et de sous-sols n'ont pas de réseau : l'application doit y fonctionner.

La campagne d'inspection d'hiver commence en décembre. Fieldbook doit être en production avant.

## 2. Utilisateurs

- **Les inspecteurs** mènent les inspections sur place. Ils travaillent seuls, souvent avec des gants, parfois dans la pénombre.
- **Les responsables** planifient les inspections de leur région et suivent les constatations.
- **Les administrateurs** (deux personnes au siège) gèrent les grilles et les utilisateurs.

La liste exacte des rôles, et ce que chacun peut voir, reste à confirmer avec le service des ressources humaines.

## 3. Comptes

### 3.1 Connexion

Pas de mot de passe : les inspecteurs les oublient, et les appareils sont partagés. On se connecte avec un lien envoyé à son adresse e-mail professionnelle. Le lien expire au bout de 15 minutes.

### 3.2 Accès par région

Une personne ne voit que les sites de sa région, sauf les administrateurs, qui voient tout.

### 3.3 Authentification unique

Quand la coopérative passera à un annuaire unique, l'an prochain, se connecter avec l'annuaire des adhérents serait bienvenu. Pas nécessaire pour la mise en ligne.

## 4. Sites et bâtiments

Chaque site a une adresse, une ville, une région et un ou plusieurs bâtiments. Chaque bâtiment a un type (bureau, école, entrepôt) qui détermine les grilles qui s'y appliquent.

La liste des sites et des bâtiments vient du tableur de la coopérative, que Harbor & Pine enverra avant le début du développement. Les inspecteurs trouvent un site par son nom ou par sa ville.

## 5. Grilles et inspections

### 5.1 Grilles d'inspection

Une grille est une liste de points regroupés en sections, pour un type de bâtiment. Les grilles changent chaque année avec la réglementation : quand une grille change, une nouvelle version est publiée.

Les grilles actuelles sont des formulaires papier. Harbor & Pine enverra un échantillon des formulaires utilisés sur ses trois plus grands sites, remplis, pour que l'application soit essayée sur du vrai contenu.

### 5.2 Mener une inspection

L'inspecteur choisit un bâtiment, démarre l'inspection et parcourt les points. Pour chaque point : conforme, non conforme ou sans objet. Un point non conforme devient une constatation, avec une gravité, une note et des photos. L'inspecteur peut s'arrêter et reprendre plus tard ; rien n'est perdu si le téléphone sonne ou si l'application est fermée. À la fin, l'inspecteur soumet l'inspection.

Les photos sont prises avec l'appareil photo du téléphone, plusieurs par constatation. Elles sont gardées avec l'inspection.

### 5.3 Traçabilité

Chaque modification d'une inspection est enregistrée : qui, quand, quoi. Une inspection soumise est définitive.

Lors des entretiens, deux responsables ont expliqué qu'ils renvoient parfois une inspection à l'inspecteur pour une correction (une gravité erronée, une photo manquante). La façon dont cela s'accorde avec des inspections définitives n'a pas été discutée.

### 5.4 Rappels

Les inspecteurs devraient être prévenus des inspections en retard, par une notification sur leur téléphone. Souhaitable.

## 6. Travail hors ligne

Les inspecteurs doivent pouvoir mener une journée entière d'inspections sans réseau. Avant de partir, l'application garde sur l'appareil tout ce dont la journée a besoin : les sites, les bâtiments, les grilles. Les inspections et les photos prises hors ligne sont envoyées dès que le réseau revient, sans que l'inspecteur ait à y penser. L'inspecteur peut voir ce qui attend encore d'être envoyé.

## 7. Rapports et suivi

### 7.1 Rapport d'inspection

Chaque inspection soumise produit un rapport PDF, envoyé au responsable du site. Ce que doit montrer la première page reste à décider avec le conseil d'administration de la coopérative.

### 7.2 Tableau des constatations

Les responsables voient les constatations ouvertes de leur région, par site et par gravité.

### 7.3 Exports

Les responsables peuvent exporter les constatations dans un fichier CSV, pour les assemblées annuelles des adhérents. Chaque responsable reçoit aussi une synthèse mensuelle par e-mail.

## 8. Administration

### 8.1 Éditeur de grilles

Les administrateurs créent et modifient les grilles : sections, points, types de bâtiments auxquels elles s'appliquent. Publier une grille crée une nouvelle version.

### 8.2 Utilisateurs

Les administrateurs invitent des personnes par e-mail et leur donnent un rôle et une région.

Les données brutes (sites, bâtiments, inspections) doivent rester modifiables par les administrateurs dans un back-office simple, pour les corrections.

## 9. Hébergement et mise en ligne

Fieldbook est hébergé par le prestataire informatique de la coopérative, qui fournira un serveur de préproduction, le domaine et son certificat. L'équipe design de Harbor & Pine dessine les écrans ; la connexion et la liste des sites sont prêtes (voir les maquettes), les écrans d'inspection suivront.

L'application doit être utilisable sur un téléphone milieu de gamme, dans la pénombre, d'une seule main.

## 10. Hors périmètre

- Des applications natives dans les stores : une application installée depuis le navigateur suffit.
- Tout lien avec le logiciel de maintenance de la coopérative. Les constatations sont suivies dans Fieldbook uniquement.
- La facturation des inspections aux adhérents.
- D'autres langues que le français.
