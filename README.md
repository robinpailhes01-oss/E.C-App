# Énergies Concept · Bons de commande

Outil commercial pour les équipes Énergies Concept : saisie des bons de commande sur
tablette ou téléphone, signature du client sur place, PDF du bon de commande, et
tableau de bord pour la direction.

## Fonctionnalités

- **Parcours de vente en 4 étapes** : coordonnées client → choix des produits → tarifs (HT / TVA 20 % / TTC) et financement → récapitulatif et signature.
- **Grille tarifaire intégrée** (`src/lib/catalog.ts`) : kits PV sans stockage (3 / 6 / 9 kW + personnalisé), kits avec micro-onduleurs et onduleur hybride, stockage seul, pompe à chaleur air-eau (TVA 5,5 %), ECS, SSC, options (batterie virtuelle MyLight, dépose / repose toiture, bornes de recharge). Marque et référence obligatoires sur chaque produit. Le prix conseillé n'est affiché que dans une info-bulle « i ».
- **Références matériel** (`src/lib/references.ts`) : listes proposées à la saisie, marque remplie automatiquement. Déjà saisies : panneaux FHE 500 W, batteries FHE INFINITYCELL 6 et 12, onduleurs hybrides FHE monophasé et triphasé, PAC air-eau Dynamic 8 à 16, carports FHE PARK+, capteur solaire FHE-7S3242, ballons thermodynamiques 200 et 300 L, ballon solaire TKS 420/140, chauffage air/air Hitachi airHome 200 (2 à 5 kW). En attente : micro-onduleurs, bornes de recharge.
- **Tarification TTC** : le prix saisi est TTC, installation comprise. L'installation (15 % du TTC, taux modifiable par la direction et figé sur chaque bon) est déduite du matériel et affichée séparément avec son HT et sa TVA 20 %.
- **Règlement** : échéancier et mode (chèque ou virement) obligatoires. **Financement** : Sofinco / Domofinance / Autre, intérêts normal / compensé / gratuit, assurance DIM, situation activité / retraite, report 180 jours, mensualité calculée. Les taux de chaque organisme sont modifiables par la direction (tableau de bord) et figés sur chaque bon.
- **Signature sur place** (client + commercial) au doigt ou au stylet.
- **PDF du bon de commande** généré sur l'appareil (fonctionne hors ligne) : bon, mentions légales, CGV, formulaire de rétractation. Téléchargement ou partage natif (AirDrop, mail, WhatsApp…).
- **Suivi des bons** : en cours, signés, annulés, recherche.
- **Suivi de dossier (secrétariat)** : fiche par bon signé reprenant le cahier papier : visite technique, livraison, pose, commande du matériel (fournisseur / date), acompte et solde, décision de l'organisme financier, DP mairie, contrat Enedis, Consuel, liste des documents (CNI, RIB, bulletin de salaire, avis d'impôt, mandat DP, justificatif de domicile, facture d'électricité, photo disjoncteur + compteur) avec prise de photo, observations. Enregistrement automatique et barre d'avancement. Le commercial voit l'avancement de ses dossiers en lecture seule.
- **La semaine** : agenda des poses, visites techniques, livraisons et SAV planifiés. La direction et la secrétaire planifient et mettent à jour ; le vendeur suit l'avancement de ses chantiers.
- **SAV** : déclaration depuis l'espace commercial, secrétariat ou direction, avec photos, urgence, suivi par commentaires, statut et planification.
- **Tableau de bord direction** : période personnalisable, CA signé, panier moyen, taux de signature, part financée, CA par mois, ventes par famille, performance par commercial, tuiles SAV / poses / dossiers en cours, taux des organismes de financement.
- **Rôles** : `commercial` (ne voit que ses bons, dossiers et SAV), `secretaire` (suivi de dossiers, semaine, SAV) et `directeur` (voit tout, paramètres).

## Démarrer

```bash
npm install
npm run dev
```

Ouvrir http://localhost:3000. Sans configuration, l'application tourne en **mode démo** :
trois comptes fictifs sont proposés et les données sont stockées dans le navigateur.

## Brancher Supabase (usage en équipe)

1. Créer un projet sur https://supabase.com.
2. Dans l'éditeur SQL du projet, exécuter dans l'ordre les fichiers de `supabase/migrations/` (`0001` à `0004`) :
   tables `profiles`, `orders`, `settings`, `dossiers`, `sav`, numérotation automatique `EC-AAAA-0001`,
   rôle `secretaire`, bucket privé `dossiers` pour les photos, sécurité par rôle.
3. Copier `.env.example` en `.env.local` et renseigner :
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
4. Créer les utilisateurs dans **Authentication → Users** (e-mail + mot de passe).
   Un profil `commercial` est créé automatiquement. Pour un directeur, exécuter :
   ```sql
   update public.profiles set role = 'directeur', full_name = 'Prénom Nom' where email = 'direction@...';
   ```
   Pour la secrétaire, utiliser `role = 'secretaire'`.
   Le nom affiché sur les bons est `full_name` (modifiable dans la table `profiles`).
5. Déployer (Vercel : importer le dépôt et ajouter les deux variables d'environnement).

## À personnaliser

- `src/lib/company.ts` : coordonnées, SIRET, RCS, TVA intracommunautaire, assurance décennale (imprimés sur le PDF).
- `src/lib/catalog.ts` : produits et prix conseillés TTC.
- `src/lib/settings.ts` : valeurs par défaut des paramètres (taux, assurance, durées) utilisées tant que la direction ne les a pas modifiés.
- `src/lib/pdf.ts` : mise en page du bon et texte des CGV.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Supabase · jsPDF · signature_pad · Recharts.
