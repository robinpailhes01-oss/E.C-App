# Notes de cadrage · outil bon de commande Énergies Concept

Source : rendez-vous enregistré avec Arnaud, gérant d'Énergies Concept (26 min). Transcription complète dans
`docs/reunion-gerant-transcription.md`. Ce document en extrait le fonctionnement actuel, les besoins exprimés,
les écarts avec l'application déjà construite et les questions restant à poser.

## 1. Le contexte en quelques chiffres

| Donnée | Valeur citée |
|---|---|
| Commerciaux terrain | environ 20 (« aujourd'hui on en est 20 ») |
| Chiffre d'affaires | 600 à 900 k€ sur juillet dernier |
| Coût du carnet papier | environ 2 € par bon de commande |
| Partenaire financement | Domofinance, code partenaire unique pour toute l'équipe |
| Taux actuel | 6,28 à 6,29 % (Domofinance, susceptible de changer) |
| TVA | 20 % dans 90 % des cas, parfois 5,5 % |
| Exemple de dossier | 13 900 € financés en totalité, 180 mois, sans assurance, sans apport |

## 2. Comment ça se passe aujourd'hui

1. Le commercial remplit à la main un bon de commande papier en trois exemplaires (carbone) : un pour le client, un conservé.
2. Il signe sur place, le client signe sur place. Il remet une pochette avec les fiches techniques (panneau, batterie).
3. Le bon remonte au bureau. La secrétaire s'en sert pour la déclaration préalable en mairie (DP), le dossier de financement, le Consuel.

**Ce qui pose problème** (mots d'Arnaud) :

- « Des fois ils arrivent, il y a juste les coordonnées du client, le montant et une signature. » Pas de détail HT / TVA / TTC, pas de produits listés. « Niveau légal, on peut se faire taper sur les doigts. » « Le client peut me dire : ça vaut rien. »
- « Aucun ne va prendre la grille, l'écrire et faire tout correctement. Il va me mettre juste un TTC. »
- Les organismes de financement refusent les bons illisibles ou raturés : « Lecture illisible, merci de refaire le bon de commande. » Une rature oblige à tout refaire.
- La secrétaire refait les bons et les fait re-signer : retour chez le client, ventes perdues, « on passe plus de temps sur le bureau ».
- Sur un bon montré en fin d'entretien : « il n'y a même pas de total TTC, il n'y a rien écrit ».

**L'objectif en une phrase** : « L'idée de base, c'est mâcher le travail au commercial. » Il rentre quelques infos, tout se calcule, tout sort propre, le client signe sur place, tout le monde reçoit le PDF.

## 3. Le parcours attendu, étape par étape

Arnaud décrit l'entonnoir dans cet ordre, et insiste pour « garder la même trame » que le bon papier.

1. **Date et commercial** : renseignés automatiquement, le commercial valide.
2. **Coordonnées du client** : il rentre tout, il valide. Il relit à voix haute avec le client (« Madame Bonneau, 130… dites-moi si je me trompe »).
3. **Produits par rubrique** : « photovoltaïque, ballon thermo, pompe à chaleur ». Dans une rubrique, les déclinaisons s'affichent (« panneaux 2, 3, 4 kW », « panneaux, stockage »). Il appuie, le montant se met à côté, « tout se calcule au fur et à mesure ». Exemple de lignes d'un vrai bon : 2 kW de panneaux, onduleur hybride, batteries, installation.
4. **Paiement** :
   - **Comptant** : acompte à la commande, à la visite technique, à la livraison, à l'installation (chacun peut être à zéro), chèque d'acompte récupéré ou non. Délai d'installation (exemple : trois mois). « Pas besoin de mettre de pavé financier sur un paiement comptant. »
   - **Financement** : montant total financé, nombre de mensualités, taux, avec ou sans apport. Le pavé financier apparaît seulement dans ce cas.
5. **Relecture et signature sur la tablette** : au moment de signer, l'écran affiche le détail complet. Le commercial signe, le client signe, « les deux ont signé, bam, c'est validé ».
6. **Envoi automatique** : le client reçoit par mail le PDF du bon, les conditions générales et, idéalement, les fiches techniques des produits. L'entreprise reçoit le même mail. Arnaud imprime et le transmet à la secrétaire.

## 4. Les règles métier à respecter

### Prix et TVA

- Tous les articles sont préenregistrés avec un **prix conseillé**. Le prix **doit rester modifiable** : « il y en a qui vendent plus, d'autres un peu moins parce qu'ils sont dans la négo ».
- Sur le bon de commande, le commercial raisonne en **TTC** : « je mets mon TTC, il me sort en hors taxe ». Le HT et la TVA sont déduits (inverse du devis, où il part du HT).
- Le bon doit détailler **HT, TVA, TTC** ligne par ligne et en total : « c'est réglementaire, il faut que ce soit tout détaillé ».
- TVA 20 % par défaut, 5,5 % possible.
- La **pose / installation** est une ligne à part entière, avec sa TVA (« j'ajoute les produits, j'ajoute l'installation, pareil, 20 % »).

### Financement

- Le taux **doit être modifiable par l'administrateur** (Arnaud) : « les taux, ça change. À partir du moment où il change, je le change et je sais que ce qui s'affiche correspond au taux que j'ai mis. »
- Les commerciaux ont accès au simulateur Domofinance (code partenaire commun) mais « ils ne sont pas capables de le remplir correctement ». L'application doit reproduire la simulation : montant, nombre de mensualités, taux → mensualité, avec et sans assurance.
- Paramètres de la simulation Domofinance cités : montant, report, modalité normale, nombre d'emprunteurs, date de naissance, en activité, assurance.
- Souhait fort : afficher **toutes les durées possibles** avec la mensualité correspondante pour que le client choisisse (« je ne veux pas dépasser 10 ans : 10 ans, il paie 117 € par mois avec assurance, 107 € sans »).
- Mention « sous réserve d'acceptation du financement » présente sur le bon actuel.

### Documents et conformité

- Les **conditions générales** doivent accompagner le bon (au dos du papier, en pièce jointe en numérique). « Tu peux l'avoir en numérique, mais il faut qu'il y ait les conditions générales. »
- Aucune rature, tout lisible. Le numérique règle ces deux points.
- Le papier restera : « on aura toujours au final le papier », le bon doit se télécharger et s'imprimer proprement.
- Les fiches techniques des produits (panneau, batterie…) sont remises au client : à joindre au mail si possible.

### Organisation et données

- Une **base de données** de tous les bons, avec **recherche par nom du client** : « à un moment donné tu vas en avoir un paquet ».
- Pas forcément un espace personnel par commercial (« les commerciaux, ça change »), mais le nom du commercial doit figurer sur le bon.
- Arnaud veut fournir une **tablette** à chaque commercial. Avec la tablette, ils pourront **photographier les documents** du client (pièces du dossier) : « une photo, c'est déjà bien ».
- Après signature, la secrétaire exploite le bon pour la DP mairie, le financement, le Consuel. Arnaud cite un outil vu chez le Consuel / CaliPV qui pré-remplit DP et Consuel à partir des infos saisies : piste d'évolution.

## 5. Écarts entre l'application actuelle et ces notes

| Sujet | Aujourd'hui dans l'app | À faire |
|---|---|---|
| Sens de saisie des prix | Saisie en HT, TTC déduit | Passer en **saisie TTC** (grille = prix TTC), HT et TVA déduits automatiquement |
| Ligne installation | Absente du catalogue | Ajouter « Installation / pose » et les composants cités (onduleur hybride, batteries) selon la liste d'Arnaud |
| Catalogue | Codé en dur dans `src/lib/catalog.ts` | Écran **Paramètres direction** pour ajouter / modifier articles, catégories et prix conseillés |
| Acompte | Un seul acompte à la commande | **Échéancier** : à la commande, à la visite technique, à la livraison, à l'installation, avec mode de règlement et chèque d'acompte |
| Délai d'installation | Date prévue | Ajouter un **délai en mois** (la date restant optionnelle) |
| Taux de crédit | Saisi par le commercial à chaque bon | **Taux par défaut administrable** (Domofinance), taux d'assurance administrable, le commercial ne saisit plus rien |
| Simulation crédit | Une durée, une mensualité | **Tableau de toutes les durées** (12 à 180 mois) avec mensualité avec / sans assurance, choix d'une ligne |
| Champs Domofinance | Absents | Report, nombre d'emprunteurs, date(s) de naissance, en activité, assurance |
| Mention financement | Présente dans le pavé PDF | Mettre en évidence « Sous réserve d'acceptation du dossier de financement » |
| Envoi après signature | Téléchargement / partage manuel | **E-mail automatique** au client et à l'entreprise avec bon + CGV + fiches techniques (service e-mail à brancher, ex. Resend) |
| Fiches techniques | Absentes | PDF par produit, joints au mail |
| Photos de documents | Absentes | Prise de photo depuis la tablette, rattachée au bon (stockage Supabase) |
| CGV | Extrait rédigé par nos soins | Remplacer par les **CGV officielles** d'Énergies Concept |
| Trame du bon | Notre mise en page | Aligner sur le bon papier existant (Arnaud remet un exemplaire vierge) |
| Comptes | Un compte par commercial | À confirmer : compte par commercial (recommandé pour le tableau de bord) ou compte commun avec choix du nom |

Ce qui est déjà conforme : entonnoir en 4 étapes, catégories de produits, prix modifiable ligne par ligne, TVA 20 / 10 / 5,5, détail HT-TVA-TTC, comptant ou crédit, signature client et commercial sur la tablette, PDF avec CGV et formulaire de rétractation, base de bons avec recherche par nom, impression, tableau de bord direction.

## 6. Ordre de réalisation proposé

1. **Saisie TTC + échéancier de paiement + délai d'installation** (règles métier, sans dépendance externe).
2. **Financement administrable** : paramètres direction (taux, assurance, durées proposées), tableau des mensualités, champs Domofinance.
3. **Catalogue administrable** avec ligne installation, à partir de la liste complète qu'Arnaud prépare.
4. **Envoi e-mail automatique** après signature (client + entreprise), avec CGV et fiches techniques. Nécessite Supabase + un service d'envoi.
5. **Photos de documents** rattachées au bon.
6. Plus tard : pré-remplissage DP mairie / Consuel à partir des données du bon.

## 7. Éléments à récupérer auprès d'Arnaud

- La liste complète des articles par rubrique avec prix conseillés (il dit y travailler), et le sens des prix de la grille papier (confirmer qu'ils sont TTC).
- Un bon de commande papier vierge (photo) et un bon rempli correctement, pour caler la trame.
- Les CGV officielles et les mentions légales de l'entreprise (SIRET, RCS, TVA, assurance décennale).
- Les fiches techniques PDF des produits.
- Les règles Domofinance : taux en vigueur, taux d'assurance, durées proposées, existence d'un report, plafond éventuel.
- Les cas où la TVA est à 5,5 % (quels produits).
- La signification du « 130 » lu sur le bon exemple (surface en m² ?).
- Qui reçoit le mail côté entreprise (adresse générique ou secrétaire).
- Décision sur les comptes : un par commercial ou un accès commun.
