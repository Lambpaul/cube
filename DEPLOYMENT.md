# Cube Evolution - Guide de Déploiement

## ✅ Système Complet Implémenté

Le système complet a été développé avec **toutes les fonctionnalités demandées** :

### 🎯 Fonctionnalités Implémentées

- ✅ **UI Dynamique** - Interface qui s'adapte selon le niveau du cube
- ✅ **100 clics** → Nommage du cube
- ✅ **200 clics** → Déblocage de 3 couleurs primaires (Rouge, Bleu, Jaune)
- ✅ **100 worships par couleur** → Déblocage de la palette complète (color picker)
- ✅ **500 clics** → Mode peinture 16×16 (1 pixel/100 worships)
- ✅ **2000 clics** → Passage en grille 64×64
- ✅ **10000 clics** → Transformation 3D smooth + 6 faces
- ✅ **Bug cube inexistant** → Corrigé (reste sur le cube local)

---

## 📦 Fichiers Créés/Modifiés

### Backend
- `backend/app.js` - Logique complète du serveur
  - Gestion des couleurs primaires avec compteurs
  - Système de peinture de pixels
  - WebSocket events pour toutes les actions

### Frontend
- `frontend/index.html` - Interface dynamique complète
- `frontend/style.css` - Design noir et blanc + nouveaux éléments
- `frontend/script.js` - **~540 lignes** de logique JavaScript
  - UI dynamique selon progression
  - Gestion du mode peinture
  - Canvas pour grille cliquable
- `frontend/cube.js` - **~270 lignes** de rendu 3D
  - Textures dynamiques par face
  - Animation de transition en 3D
  - Gestion de la grille de pixels

### Documentation
- `OBJECTIVES.md` - Système complet documenté
- `DEPLOYMENT.md` - Ce fichier

---

## 🚀 Déploiement

### Étape 1 : Arrêter les Anciens Conteneurs

```bash
docker compose down -v
```

**Important** : Le `-v` supprime l'ancienne base de données (nécessaire car le schéma a changé)

### Étape 2 : Reconstruire et Démarrer

```bash
docker compose up -d --build
```

### Étape 3 : Accéder à l'Application

Ouvrez votre navigateur : **http://localhost:7080**

---

## 🎮 Test du Système

### Test 1 : Cube Local (0-99 clics)

1. Arrivée sur le site → Page blanche + "Welcome to the Cube"
2. Carré noir vide au centre
3. Cliquez sur le cube (stockage local)
4. ❌ **Aucune UI ne devrait apparaître**

### Test 2 : Nommage (100 clics)

1. Cliquez 100 fois
2. Pop-up "The Cube Awakens" apparaît
3. Entrez un nom (ex: "TestCube")
4. Le nom apparaît en haut à gauche
5. ✅ Le cube est maintenant en base de données

### Test 3 : Couleurs Primaires (200 clics)

1. Continuez à cliquer jusqu'à 200
2. ✅ **UI Panel apparaît en bas**
3. Vous voyez 3 boutons de couleurs : 🔴 🔵 🟡
4. Cliquez sur Rouge → Le contour devient rouge
5. Compteur "Red: X/100" progresse à chaque clic
6. Même chose pour Bleu et Jaune

### Test 4 : Palette Complète (300+ clics)

