# Gestion de la base de données MongoDB

## Vue d'ensemble

L'application Cube Evolution utilise MongoDB comme base de données, déployée via Docker Compose. Les données sont persistées dans le dossier `db_data/` sur votre machine hôte.

## Structure de la base de données

- **Base de données**: `cube_evolution`
- **Collection**: `cubes`
- **Volume Docker**: `./db_data:/data/db`

---

## 🔍 Accéder à MongoDB dans Docker

### Option 1 : Via le shell MongoDB (mongosh)

```bash
# Entrer dans le conteneur MongoDB
docker exec -it cube-db-1 mongosh

# Ou en une seule commande
docker exec -it cube-db-1 mongosh cube_evolution
```

### Option 2 : Via bash dans le conteneur

```bash
# Entrer dans le conteneur
docker exec -it cube-db-1 bash

# Puis lancer mongosh
mongosh cube_evolution
```

> **Note**: Le nom du conteneur peut varier. Utilisez `docker ps` pour voir le nom exact.

---

## 📊 Commandes MongoDB utiles

### 1. Lister toutes les bases de données

```javascript
show dbs
```

### 2. Utiliser la base de données cube_evolution

```javascript
use cube_evolution
```

### 3. Lister toutes les collections

```javascript
show collections
```

### 4. Voir tous les cubes

```javascript
db.cubes.find().pretty()
```

### 5. Compter le nombre de cubes

```javascript
db.cubes.countDocuments()
```

### 6. Voir les 5 cubes avec le plus de clics

```javascript
db.cubes.find().sort({ clicks: -1 }).limit(5).pretty()
```

---

## 🗑️ Supprimer des cubes

### Supprimer un cube spécifique par nom

```javascript
// Remplacez "NomDuCube" par le nom réel
db.cubes.deleteOne({ _id: "NomDuCube" })
```

**Exemple:**
```javascript
db.cubes.deleteOne({ _id: "TestCube" })
```

### Supprimer plusieurs cubes par critère

```javascript
// Supprimer tous les cubes avec moins de 100 clics
db.cubes.deleteMany({ clicks: { $lt: 100 } })
```

```javascript
// Supprimer tous les cubes créés avant une certaine date
db.cubes.deleteMany({
  createdAt: {
    $lt: ISODate("2024-01-01T00:00:00Z")
  }
})
```

### Supprimer TOUS les cubes (⚠️ ATTENTION)

```javascript
// Ceci supprimera TOUS les cubes de la base de données
db.cubes.deleteMany({})
```

### Vérifier le résultat d'une suppression

```javascript
// La commande retourne:
{
  acknowledged: true,
  deletedCount: 5  // Nombre de documents supprimés
}
```

---

## 🔄 Réinitialiser complètement la base de données

### Méthode 1 : Supprimer le volume Docker (recommandé)

```bash
# 1. Arrêter les conteneurs
docker-compose down

# 2. Supprimer le dossier de données
# Windows (PowerShell)
Remove-Item -Recurse -Force .\db_data

# Windows (CMD)
rmdir /s /q db_data

# Linux/Mac
rm -rf ./db_data

# 3. Redémarrer les conteneurs (le dossier sera recréé)
docker-compose up -d
```

### Méthode 2 : Drop la collection (depuis MongoDB)

```javascript
// Supprimer la collection entière
db.cubes.drop()

// Recréer les index si nécessaire (l'application le fait automatiquement)
```

### Méthode 3 : Drop la base de données entière

```javascript
// Supprimer toute la base de données
db.dropDatabase()
```

---

## 🛡️ Sauvegarder la base de données

### Créer une sauvegarde (dump)

```bash
# Créer un dossier de backup
mkdir backup

# Exporter la base de données
docker exec cube-db-1 mongodump --db=cube_evolution --out=/dump

# Copier le dump vers votre machine
docker cp cube-db-1:/dump ./backup
```

### Restaurer depuis une sauvegarde

```bash
# Copier le dump dans le conteneur
docker cp ./backup/dump cube-db-1:/dump

# Restaurer la base de données
docker exec cube-db-1 mongorestore --db=cube_evolution /dump/cube_evolution
```

---

## 📋 Scripts utiles

### Script pour supprimer les cubes de test

Créez un fichier `cleanup_test_cubes.js`:

```javascript
// Supprimer les cubes avec "test" dans le nom (insensible à la casse)
db.cubes.deleteMany({
  _id: { $regex: /test/i }
})

// Afficher le résultat
print("Cubes de test supprimés")
```

Exécutez-le:

```bash
docker exec -i cube-db-1 mongosh cube_evolution < cleanup_test_cubes.js
```

### Script pour nettoyer les vieux cubes inactifs

```javascript
// Supprimer les cubes sans interaction depuis 30 jours
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

db.cubes.deleteMany({
  lastInteraction: { $lt: thirtyDaysAgo }
})
```

---

## 🔍 Requêtes avancées

### Trouver des cubes avec des critères spécifiques

```javascript
// Cubes en mode 3D
db.cubes.find({ is3D: true }).pretty()

// Cubes avec plus de 1000 clics
db.cubes.find({ clicks: { $gt: 1000 } }).pretty()

// Cubes qui ont débloqué le paint mode
db.cubes.find({
  unlocked: { $in: ["paint_mode"] }
}).pretty()

// Cubes créés aujourd'hui
db.cubes.find({
  createdAt: {
    $gte: new Date(new Date().setHours(0,0,0,0))
  }
}).pretty()
```

### Statistiques

```javascript
// Total de clics sur tous les cubes
db.cubes.aggregate([
  { $group: {
      _id: null,
      totalClicks: { $sum: "$clicks" }
    }
  }
])

// Moyenne de clics par cube
db.cubes.aggregate([
  { $group: {
      _id: null,
      avgClicks: { $avg: "$clicks" }
    }
  }
])

// Nombre de cubes par feature débloquée
db.cubes.aggregate([
  { $unwind: "$unlocked" },
  { $group: {
      _id: "$unlocked",
      count: { $sum: 1 }
    }
  },
  { $sort: { count: -1 } }
])
```

---

## ⚠️ Bonnes pratiques

### ✅ À FAIRE

- **Toujours sauvegarder** avant de supprimer en masse
- **Tester vos requêtes** avec `find()` avant d'utiliser `deleteMany()`
- **Utiliser des critères précis** pour éviter les suppressions accidentelles
- **Documenter vos modifications** (qui a supprimé quoi, quand)

### ❌ À ÉVITER

- **Ne pas supprimer le dossier `db_data/`** quand les conteneurs sont en cours d'exécution
- **Ne pas utiliser `deleteMany({})` en production** sans backup
- **Ne pas modifier directement les fichiers** dans `db_data/`
- **Ne pas exécuter des commandes** sans comprendre leur impact

---

## 🚨 En cas de problème

### La base de données est corrompue

```bash
# 1. Arrêter les conteneurs
docker-compose down

# 2. Supprimer le volume
rm -rf ./db_data  # ou rmdir /s /q db_data sur Windows

# 3. Restaurer depuis un backup (si disponible)
docker-compose up -d
docker cp ./backup/dump cube-db-1:/dump
docker exec cube-db-1 mongorestore --db=cube_evolution /dump/cube_evolution
```

### Impossible de se connecter à MongoDB

```bash
# Vérifier que le conteneur est en cours d'exécution
docker ps

# Voir les logs du conteneur
docker logs cube-db-1

# Redémarrer le conteneur
docker-compose restart db
```

### Erreurs de permission sur db_data/

```bash
# Sur Linux/Mac, vérifier les permissions
ls -la db_data/

# Corriger les permissions si nécessaire
sudo chown -R 999:999 db_data/  # 999 est l'UID de MongoDB dans Docker
```

---

## 📚 Ressources supplémentaires

- [Documentation MongoDB](https://docs.mongodb.com/)
- [MongoDB CRUD Operations](https://docs.mongodb.com/manual/crud/)
- [MongoDB Aggregation](https://docs.mongodb.com/manual/aggregation/)
- [Mongosh Reference](https://docs.mongodb.com/mongodb-shell/)

---

## 🎯 Exemples de maintenance courante

### Nettoyage hebdomadaire

```javascript
// Supprimer les cubes avec moins de 10 clics et inactifs depuis 7 jours
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

db.cubes.deleteMany({
  clicks: { $lt: 10 },
  lastInteraction: { $lt: sevenDaysAgo }
})
```

### Audit mensuel

```javascript
// Générer un rapport mensuel
db.cubes.aggregate([
  { $facet: {
      "totalCubes": [{ $count: "count" }],
      "totalClicks": [{ $group: { _id: null, sum: { $sum: "$clicks" } } }],
      "cubes3D": [{ $match: { is3D: true } }, { $count: "count" }],
      "topCubes": [{ $sort: { clicks: -1 } }, { $limit: 10 }]
    }
  }
])
```

---

**Date de création**: 2025
**Dernière mise à jour**: 2025
**Version de l'application**: 1.0
