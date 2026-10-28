# Carnet

PWA perso de suivi des dépenses, pensée pour Android. Direction artistique « Riviera ».

- **Stack** : Vite + React + TypeScript, `vite-plugin-pwa` (installable, hors ligne), Dexie (IndexedDB).
- **Données** : uniquement sur le téléphone. Aucun serveur, aucun compte.
- **Exports** : CSV (format Excel FR : `;` et virgule décimale) pour le mois affiché ou tout l'historique, sauvegarde/restauration JSON complète.
- **Récurrentes** : créées automatiquement à l'ouverture de l'appli, avec rattrapage des mois manqués.

## Commandes

```bash
npm install
npm run dev       # dev sur http://localhost:5173 (et sur le réseau local)
npm run build     # build de production dans dist/
npm run preview   # sert dist/ pour tester le service worker
npm run icons     # régénère les icônes depuis public/logo.svg
```

## Déploiement

Chaque push sur `main` déclenche `.github/workflows/deploy.yml`, qui builde et publie sur GitHub Pages
(réglage du repo : Settings → Pages → Source : **GitHub Actions**).

## Installer sur Android

Ouvre l'URL GitHub Pages dans Chrome, puis menu ⋮ → « Installer l'application » (ou Réglages → Installer l'appli).
Les mises à jour arrivent toutes seules à l'ouverture suivante.

## Structure

```
src/
  lib/         données (db.ts), récurrences, exports, formatage, icônes
  components/  panneaux (dépense, catégorie, récurrence), graphiques, navigation
  screens/     Accueil, Stats, Historique, Réglages
```