1. Cliquez 100 fois en Rouge
2. Cliquez 100 fois en Bleu
3. Cliquez 100 fois en Jaune
4. ✅ **"Full Palette" apparaît dans l'UI**
5. Color picker + input hexadécimal disponibles
6. Testez une couleur custom (ex: #FF5733)

### Test 5 : Mode Peinture (500 clics)

1. Atteignez 500 clics
2. ✅ **"Paint Mode" section apparaît**
3. Vous voyez "Pixels Available: 5/256"
4. Cochez "Enable Paint Mode"
5. Une grille 16×16 apparaît sur le cube
6. Cliquez sur une case → Elle se colorie
7. Vous ne pouvez peindre que 5 pixels (1 par 100 clics)

### Test 6 : Haute Résolution (2000 clics)

1. Atteignez 2000 clics
2. La grille passe automatiquement en 64×64
3. "Pixels: X/4096" s'affiche
4. Les pixels 16×16 sont conservés et adaptés

### Test 7 : Mode 3D (10000 clics)

**Note** : Pour tester rapidement, modifiez temporairement dans `backend/app.js` :
```javascript
const MILESTONES = {
    NAME: 100,
    PRIMARY_COLORS: 200,
    PRIMARY_COLOR_MASTERY: 100,
    PAINT_MODE: 500,
    HIGH_RES: 2000,
    MODE_3D: 100  // ← Changez de 10000 à 100 pour tester
};
```

1. Atteignez le seuil (10000 ou 100 si modifié)
2. ✅ **Animation smooth de transformation 2D → 3D** (2 secondes)
3. Le cube se met à tourner
4. Section "3D Mode" avec sélecteur de face apparaît
5. Changez de face (Top, Bottom, Front, Back, Left, Right)
6. Peignez sur différentes faces

### Test 8 : Cube Inexistant (Bug Fix)

1. Cliquez sur ⚙ (paramètres)
2. Entrez un nom qui n'existe pas : "CubeFantome"
3. Cliquez "Join"
4. ✅ **Alert "Cube not found"**
5. ✅ **Vous restez sur votre cube local** (pas de nom affiché en haut)

### Test 9 : Multi-joueurs

1. Ouvrez 2 onglets
2. Dans le 1er, créez un cube "SharedCube"
3. Dans le 2ème, rejoignez "SharedCube" via paramètres
4. Cliquez dans le 1er onglet
5. ✅ **Le 2ème onglet se met à jour en temps réel**

---

## 🎨 Aperçu de l'UI Dynamique

### Niveau 0 (< 100 clics)
```
[Page blanche]
[Carré noir vide au centre]
[Aucune UI]
```

### Niveau 1 (100-199 clics)
```
TestCube                    [⚙]
[Carré noir vide]
[Aucune UI sauf le nom]
```

### Niveau 2 (200-499 clics)
```
TestCube                    [⚙]
[Carré avec contour coloré]

┌─────────────────────────────┐
│ Primary Colors              │
│ [🔴] [🔵] [🟡]              │
│ Red: 25/100                 │
│ Blue: 0/100                 │
│ Yellow: 0/100               │
└─────────────────────────────┘
```

### Niveau 3 (Palette complète débloquée)
```
TestCube                    [⚙]
[Carré avec contour coloré]

┌─────────────────────────────┐
│ Primary Colors              │
│ [🔴] [🔵] [🟡]              │
│ Red: ✓ 100/100              │
│ Blue: ✓ 100/100             │
│ Yellow: ✓ 100/100           │
├─────────────────────────────┤
│ Full Palette                │
│ [Color Picker] #FF5733      │
│ [Apply Color]               │
└─────────────────────────────┘
```

### Niveau 4 (500+ clics - Paint Mode)
```
TestCube                    [⚙]
[Grille 16×16 cliquable]

┌─────────────────────────────┐
│ Primary Colors              │
│ Full Palette                │
├─────────────────────────────┤
│ Paint Mode                  │
│ Pixels Available: 3/256     │
│ ☑ Enable Paint Mode         │
│ Paint Color: [█]            │
└─────────────────────────────┘
```

### Niveau 5 (10000+ clics - 3D)
```
TestCube                    [⚙]
[Cube 3D rotatif]

┌─────────────────────────────┐
│ Paint Mode (64×64)          │
├─────────────────────────────┤
│ 3D Mode                     │
│ Select Face: [Top ▼]        │
│   ↳ Top, Bottom, Front...   │
└─────────────────────────────┘
```

---

## ⚙️ Configuration

### Modifier les Milestones

Éditez `backend/app.js` (lignes 104-110) :

```javascript
const MILESTONES = {
    NAME: 100,                    // Nommage
    PRIMARY_COLORS: 200,          // 3 couleurs
    PRIMARY_COLOR_MASTERY: 100,   // Worships par couleur
    PAINT_MODE: 500,              // Mode peinture
    HIGH_RES: 2000,               // 64×64
    MODE_3D: 10000                // 3D
};
```

### Modifier le Ratio Pixels/Clics

Ligne 113 de `backend/app.js` :

```javascript
const PIXEL_PER_WORSHIPS = 100;  // 1 pixel tous les X clics
```

---

## 🐛 Debugging

### Voir les Logs

```bash
docker compose logs -f backend
```

### Console Browser

Ouvrez F12 et regardez les logs :
- "Local clicks: X" → Clics locaux
- "Cube state updated" → Mise à jour du serveur
- "Cube created in database" → Création réussie

### Reset Complet

```bash
docker compose down -v
docker compose up -d --build
```

---

## 📊 Structure de Données

Exemple de cube en base (MongoDB) :

```json
{
  "_id": "TestCube",
  "clicks": 550,
  "unlocked": ["name", "primary_colors", "paint_mode"],
  "primaryColors": {
    "red": { "unlocked": true, "worships": 100 },
    "blue": { "unlocked": true, "worships": 100 },
    "yellow": { "unlocked": true, "worships": 100 }
  },
  "allColorsUnlocked": true,
  "currentColor": "#FF5733",
  "gridResolution": 16,
  "paintedPixels": [
    { "face": "top", "x": 0, "y": 0, "color": "#FF0000" },
    { "face": "top", "x": 1, "y": 0, "color": "#0000FF" }
  ],
  "availablePixels": 5,
  "is3D": false
}
```

---

## 🎯 Prochaines Étapes Possibles

1. **Animations** : Particules lors des déblocages
2. **Sons** : Effets audio au clic
3. **Leaderboard** : Top 10 des cubes
4. **Export** : Télécharger l'image du cube
5. **Partage** : Générer un lien de partage
6. **Achievements** : Badges de progression

---

## ✨ Félicitations !

Vous avez maintenant un système de jeu **extrêmement complet** avec :
- **~1400 lignes de code** au total
- UI dynamique intelligente
- Système de progression sophistiqué
- Rendu 3D avec textures
- Synchronisation temps réel

**Bon worship ! 🎲**
