# OpenPitch Analyst - Cahier des Charges Technique (MVP)

**Version :** 1.0
**Type :** Web App / PWA (Progressive Web App)
**Licence :** Open Source (MIT)
**Priorité :** Football (Extensible à d'autres sports)

---

## 1. Vision & Objectifs
L'objectif est de créer une alternative Open Source légère aux logiciels d'analyse sportive coûteux ou complexes (comme R/Python). L'outil permet à un analyste d'importer des données de tracking (GPS/Optique), de visualiser les déplacements sur un terrain vectoriel et de générer des rapports statistiques (Heatmaps, Distances, Vitesses).

**Philosophie technique :** "Privacy-First" & "Client-Side Only". Aucune donnée ne transite par un serveur. Tout le traitement se fait dans le navigateur de l'utilisateur via JavaScript/WASM.

---

## 2. Stack Technique Imposée

Pour garantir la maintenabilité et la performance du projet Open Source :

* **Core :** React 18+ (Hooks)
* **Langage :** TypeScript (Strict mode requis)
* **Build Tool :** Vite (Pour la rapidité de dev)
* **Styles :** TailwindCSS (Pour une UI rapide et responsive)
* **State Management :** Zustand (ou React Context pour le MVP)
* **Data Processing :**
    * `papaparse` (Parsing CSV haute performance)
    * `lodash` (Manipulation de données)
* **Visualisation :**
    * `D3.js` ou SVG natif (Rendu du terrain et des trajectoires)
    * `simpleheat` ou `h337` (Génération des Heatmaps)
    * `recharts` (Graphiques statistiques)

---

## 3. Architecture des Données

### 3.1 Format d'Entrée (Input)
Le MVP doit supporter l'import de fichiers `.csv`.
Le format standard attendu (Normalisé) pour la V1 est :

| Colonne | Type | Description | Unité |
| :--- | :--- | :--- | :--- |
| `timestamp` | Float | Temps écoulé depuis le début | Secondes |
| `player_id` | String | Identifiant unique du joueur | - |
| `x` | Float | Position longitudinale (0-105) | Mètres |
| `y` | Float | Position latérale (0-68) | Mètres |
| `speed` | Float | Vitesse instantanée | km/h |

### 3.2 Pipeline de Traitement (ETL Client-Side)
1.  **Ingest :** Upload du fichier via Drag & Drop.
2.  **Parse :** Lecture du CSV en Web Worker (pour ne pas bloquer l'UI).
3.  **Normalize :** Conversion des strings en numbers, nettoyage des `null`.
4.  **Store :** Stockage dans le State global (RAM).
5.  **Render :** Mise à jour des composants graphiques.

---

## 4. Feuille de Route (Roadmap) & Sprints

Le développement est découpé en 5 phases distinctes.

### Sprint 1 : Setup & Infrastructure
* Initialisation du repo avec Vite + React + TS.
* Configuration de ESLint + Prettier (Standardisation du code).
* Mise en place de TailwindCSS.
* Setup CI/CD (Déploiement auto sur Vercel/Netlify/GitHub Pages sur push main).
* **Livrable :** Un "Hello World" hébergé.

### Sprint 2 : Le Moteur d'Import (ETL)
* Création du composant `FileUploader` (Drag & Drop zone).
* Intégration de `PapaParse`.
* Implémentation de la validation de schéma (Vérifier que les colonnes `x` et `y` existent).
* Gestion des erreurs (Feedback utilisateur si le CSV est corrompu).
* **Livrable :** Une page affichant le CSV brut dans un tableau HTML propre.

### Sprint 3 : Visualisation Spatiale (The Pitch)
* Développement du composant `<Pitch />`.
    * Rendu SVG d'un terrain de foot (105x68 ratio).
    * Responsive (doit s'adapter à la taille de l'écran).
* Développement de la logique de "Scaling" (Linear Scale) :
    * Fonction `metersToPixels(x, y)`.
* Affichage de la position du joueur sous forme de point animé (slider temporel basique).
* **Livrable :** Un terrain avec un point qui bouge selon les données.

### Sprint 4 : Advanced Viz (Heatmap)
* Intégration de la librairie de Heatmap.
* Logique d'agrégation : Calculer la densité de présence sur une grille virtuelle.
* Overlay : Superposer la heatmap sur le composant `<Pitch />` avec opacité ajustable.
* **Livrable :** Le terrain affiche les zones de chaleur du joueur.

### Sprint 5 : Dashboarding & KPI
* Calcul des métriques globales (côté client) :
    * `Distance Totale` (Somme des vecteurs).
    * `Vitesse Max` (Math.max sur la colonne speed).
* Composants UI "Cards" pour afficher ces chiffres.
* Graphique linéaire (LineChart) de la vitesse au cours du temps.
* **Livrable :** Dashboard complet (MVP final).

---

## 5. Guidelines UI/UX
* **Thème :** Dark Mode par défaut (Standard pour les outils d'analyse pro).
* **Performance :** Attention aux re-renders inutiles. Les fichiers de tracking peuvent contenir 100k+ lignes. Utiliser `React.memo` et `useMemo` agressivement.
* **Mobile First :** L'interface doit être consultable sur iPad/Mobile (PWA).

## 6. Structure du Projet (Suggestion)

/src /assets # Images, SVG statiques /components /ui # Boutons, Cards, Inputs (composants génériques) /viz # Pitch, Heatmap, Charts (composants métier) /layout # Header, Sidebar /hooks # Custom hooks (useWindowSize, usePlayerStats) /lib # Logique métier pure (maths, parsing) /store # Global state (Zustand) /types # Définitions TypeScript partagées