# Cube Evolution - Objectifs et Milestones

## 📊 Système de Progression Actuel

### Nombre de Clics Requis

| Clics | Objectif | Description | État Visuel |
|-------|----------|-------------|-------------|
| **100** | **Nommage du Cube** | Le joueur peut donner un nom unique au cube. **Le cube est enregistré en base de données à ce moment.** | Pop-up "The Cube Awakens" apparaît |
| **200** | **Changement de Couleur** | Déblocage de la possibilité de changer la couleur du cube | Sélecteur de couleur activé |
| **500** | **Remplissage** | Le cube devient opaque (rempli) au lieu d'être juste un contour | Le carré noir se remplit |
| **1000** | **Mode 3D** | Le cube passe de 2D à 3D avec rotation | Transformation en cube 3D rotatif |

---

## 🎯 Système Actuel

### Logique de Base de Données

**AVANT 100 clics :**
- Le cube n'existe QUE dans le navigateur du joueur
- Aucune persistance en base de données
- Pas de synchronisation multi-joueurs

**À 100 clics :**
- Pop-up pour nommer le cube
- **Une fois nommé, le cube est créé en base avec le nom comme identifiant unique**
- À partir de ce moment, le cube est persistant et partageable

**Après 100 clics :**
- Toutes les interactions sont synchronisées en temps réel
- Plusieurs joueurs peuvent "worship" le même cube simultanément
- Utilisation du **nom du cube** pour rejoindre un cube existant (pas d'ID technique)

---

## 🔧 Configuration Technique

### Backend (app.js)

```javascript
const FEATURES = {
    100: 'name',    // Nommage + Création en base
    200: 'color',   // Changement de couleur
    500: 'fill',    // Remplissage
    1000: '3d'      // Mode 3D
};
```

### Frontend (script.js)

```javascript
const FEATURES = {
    100: 'name',
    200: 'color',
    500: 'fill',
    1000: '3d'
};
```

---

## 📝 Pour Modifier les Objectifs

### 1. Modifier les Seuils de Clics

Éditez les fichiers suivants avec vos nouvelles valeurs :

**Backend** : `backend/app.js`
```javascript
const FEATURES = {
    [NOUVEAU_SEUIL]: 'name',
    [NOUVEAU_SEUIL]: 'color',
    [NOUVEAU_SEUIL]: 'fill',
    [NOUVEAU_SEUIL]: '3d'
};
```

**Frontend** : `frontend/script.js`
```javascript
const FEATURES = {
    [NOUVEAU_SEUIL]: 'name',
    [NOUVEAU_SEUIL]: 'color',
    [NOUVEAU_SEUIL]: 'fill',
    [NOUVEAU_SEUIL]: '3d'
};
```

### 2. Ajouter de Nouveaux Objectifs

Pour ajouter un nouvel objectif :

1. Ajoutez la fonctionnalité dans `FEATURES` :
```javascript
const FEATURES = {
    100: 'name',
    200: 'color',
    500: 'fill',
    750: 'nouveau_objectif',  // NOUVEAU
    1000: '3d'
};
```

2. Implémentez la logique correspondante dans le backend et frontend

---

## 🎨 Objectifs Possibles (Suggestions)

Voici des idées d'objectifs supplémentaires que vous pourriez ajouter :

| Fonctionnalité | Description | Implémentation |
|----------------|-------------|----------------|
| **Taille** | Modifier la taille du cube | Scaling du cube dans Three.js |
| **Rotation** | Contrôler la vitesse de rotation | Modifier la vitesse dans animate() |
| **Particules** | Ajouter des particules autour du cube | THREE.Points avec ParticleSystem |
| **Son** | Jouer un son au clic | Web Audio API |
| **Forme** | Changer la forme (sphère, pyramide) | Changer la géométrie Three.js |
| **Multi-cubes** | Afficher plusieurs cubes | Dupliquer les mesh dans la scène |
| **Texte flottant** | Afficher des messages autour du cube | THREE.TextGeometry |
| **Effets visuels** | Glow, bloom, post-processing | THREE.EffectComposer |

---

## 🔄 Workflow Actuel

```
1. Page Load
   ↓
2. Affichage "Welcome to the Cube"
   ↓
3. Carré noir vide au centre
   ↓
4. Joueur clique sur le cube (stockage local)
   ↓
5. À 100 clics → Pop-up "Name the Cube"
   ↓
6. Joueur entre un nom
   ↓
7. ✅ Cube créé en base avec le nom comme clé unique
   ↓
8. Synchronisation temps réel activée
   ↓
9. Autres joueurs peuvent rejoindre via le nom
   ↓
10. Progression continue : 200, 500, 1000 clics...
```

---

## 📌 Notes Importantes

- **Le nom du cube est unique** : Deux cubes ne peuvent pas avoir le même nom
- **Pas de cube ID technique** : On utilise le nom directement
- **Validation du nom** : Besoin de valider que le nom n'existe pas déjà avant création
- **Stockage local** : Avant 100 clics, les données sont en localStorage
- **Synchronisation** : Après nommage, WebSocket pour temps réel

---

## 🎯 Prochaines Modifications à Faire

Selon vos besoins, modifiez :
1. Les seuils de clics dans `FEATURES`
2. Les conditions de déblocage
3. Les effets visuels associés
4. Le texte des pop-ups dans `frontend/index.html`

**Fichiers à éditer :**
- `backend/app.js` (ligne ~63-68)
- `frontend/script.js` (ligne ~29-34)
- `frontend/index.html` (textes des modales)
