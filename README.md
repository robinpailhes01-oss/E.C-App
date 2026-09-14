# Énergies Concept · Bons de commande

Outil commercial pour les équipes Énergies Concept : saisie des bons de commande sur
tablette ou téléphone, signature du client sur place, PDF du bon de commande, et
tableau de bord pour la direction.

## Fonctionnalités

- **Parcours de vente en 4 étapes** : coordonnées client → choix des produits → tarifs (HT / TVA 20 % / TTC) et financement → récapitulatif et signature.
- **Grille tarifaire intégrée** (`src/lib/catalog.ts`) : photovoltaïque avec / sans stockage, stockage seul, pompe à chaleur air-eau, ECS, SSC. Prix ajustables ligne par ligne, remise globale, ligne personnalisée.
- **Financement** : comptant, crédit ou mixte ; acompte, organisme, durée, TAEG, mensualité calculée automatiquement, aides estimées.
- **Signature sur place** (client + commercial) au doigt ou au stylet.
- **PDF du bon de commande** généré sur l'appareil (fonctionne hors ligne) : bon, mentions légales, CGV, formulaire de rétractation. Téléchargement ou partage natif (AirDrop, mail, WhatsApp…).
- **Suivi** : brouillons, bons signés, annulés, recherche.
- **Tableau de bord direction** : CA signé, panier moyen, taux de signature, part financée, CA par mois, ventes par famille de produit, performance par commercial.
- **Rôles** : `commercial` (ne voit que ses bons) et `directeur` (voit tout).

## Démarrer

```bash
npm install
npm run dev
```

Ouvrir http://localhost:3000. Sans configuration, l'application tourne en **mode démo** :
trois comptes fictifs sont proposés et les données sont stockées dans le navigateur.

## Brancher Supabase (usage en équipe)

1. Créer un projet sur https://supabase.com.
2. Dans l'éditeur SQL du projet, exécuter dans l'ordre `supabase/migrations/0001_init.sql` puis
   `supabase/migrations/0002_ttc_echeancier_settings.sql` (tables `profiles`, `orders`, `settings`,
   numérotation automatique `BC-AAAA-0001`, sécurité par rôle).
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
   Le nom affiché sur les bons est `full_name` (modifiable dans la table `profiles`).
5. Déployer (Vercel : importer le dépôt et ajouter les deux variables d'environnement).

## À personnaliser

- `src/lib/company.ts` : coordonnées, SIRET, RCS, TVA intracommunautaire, assurance décennale (imprimés sur le PDF).
- `src/lib/catalog.ts` : produits et prix conseillés TTC.
- `src/lib/settings.ts` : valeurs par défaut des paramètres (taux, assurance, durées) utilisées tant que la direction ne les a pas modifiés.
- `src/lib/pdf.ts` : mise en page du bon et texte des CGV.

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Supabase · jsPDF · signature_pad · Recharts.
