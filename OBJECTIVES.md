# Cube Evolution - Objectifs et Milestones (Système Complet)

## 📊 Système de Progression

### Paliers Principaux

| Clics | Objectif | Description | Effet Visuel |
|-------|----------|-------------|--------------|
| **100** | **Nommage** | Le cube est créé en base avec un nom unique | Pop-up + nom en haut à gauche |
| **200** | **Couleurs Primaires** | Déblocage de 3 couleurs primaires (Rouge, Bleu, Jaune) | Sélecteur de 3 couleurs apparaît |
| **Spécial** | **Palette Complète** | 100 worships avec CHAQUE couleur primaire | Color picker complet débloqué |
| **500** | **Mode Peinture** | Grille 16x16 pour peindre le cube pixel par pixel | Interface de peinture apparaît |
| **2000** | **Haute Résolution** | Passage de 16x16 à 64x64 | Grille plus fine |
| **10000** | **Mode 3D** | Transformation en cube 3D - révélation des 6 faces | Animation + rotation 3D |

---

## 🎨 Système de Couleurs Détaillé

### Étape 1 : Couleurs Primaires (200 clics)
- **Rouge (#FF0000)**
- **Bleu (#0000FF)**
- **Jaune (#FFFF00)**

L'utilisateur peut changer la couleur du contour du cube parmi ces 3 couleurs.

### Étape 2 : Déblocage de la Palette Complète
Pour débloquer le color picker complet (toutes les nuances):
- Worship le cube **rouge** 100 fois ✓
- Worship le cube **bleu** 100 fois ✓
- Worship le cube **jaune** 100 fois ✓

Une fois les 3 conditions remplies → Color picker hexadécimal débloqué

---

## 🖌️ Système de Peinture Détaillé

### Mode Peinture (500 clics globaux)

#### Grille 16x16 (500-1999 clics)
- Grille de 16×16 pixels = 256 pixels au total
- **1 pixel à peindre tous les 100 worships**
- Exemple: 500 clics = 5 pixels disponibles, 1000 clics = 10 pixels

#### Grille 64x64 (2000-9999 clics)
- Grille de 64×64 pixels = 4096 pixels au total
- Continue de gagner 1 pixel par 100 worships
- Les pixels déjà peints en 16x16 sont conservés et agrandis

#### Passage en 3D (10000 clics)
- Animation smooth de transformation
- **Révélation**: On peignait uniquement la face du DESSUS
- Maintenant accessible: 6 faces (top, bottom, front, back, left, right)
- Chaque face en 64×64
- Total: 6 × 4096 = 24576 pixels possibles

---

## 🎯 Calculs et Progression

### Pixels Disponibles
```
Pixels disponibles = Math.floor(clics / 100)
```

Exemples:
- 500 clics → 5 pixels
- 1000 clics → 10 pixels
- 2000 clics → 20 pixels
- 10000 clics → 100 pixels

### Progression des Couleurs Primaires

Chaque couleur primaire a son propre compteur:
```javascript
primaryColors: {
  red: { unlocked: true, worships: 75 },    // Pas encore 100
  blue: { unlocked: true, worships: 100 },   // ✓ Complété
  yellow: { unlocked: true, worships: 50 }   // Pas encore 100
}
```

Palette complète débloquée si:
```javascript
red.worships >= 100 && blue.worships >= 100 && yellow.worships >= 100
```

---

## 🖥️ Interface Utilisateur Dynamique

L'UI s'adapte selon le niveau du cube:

### 100 clics (Nom uniquement)
```
┌──────────────────┐
│ NomDuCube        │  ← En haut à gauche
│                  │
│     [Carré]      │
│                  │
└──────────────────┘
```

### 200 clics (+ Sélecteur de couleurs primaires)
```
┌──────────────────┐
│ NomDuCube        │
│                  │
│     [Carré]      │
│                  │
│ [🔴][🔵][🟡]    │  ← Sélecteur de couleurs
└──────────────────┘
```

### 300 clics (Toutes couleurs débloquées)
```
┌──────────────────┐
│ NomDuCube        │
│                  │
│     [Carré]      │
│                  │
│ [Color Picker]   │  ← Palette complète
└──────────────────┘
```

### 500 clics (Mode Peinture 16×16)
```
┌──────────────────┐
│ NomDuCube        │
│                  │
│   [Grille 16×16] │
│                  │
│ Pixels: 5/256    │  ← Compteur
│ [Color Picker]   │
│ [Paint Mode ON]  │
└──────────────────┘
```

### 2000 clics (Grille 64×64)
```
┌──────────────────┐
│ NomDuCube        │
│                  │
│   [Grille 64×64] │
│                  │
│ Pixels: 20/4096  │
│ [Color Picker]   │
└──────────────────┘
```

### 10000 clics (Mode 3D)
```
┌──────────────────┐
│ NomDuCube        │
│                  │
│   [Cube 3D]      │  ← Rotation 3D
│                  │
│ Face: TOP        │  ← Sélecteur de face
│ Pixels: 100/24576│
│ [Color Picker]   │
└──────────────────┘
```

---

## 📝 Structure de Données

### Schéma MongoDB

```javascript
{
  _id: "MonCube",              // Nom unique
  clicks: 5000,                // Clics totaux
  unlocked: ['name', 'primary_colors', 'paint_mode', 'high_res'],

  // Système de couleurs
  primaryColors: {
    red: { unlocked: true, worships: 150 },
    blue: { unlocked: true, worships: 100 },
    yellow: { unlocked: true, worships: 200 }
  },
  allColorsUnlocked: true,     // Si les 3 primaires ont 100+
  currentColor: "#FF5733",     // Couleur actuelle du contour

  // Système de peinture
  gridResolution: 64,          // 16 ou 64
  paintedPixels: [
    { face: 'top', x: 0, y: 0, color: '#FF0000' },
    { face: 'top', x: 1, y: 0, color: '#0000FF' },
    // ...
  ],
  availablePixels: 50,         // Pixels à peindre
  is3D: false,                 // Mode 3D activé?

  createdAt: Date,
  lastInteraction: Date
}
```

---

## 🔧 Configuration Technique

### Backend (app.js)

```javascript
const MILESTONES = {
  NAME: 100,
  PRIMARY_COLORS: 200,
  PRIMARY_COLOR_MASTERY: 100,  // Worships par couleur
  PAINT_MODE: 500,
  HIGH_RES: 2000,
  MODE_3D: 10000
};

const PIXEL_PER_WORSHIPS = 100;  // 1 pixel tous les 100 clics

const PRIMARY_COLORS = {
  red: '#FF0000',
  blue: '#0000FF',
  yellow: '#FFFF00'
};
```

---

## 🚀 Workflow Complet

```
1. Arrivée → Carré noir vide
   ↓
2. 100 clics → Nommage ("MonCube")
   ↓
3. 200 clics → Choix parmi Rouge/Bleu/Jaune
   ↓
4. Worship 100× en Rouge → Rouge maîtrisé
5. Worship 100× en Bleu → Bleu maîtrisé
6. Worship 100× en Jaune → Jaune maîtrisé
   ↓ (après 300 worships minimum)
7. Palette complète débloquée
   ↓
8. 500 clics → Mode Peinture 16×16 + 5 pixels
   ↓
9. Continue de cliquer → Gagne 1 pixel/100 clics
   ↓
10. 2000 clics → Passage en 64×64 + 20 pixels
    ↓
11. 10000 clics → Animation → Cube 3D
    ↓
12. 6 faces à peindre en 64×64
```

---

## 📌 Points Importants

1. **Les pixels sont précieux** : 1 pixel tous les 100 clics
2. **Compteur de couleurs primaires** : Chaque couleur track ses propres worships
3. **Conservation des pixels** : Passage 16→64 conserve les pixels peints
4. **Révélation 3D** : À 10000, on découvre qu'il y avait 5 autres faces
5. **UI dynamique** : L'interface s'adapte au niveau du cube

---

## 🎨 Prochaines Fonctionnalités Possibles

- **Patterns prédéfinis** : Déblocage de motifs (rayures, damier, etc.)
- **Symétrie** : Mode miroir pour peindre symétriquement
- **Undo/Redo** : Annuler les derniers pixels peints
- **Export** : Télécharger l'image du cube
- **Galerie** : Voir les cubes les plus colorés
- **Animations** : Pixels qui clignotent, rotations personnalisées
